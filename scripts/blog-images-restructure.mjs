#!/usr/bin/env node
/**
 * 一次性脚本：博客图片目录结构迁移
 *
 * 旧结构：source/blogs/聚禾生物cispoly/<slug>/{cover.jpg, img-01.png, ...}
 * 新结构：
 *   - 封面 → source/blogs/聚禾生物cispoly/images/covers/<slug>.<ext>
 *   - 内容图 → source/blogs/聚禾生物cispoly/images/contents/<slug>-img-01.<ext> ...
 *
 * 同时更新每个 md 的 frontmatter cover 字段与正文图片相对引用。
 * 用法：node scripts/blog-images-restructure.mjs [--dry-run]
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, rmdirSync, statSync } from 'node:fs'
import { join, dirname, basename, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const BLOG_DIR = join(ROOT, 'source', 'blogs', '聚禾生物cispoly')
const COVERS_DIR = join(BLOG_DIR, 'images', 'covers')
const CONTENTS_DIR = join(BLOG_DIR, 'images', 'contents')
const DRY = process.argv.includes('--dry-run')

function slugFromName(name) {
  return name.replace(/^\[[^\]]*\]/, '').replace(/\.md$/, '').replace(/[^\w\u4e00-\u9fa5-]/g, '-')
}

function main() {
  mkdirSync(COVERS_DIR, { recursive: true })
  mkdirSync(CONTENTS_DIR, { recursive: true })

  const files = readdirSync(BLOG_DIR).filter((f) => f.toLowerCase().endsWith('.md')).sort()
  let moved = 0
  let dirsRemoved = 0

  for (const name of files) {
    const slug = slugFromName(name)
    const oldDir = join(BLOG_DIR, slug)
    if (!existsSync(oldDir)) continue

    const mdPath = join(BLOG_DIR, name)
    let md = readFileSync(mdPath, 'utf-8').replace(/\r\n/g, '\n')

    // 1) 收集该文章目录下的图片文件
    const entries = readdirSync(oldDir).filter((f) => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(f)).sort()
    const renameMap = new Map() // oldRelative(./slug/xx) → newRelative(./images/.../xx)

    for (const f of entries) {
      const ext = extname(f).toLowerCase()
      const base = basename(f, ext)
      let newRel
      if (base === 'cover') {
        newRel = `./images/covers/${slug}${ext}`
      } else if (/^img-\d+$/.test(base)) {
        newRel = `./images/contents/${slug}-${base}${ext}`
      } else {
        console.warn(`[skip] 非常规文件名: ${oldDir}/${f}`)
        continue
      }
      renameMap.set(`./${slug}/${f}`, newRel)
      if (!DRY) {
        const oldPath = join(oldDir, f)
        const newPath = join(BLOG_DIR, newRel.replace(/^\.\//, ''))
        if (existsSync(newPath) && statSync(oldPath).size !== statSync(newPath).size) {
          console.warn(`[warn] 目标已存在且不同: ${newRel}`)
        }
        renameSync(oldPath, newPath)
        moved++
      } else {
        moved++
      }
    }

    // 2) 更新 md 引用
    let changed = false
    for (const [oldRef, newRef] of renameMap) {
      const before = md
      md = md.replaceAll(oldRef, newRef)
      if (md !== before) changed = true
    }
    if (!DRY && changed) writeFileSync(mdPath, md, 'utf-8')

    // 3) 删除空目录
    if (!DRY) {
      const rest = readdirSync(oldDir)
      if (rest.length === 0) {
        try { rmdirSync(oldDir) } catch { /* ignore */ }
        dirsRemoved++
      }
    } else {
      dirsRemoved++
    }

    if (renameMap.size) {
      console.log(`[${DRY ? 'dry' : 'ok'}] ${name.slice(0, 30)}… ${renameMap.size} 图`)
    }
  }

  console.log(`\n===== 迁移完成 =====`)
  console.log(`移动图片 ${moved} 张（${DRY ? 'dry-run 未实际移动' : '已移动'}）`)
  console.log(`涉及文章目录 ${dirsRemoved} 个`)
}

main()
