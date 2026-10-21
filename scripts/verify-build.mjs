import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const DATA = join(ROOT, 'src', 'data')
const CLIENT = join(ROOT, 'build', 'client')

const readJson = (name) => JSON.parse(readFileSync(join(DATA, name), 'utf8'))
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}
const bilingual = (path) => [path, path === '/' ? '/en' : `/en${path}`]

const blogs = readJson('blogs.json')
const blogTranslations = readJson('blogs.en.json')
const products = readJson('products.json')

const staticPaths = ['/', '/about', '/contact', '/privacy', '/papers', '/guidelines', '/blog', '/products']
const detailPaths = [
  ...products.map((item) => `/products/${item.slug}`),
  ...blogs.map((item) => `/blog/${item.slug}`),
]
const paths = [...staticPaths, ...detailPaths].flatMap(bilingual)

function htmlFile(path) {
  return path === '/' ? join(CLIENT, 'index.html') : join(CLIENT, ...path.slice(1).split('/'), 'index.html')
}

for (const path of paths) {
  const file = htmlFile(path)
  assert(existsSync(file), `缺少预渲染 HTML：${path}`)
  const html = readFileSync(file, 'utf8')
  const lang = path === '/en' || path.startsWith('/en/') ? 'en' : 'zh-CN'
  assert(html.includes(`<html lang="${lang}">`), `HTML lang 不正确：${path}`)
  assert(html.includes('<title>'), `缺少 title：${path}`)
  assert(html.includes('name="description"'), `缺少 description：${path}`)
  assert(html.includes('rel="canonical"'), `缺少 canonical：${path}`)
  assert(html.includes('hrefLang="zh-CN"') && html.includes('hrefLang="en"'), `缺少 hreflang：${path}`)
}

const loaderPaths = blogs.map((item) => `/blog/${item.slug}`).flatMap(bilingual)

for (const path of loaderPaths) {
  const dataFile = join(CLIENT, `${path.slice(1)}.data`)
  assert(existsSync(dataFile), `缺少路由数据：${path}`)
}

const assets = readdirSync(join(CLIENT, 'assets'))
assert(!assets.some((name) => /blogs\.body|paper-fields/i.test(name)), '浏览器产物仍包含全量正文数据包')
assert(existsSync(join(CLIENT, 'sitemap.xml')), '缺少 sitemap.xml')
assert(existsSync(join(CLIENT, 'robots.txt')), '缺少 robots.txt')
assert(existsSync(join(CLIENT, '404.html')), '缺少静态托管 404 fallback')
assert(!existsSync(join(CLIENT, '__spa-fallback.html')), '不应部署 SPA fallback（会导致软 404）')
const notFoundHtml = readFileSync(join(CLIENT, '404.html'), 'utf8')
assert(notFoundHtml.includes('noindex'), '404.html 缺少 noindex')
assert(notFoundHtml.includes('404'), '404.html 缺少 404 标识')
assert(existsSync(join(CLIENT, 'llms.txt')), '缺少 llms.txt（AI 引擎发现层）')
assert(existsSync(join(CLIENT, 'llms-full.txt')), '缺少 llms-full.txt')

const llms = readFileSync(join(CLIENT, 'llms.txt'), 'utf8')
assert(llms.startsWith('# '), 'llms.txt 应以 H1 标题开头')
assert(llms.includes('## Products'), 'llms.txt 缺少产品区块')
assert(llms.includes('https://www.cispoly.com/products/ciscer/'), 'llms.txt 缺少产品链接')
assert(llms.includes('## Blog'), 'llms.txt 缺少博客区块')
const llmsFull = readFileSync(join(CLIENT, 'llms-full.txt'), 'utf8')
assert(llmsFull.length > llms.length, 'llms-full.txt 应比 llms.txt 内容更全')

const sitemap = readFileSync(join(CLIENT, 'sitemap.xml'), 'utf8')
assert(sitemap.includes('https://www.cispoly.com/products/</loc>'), 'sitemap 缺少产品总览页')
assert(sitemap.includes('https://www.cispoly.com/papers/'), 'sitemap 缺少论文列表页')
assert(sitemap.includes('https://www.cispoly.com/guidelines/'), 'sitemap 缺少指南列表页')
assert(sitemap.includes('https://www.cispoly.com/blog/'), 'sitemap 缺少博客详情页')
assert(sitemap.includes('xmlns:xhtml='), 'sitemap 缺少 xhtml 命名空间（hreflang alternates）')
assert(sitemap.includes('hreflang="zh-CN"') && sitemap.includes('hreflang="en"'), 'sitemap 缺少 hreflang alternates')
assert(sitemap.includes('hreflang="x-default"'), 'sitemap 缺少 x-default')

const robots = readFileSync(join(CLIENT, 'robots.txt'), 'utf8')
assert(robots.includes('User-agent: *\nAllow: /'), 'robots.txt 未开放公开页面抓取')
assert(robots.includes('Sitemap: https://www.cispoly.com/sitemap.xml'), 'robots.txt 缺少 sitemap 地址')

const sampleBlog = blogs[0]
const sampleHtml = readFileSync(htmlFile(`/blog/${sampleBlog.slug}`), 'utf8')
assert(sampleHtml.includes(sampleBlog.title), '博客正文页未写入预渲染内容')
assert(!sampleHtml.includes('node="[object Object]"'), 'Markdown AST 属性泄漏到 HTML')
assert(sampleHtml.includes('"@type":"Article"'), '博客页缺少 Article schema')
assert(sampleHtml.includes('"@type":"BreadcrumbList"'), '博客页缺少 BreadcrumbList schema')

for (const product of products) {
  const html = readFileSync(htmlFile(`/products/${product.slug}`), 'utf8')
  assert(html.includes('"@type":"MedicalDevice"'), `产品页缺少 MedicalDevice schema：${product.slug}`)
  assert(html.includes('"@type":"FAQPage"'), `产品页缺少 FAQPage schema：${product.slug}`)
  assert(html.includes('"@type":"BreadcrumbList"'), `产品页缺少 BreadcrumbList schema：${product.slug}`)
  assert(html.includes('常见问题') || html.includes('FAQ'), `产品页缺少 FAQ 区块：${product.slug}`)
}

// 标题截断防护：配置了 seoTitle 的文章，其 <title> 不得超过搜索结果显示宽度
// （中文按 2px/字、英文按 1px/字符估算，上限 600px 减去余量）
const displayWidth = (s) => [...s].reduce((w, ch) => w + (ch.codePointAt(0) > 0x2e7f ? 2 : 1), 0)
for (const blog of blogs) {
  if (!blog.seoTitle) continue
  const width = displayWidth(`${blog.seoTitle} | CISPOLY`)
  assert(width <= 62, `seoTitle 过宽（${width}px > 62px）：${blog.slug}`)
  const seoTitleEn = (blogTranslations[blog.slug] || {}).seoTitleEn
  if (seoTitleEn) {
    const widthEn = seoTitleEn.length + ' | CISPOLY'.length
    assert(widthEn <= 62, `英文 seoTitle 过长（${widthEn} > 62）：${blog.slug}`)
  }
}

console.log(`构建校验通过：${paths.length} 条双语内容路由，${loaderPaths.length} 个独立数据文件`)
