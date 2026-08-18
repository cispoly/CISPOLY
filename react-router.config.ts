import type { Config } from '@react-router/dev/config'
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'

type ContentRoute = { id?: string; slug?: string; cancer?: string }

function readGenerated(name: string): ContentRoute[] {
  return JSON.parse(readFileSync(new URL(`./src/data/${name}.json`, import.meta.url), 'utf8'))
}

function bilingual(path: string) {
  return [path, path === '/' ? '/en' : `/en${path}`]
}

function prerenderPaths() {
  const papers = readGenerated('papers')
  const guidelines = readGenerated('guidelines')
  const blogs = readGenerated('blogs')
  const products = readGenerated('products')

  const staticPaths = ['/', '/about', '/contact', '/papers', '/guidelines', '/blog', '/products']
  const dynamicPaths = [
    ...products.map((item) => `/products/${item.slug}`),
    ...papers.map((item) => `/papers/${item.cancer}/${item.id}`),
    ...guidelines.map((item) => `/guidelines/${item.cancer}/${item.id}`),
    ...blogs.map((item) => `/blog/${item.slug}`),
  ]

  return [...staticPaths, ...dynamicPaths].flatMap(bilingual)
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
    const urls = prerenderPaths()
      .filter((path) => path !== '/products' && path !== '/en/products')
      .map((path) => `  <url><loc>${new URL(path, origin).href}</loc></url>`)
      .join('\n')
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
    writeFileSync(new URL('./build/client/sitemap.xml', import.meta.url), sitemap)
    writeFileSync(
      new URL('./build/client/robots.txt', import.meta.url),
      `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,
    )
    copyFileSync(
      new URL('./build/client/__spa-fallback.html', import.meta.url),
      new URL('./build/client/404.html', import.meta.url),
    )
  },
} satisfies Config
