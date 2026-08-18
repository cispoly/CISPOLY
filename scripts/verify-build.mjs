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

const papers = readJson('papers.json')
const guidelines = readJson('guidelines.json')
const blogs = readJson('blogs.json')
const products = readJson('products.json')

const staticPaths = ['/', '/about', '/contact', '/papers', '/guidelines', '/blog', '/products']
const detailPaths = [
  ...products.map((item) => `/products/${item.slug}`),
  ...papers.map((item) => `/papers/${item.cancer}/${item.id}`),
  ...guidelines.map((item) => `/guidelines/${item.cancer}/${item.id}`),
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

const loaderPaths = [
  ...papers.map((item) => `/papers/${item.cancer}/${item.id}`),
  ...guidelines.map((item) => `/guidelines/${item.cancer}/${item.id}`),
  ...blogs.map((item) => `/blog/${item.slug}`),
].flatMap(bilingual)

for (const path of loaderPaths) {
  const dataFile = join(CLIENT, `${path.slice(1)}.data`)
  assert(existsSync(dataFile), `缺少路由数据：${path}`)
}

const assets = readdirSync(join(CLIENT, 'assets'))
assert(!assets.some((name) => /blogs\.body|paper-fields/i.test(name)), '浏览器产物仍包含全量正文数据包')
assert(existsSync(join(CLIENT, 'sitemap.xml')), '缺少 sitemap.xml')
assert(existsSync(join(CLIENT, 'robots.txt')), '缺少 robots.txt')
assert(existsSync(join(CLIENT, '404.html')), '缺少静态托管 404 fallback')

const sitemap = readFileSync(join(CLIENT, 'sitemap.xml'), 'utf8')
assert(sitemap.includes('https://www.cispoly.com/products/</loc>'), 'sitemap 缺少产品总览页')
assert(sitemap.includes('https://www.cispoly.com/papers/'), 'sitemap 缺少论文详情页')
assert(sitemap.includes('https://www.cispoly.com/guidelines/'), 'sitemap 缺少指南详情页')
assert(sitemap.includes('https://www.cispoly.com/blog/'), 'sitemap 缺少博客详情页')

const robots = readFileSync(join(CLIENT, 'robots.txt'), 'utf8')
assert(robots.includes('User-agent: *\nAllow: /'), 'robots.txt 未开放公开页面抓取')
assert(robots.includes('Sitemap: https://www.cispoly.com/sitemap.xml'), 'robots.txt 缺少 sitemap 地址')

const sampleBlog = blogs[0]
const sampleHtml = readFileSync(htmlFile(`/blog/${sampleBlog.slug}`), 'utf8')
assert(sampleHtml.includes(sampleBlog.title), '博客正文页未写入预渲染内容')
assert(!sampleHtml.includes('node="[object Object]"'), 'Markdown AST 属性泄漏到 HTML')

console.log(`构建校验通过：${paths.length} 条双语内容路由，${loaderPaths.length} 个独立数据文件`)
