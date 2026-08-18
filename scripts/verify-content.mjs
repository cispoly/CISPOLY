import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const DATA = join(ROOT, 'src', 'data')

function readJson(name) {
  return JSON.parse(readFileSync(join(DATA, name), 'utf8'))
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertUnique(items, key, label) {
  const values = items.map((item) => item[key])
  assert(new Set(values).size === values.length, `${label} 存在重复 ${key}`)
  assert(values.every(Boolean), `${label} 存在空 ${key}`)
}

const papers = readJson('papers.json')
const guidelines = readJson('guidelines.json')
const blogs = readJson('blogs.json')
const products = readJson('products.json')
const index = readJson('index.json')
const paperTranslations = readJson('papers.en.json')
const guidelineTranslations = readJson('guidelines.en.json')
const blogTranslations = readJson('blogs.en.json')
const productTranslations = readJson('products.en.json')

assertUnique(papers, 'id', '论文')
assertUnique(guidelines, 'id', '指南')
assertUnique(blogs, 'slug', '博客')
assertUnique(products, 'slug', '产品')

assert(index.counts.papers === papers.length, '论文数量与 index.json 不一致')
assert(index.counts.guidelines === guidelines.length, '指南数量与 index.json 不一致')
assert(index.counts.blogs === blogs.length, '博客数量与 index.json 不一致')
assert(index.counts.products === products.length, '产品数量与 index.json 不一致')

for (const paper of papers) {
  assert(paperTranslations[paper.id], `论文缺少英文映射：${paper.id}`)
  assert(
    existsSync(join(ROOT, 'public', 'posters', paper.cancer, paper.id, 'poster.html')),
    `论文缺少海报：${paper.cancer}/${paper.id}`,
  )
}

for (const guideline of guidelines) {
  assert(guidelineTranslations[guideline.id], `指南缺少英文映射：${guideline.id}`)
  assert(
    existsSync(join(ROOT, 'public', 'posters', guideline.cancer, guideline.id, 'poster.html')),
    `指南缺少海报：${guideline.cancer}/${guideline.id}`,
  )
}

for (const blog of blogs) {
  assert(blogTranslations[blog.slug], `博客缺少英文映射：${blog.slug}`)
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(blog.slug), `博客 slug 不符合 URL 约定：${blog.slug}`)
}

for (const product of products) {
  assert(productTranslations[product.slug], `产品缺少英文映射：${product.slug}`)
}

console.log(`内容校验通过：${papers.length} 篇论文、${guidelines.length} 篇指南、${blogs.length} 篇博客、${products.length} 个产品`)
