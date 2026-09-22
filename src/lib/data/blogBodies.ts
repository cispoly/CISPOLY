type BodyModule = () => Promise<unknown>

// Vite 会把每篇正文拆成独立的小模块，访问文章时才下载对应文件。
const zhBodies = import.meta.glob('/src/data/blog-bodies/zh/*.json', {
  import: 'default',
}) as Record<string, BodyModule>

const enBodies = import.meta.glob('/src/data/blog-bodies/en/*.json', {
  import: 'default',
}) as Record<string, BodyModule>

/** 按语言和 slug 加载单篇博客正文。 */
export async function getBlogBody(slug: string, lang: 'zh' | 'en') {
  const directory = lang === 'en' ? '/src/data/blog-bodies/en/' : '/src/data/blog-bodies/zh/'
  const module = (lang === 'en' ? enBodies : zhBodies)[`${directory}${slug}.json`]
  if (!module) return ''
  return String(await module())
}
