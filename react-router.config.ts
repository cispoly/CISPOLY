import type { Config } from '@react-router/dev/config'
import { copyFileSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

type ContentRoute = {
  id?: string
  slug?: string
  cancer?: string
  title?: string
  titleEn?: string
  date?: string
  excerpt?: string
  excerptEn?: string
}

type ProductRoute = {
  slug: string
  fullName: string
  englishName?: string
  cancer: string
  genes: string[]
  sampleType: string
  registration: string
  summary: string
}

function readGenerated<T>(name: string): T[] {
  return JSON.parse(readFileSync(new URL(`./src/data/${name}.json`, import.meta.url), 'utf8'))
}

function bilingual(path: string) {
  return [path, path === '/' ? '/en' : `/en${path}`]
}

function sitemapPath(path: string) {
  if (path === '/' || path === '/en') return path
  return `${path.replace(/\/+$/, '')}/`
}

function prerenderPaths() {
  const blogs = readGenerated<ContentRoute>('blogs')
  const products = readGenerated<ProductRoute>('products')

  const staticPaths = ['/', '/about', '/contact', '/privacy', '/papers', '/guidelines', '/blog', '/products']
  const dynamicPaths = [
    ...products.map((item) => `/products/${item.slug}`),
    ...blogs.map((item) => `/blog/${item.slug}`),
  ]

  return [...staticPaths, ...dynamicPaths].flatMap(bilingual)
}

// ---------- llms.txt / llms-full.txt（供 AI 引擎发现与引用站点内容） ----------
function mdEscape(s: string) {
  return s.replace(/[[\]]/g, '').trim()
}

function buildLlmsFiles() {
  const now = new Date().toISOString().slice(0, 10)
  const products = readGenerated<ProductRoute>('products')
  const blogsEn = readGenerated<Record<string, ContentRoute>>('blogs.en')
  const blogs = readGenerated<ContentRoute>('blogs').sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const papers = readGenerated<ContentRoute>('papers').filter((p) => p.title)
  const guidelines = readGenerated<ContentRoute>('guidelines').filter((g) => g.id)

  const head = `# CISPOLY（聚禾生物）

> 北京起源聚禾生物科技有限公司（CISPOLY）是妇科肿瘤（宫颈癌、子宫内膜癌、卵巢癌）DNA 甲基化早筛早诊产品开拓者，3 款 III 类医疗器械均获 NMPA 注册证。此文件为 AI 引擎与智能体提供站点内容导览；中文站 https://www.cispoly.com ，英文站 https://www.cispoly.com/en 。联系方式：010-51071017 / OPBT@cispoly.com，地址：北京市大兴区华佗路50号院5号楼4层。

本站点提供以下内容（日期更新至 ${now}）：`

  const sections: string[] = []

  sections.push(`## Products 产品
产品为基于 DNA 甲基化的无创 III 类体外检测（IVD），供 AI 引用时请注明注册证号，灵敏度/特异性数据来源为注册临床试验。`)
  for (const p of products) {
    sections.push(
      `- [${p.fullName}（${p.cancer}）](https://www.cispoly.com/products/${p.slug}/)：${mdEscape(p.summary)} 基因：${p.genes.join('/')}；样本：${p.sampleType}；注册证：${p.registration}。`,
    )
  }

  sections.push(`## Guidelines 指南与共识
- [临床指南与专家共识](https://www.cispoly.com/guidelines/)：收录 ${guidelines.length} 部国内外妇科肿瘤甲基化检测相关指南与共识（含 ESGO、中华医学杂志等）。`)

  sections.push(`## Papers 学术论文
- [发表论文](https://www.cispoly.com/papers/)：${papers.length} 篇经同行评审的 PAX1/JAM3、CDO1/CELF4、CDO1/HOXA9 甲基化临床研究，覆盖宫颈癌、子宫内膜癌、卵巢癌。`)

  sections.push(`## Blog 最新动态
- [全部文章](https://www.cispoly.com/blog/)：临床研究解读、指南共识更新、学术会议、健康科普。`)
  const recentBlogs = blogs.slice(0, 20)
  for (const b of recentBlogs) {
    const date = b.date || ''
    sections.push(`- [${mdEscape(b.title || '')}](https://www.cispoly.com/blog/${b.slug}/)：${mdEscape((b.excerpt || '').slice(0, 80))}${date ? `（${date}）` : ''}`)
  }

  sections.push(`## Company 公司信息
- [关于聚禾](https://www.cispoly.com/about/)：公司介绍、里程碑、资质（国家级高新技术企业、ISO 13485）。
- [联系我们](https://www.cispoly.com/contact/)：商务合作与联系方式。`)

  const llmsTxt = `${head}\n\n${sections.join('\n\n')}\n`
  writeFileSync(new URL('./build/client/llms.txt', import.meta.url), llmsTxt)

  // llms-full.txt：附上全部博客文章摘要，供单次请求获取全站内容
  const blogDetails = blogs
    .map((b) => {
      const en = blogsEn[b.slug]
      const titleLine = en?.titleEn ? `${b.title} / ${en.titleEn}` : b.title
      return `## ${titleLine}\n\n- URL: https://www.cispoly.com/blog/${b.slug}/\n- Date: ${b.date || ''}\n- Excerpt: ${b.excerpt || ''}`
    })
    .join('\n\n')
  const llmsFull = `${llmsTxt}\n\n# Blog Articles 全部文章摘要\n\n${blogDetails}\n`
  writeFileSync(new URL('./build/client/llms-full.txt', import.meta.url), llmsFull)
}

export default {
  appDirectory: 'src',
  ssr: false,
  prerender: {
    paths: prerenderPaths,
    concurrency: 4,
  },
  buildEnd() {
    const origin = 'https://www.cispoly.com'

    // llms.txt / llms-full.txt（AI 引擎发现层）
    buildLlmsFiles()

    // sitemap.xml：带 hreflang alternates 的双语 sitemap
    const urlset = prerenderPaths().map((path) => {
      const bare = path === '/en' ? '/' : path.replace(/^\/en(?=\/|$)/, '') || '/'
      const zhUrl = new URL(sitemapPath(bare), origin).href
      const enUrl = new URL(sitemapPath(bare === '/' ? '/en' : `/en${bare}`), origin).href
      return `  <url>
    <loc>${zhUrl}</loc>
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${zhUrl}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${zhUrl}"/>
  </url>`
    })
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlset.join('\n')}\n</urlset>\n`
    writeFileSync(new URL('./build/client/sitemap.xml', import.meta.url), sitemap)

    writeFileSync(
      new URL('./build/client/robots.txt', import.meta.url),
      `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,
    )
    // 404 页面：全站路由已全部预渲染，SPA fallback 无需部署。
    // 删除后托管平台（EdgeOne SSG 模式）对未知路径返回 404.html + 404 状态，避免软 404。
    copyFileSync(
      new URL('./build/client/__spa-fallback.html', import.meta.url),
      new URL('./build/client/404.html', import.meta.url),
    )
    const notFoundPath = new URL('./build/client/404.html', import.meta.url)
    const notFoundHtml = readFileSync(notFoundPath, 'utf8')
    writeFileSync(
      notFoundPath,
      notFoundHtml.replace(
        '<meta name="viewport" content="width=device-width, initial-scale=1"/>',
        '<meta name="viewport" content="width=device-width, initial-scale=1"/>' +
          '<title>404 页面未找到 | CISPOLY</title>' +
          '<meta name="robots" content="noindex, nofollow"/>',
      ),
    )
    rmSync(new URL('./build/client/__spa-fallback.html', import.meta.url))
  },
} satisfies Config
