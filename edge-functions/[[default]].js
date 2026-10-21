// 兜底路由（所有未被静态资源/预渲染页面匹配的请求）：
// 1. Accept: text/markdown → 返回该页面的 Markdown 版本（Vary: Accept 区分缓存）
// 2. 其余 → 返回 404 状态码 + 404.html 内容（修复软 404：未知路径此前返回 200 + 首页）
//
// 说明：EdgeOne Edge Functions 静态资源路由优先于本函数，
// 因此只有真正不存在的路径才会进入这里。同源静态文件用 fetch() 读取。

const SITE_ORIGIN = 'https://www.cispoly.com'
const NOT_FOUND_MD = `# 404 Not Found

The page you requested does not exist on ${SITE_ORIGIN}.

- Site content index for AI agents: ${SITE_ORIGIN}/llms.txt
- Full content bundle: ${SITE_ORIGIN}/llms-full.txt
- Sitemap: ${SITE_ORIGIN}/sitemap.xml
- Home: ${SITE_ORIGIN}/
`

function stripTags(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function htmlToMarkdown(html) {
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] || 'CISPOLY'
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] || ''
  const canonical = html.match(/rel="canonical" href="([^"]*)"/)?.[1] || SITE_ORIGIN

  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)
  let body = mainMatch ? mainMatch[1] : html

  body = body
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')

  body = body
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_m, t) => `\n\n# ${stripTags(t)}\n`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, t) => `\n\n## ${stripTags(t)}\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_m, t) => `\n\n### ${stripTags(t)}\n`)
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, t) => `[${stripTags(t)}](${href})`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, t) => `\n- ${stripTags(t)}`)
    .replace(/<\/(p|div|section|article|header|footer|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')

  body = stripTags(body).replace(/\n{3,}/g, '\n\n').trim()

  return `# ${title}\n\n> ${description}\n\nCanonical: ${canonical}\n\n${body}\n`
}

function mdResponse(body, status) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Vary: 'Accept',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}

export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)
  const accept = request.headers.get('Accept') || ''

  // ---- Markdown 内容协商 ----
  if (accept.includes('text/markdown')) {
    const htmlPath = url.pathname === '/' ? '/index.html' : `${url.pathname.replace(/\/+$/, '')}/index.html`
    try {
      const res = await fetch(new URL(htmlPath, url.origin), { headers: request.headers })
      if (res.ok) {
        const html = await res.text()
        return mdResponse(htmlToMarkdown(html), 200)
      }
    } catch (_) {
      // 落到 404 markdown
    }
    return mdResponse(NOT_FOUND_MD, 404)
  }

  // ---- 常规请求：返回真正的 404 ----
  // 优先回源读取 404.html 作为错误页内容
  try {
    const res = await fetch(new URL('/404.html', url.origin))
    if (res.ok) {
      return new Response(res.body, {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=0, must-revalidate',
        },
      })
    }
  } catch (_) {
    // ignore
  }
  return new Response(NOT_FOUND_MD, { status: 404, headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}
