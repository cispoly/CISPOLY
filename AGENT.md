# CISPOLY3 Agent Guide

本文件是给后续 AI/开发代理使用的项目指南。进入本仓库后先读这里，再改代码或内容。

## 项目概览

这是聚禾生物 CISPOLY 官网项目，技术栈为 React Router 8 Framework Mode + React 19 + Vite 8 + TypeScript + Tailwind CSS 3。站点以纯静态预渲染方式输出，展示三类妇科肿瘤早筛产品、学术论文、临床指南、企业动态和关于页。

核心形态不是纯手写页面，而是：

1. `contents/` 中维护 Markdown、图片等内容源（唯一事实源）。
2. `scripts/build-data.ts` 扫描并解析内容源。
3. 生成 `src/data/*.json` 和 `src/data/*.body.json`。
4. `src/lib/data/` 按产品、论文、指南、博客和公司信息拆分数据入口。
5. `src/pages/` 与 `src/components/` 渲染页面。

## 常用命令

```bash
npm run prebuild-data
npm run dev
npm run check
npm run build
npm run preview
```

- `npm run prebuild-data`: 使用 Node 直接运行 `scripts/build-data.ts`，用于内容改动后刷新 `src/data/`。
- `npm run dev`: 先构建数据，再启动 React Router Framework Mode 开发服务器，默认 `0.0.0.0:5173`。
- `npm run check`: 依次运行 ESLint、类型检查和内容完整性检查。
- `npm run build`: 生成内容、类型检查、预渲染全部双语路由，并校验最终构建产物。
- `npm run preview`: 预览 `build/client/` 静态构建产物。

## 目录地图

- `src/root.tsx`: Framework Mode 文档与全局布局入口，挂载 Header、Footer、i18n 和错误边界。
- `src/routes.ts`: 类型安全路由表，中英文路由通过可选 `en` 前缀共用路由模块。
- `react-router.config.ts`: 纯静态预渲染路径、并发、sitemap、robots 和 404 fallback 配置。
- `src/pages/`: 页面级组件。
- `src/components/`: 可复用展示组件，如 `Hero`、`Header`、`PaperCard`、`PosterDetail`。
- `src/lib/data/`: 按内容域拆分的浏览器数据访问层，避免无关页面下载全站索引。
- `src/lib/content.server.ts`: 仅在构建期 loader 中使用的正文与 PDF 字段入口，不进入浏览器 bundle。
- `src/lib/i18n.tsx`: URL 驱动的中英双语字典与语言切换逻辑；中文保留原路径，英文使用 `/en`。
- `src/lib/router.tsx`: 自动保持当前语言前缀的 Link、NavLink 与 Navigate 包装。
- `src/lib/seo.ts`: canonical、hreflang、Open Graph 和结构化数据生成工具。
- `src/lib/markdown.tsx`: Markdown 渲染相关逻辑。
- `src/styles/index.css`: Tailwind base/components，全局 `.shell`、`.card`、`.prose-cispoly` 等样式。
- `scripts/build-data.ts`: 数据构建主脚本，解析论文、指南、博客、产品和公司信息。
- `scripts/` 其余三个：`dev-watch.mjs`（dev 监听重建）、`fix-citations.ts`（引用修正，读 `contents/` 的引用列表）、`extract-fields-v2.ts`（PDF 字段抽取，读本地 `source/pdf/`）。历史一次性工具已移至 `source/tools/`（本地归档）。
- `contents/`: 站点内容源目录，唯一事实源，优先编辑这里（详见下文“内容源约定”）。
- `source/`: 本地原始素材归档，整体已 gitignore，不推 GitHub。内含论文/指南原始 PDF（`pdf/`）、历史剪藏工作区（`blogs/cispoly-news-update/`，其内容已于 2026-08-17 合并入 `contents/`）、海报草稿（`blogs/posters/`）、产品资料 PDF（`product_infomation/`）、历史脚本（`tools/`）。
- `public/`: 公开静态资源，包含 `logo.png`、favicon、海报（`posters/`）、期刊封面压缩版（`images/journal-covers/`）、hero 图压缩版（`hero/`）。注意 `public/blogs/` 是构建时从 `contents/blogs` 自动复制的可再生目录，已 gitignore。
- `design/`、`test/`、`建站思路.md`、`implementation_plan.md`: 本地建站过程资料与校验脚本，已 gitignore，不入库。

## 内容源约定

`contents/` 是站点唯一事实源，直接编辑即可，新增文件自动收录：

- 论文：`contents/academic_published_papers/<CISCER|CISENDO|CISOVA>/*.md`，另含 3 个 `cis*_paper_list.md` 引用列表。**文件名即论文 id**（如 `10_hsil_diagnosis_performance.md`），期刊封面（`public/images/journal-covers/<id>.jpg`）、修正层 JSON、精选标记和路由均按 id 索引，改名会使关联失效；新论文用下一个可用编号前缀命名。
- 指南：`contents/clinical_guidelines/<cervical_cancer_methylation|endometrial_cancer_methylation|ovarian_cancer_methylation>/*.md`，另含 `guidelines_list.md`。多癌种归属在 `build-data.ts` 的 `GUIDELINE_EXTRA_CANCERS` 中登记。
- 博客：`contents/blogs/*.md`（直接放在 blogs 下，不再有中间层）+ `contents/blogs/images/`（正文图 `contents/` 子目录、封面图 `covers/` 子目录，md 内用 `./images/...` 相对引用）。**frontmatter 必须写 `slug`**（小写英文+连字符、≤48 字符、全局唯一，决定 URL `/blog/<slug>` 与图片目录，中英文版必须一致）。**英文版为同目录同名 `.en.md`**，frontmatter 用 `slug`（与中文相同）/ `title` / `tags` / `excerpt` / `cover`（`./images/covers/<中文标题>.jpg`，与中文引用同一张源图），**正文与中文完全同构：开头写 `![cover_image](./images/covers/<中文标题>.jpg)`，图片用 `./images/contents/<中文标题>-img-NN.ext` 相对引用源图**，构建时与中文走同一套本地化管线（`localizeBlogImages` + `stripBlogHeader`，复制到 public 并改写为 `/blogs/<slug>/...`，封面行自动剥离）；前端自动按语言回退。**图片规则：封面必须是静态图片（jpg/png/webp），禁止 gif 做封面；来自微信文章的装饰 gif 一律删除不保留。**
- 引用列表：`contents/citation_lists/`（3 个癌种文献引用列表 + 指南共识引用列表 + 文献条目.csv），`build-data.ts` 构建时读取它们生成 citation 字段，`fix-citations.ts` 也以此为准。
- 首页图片：`contents/images/hero/`（hero 轮动原图，1920px JPEG）与 `contents/images/paper-covers/<CISCER|CISENDO|CISOVA>/`（文献轮动封面原图，1200px JPEG，与 `public/images/journal-covers/<id>.jpg` 一一对应）。替换图片后需同步更新 public 下的线上压缩版。

历史说明：论文/指南的原始剪藏工作区（`source/blogs/cispoly-news-update/raw/clippings/`）曾是第一编辑现场，其内容已于 2026-08-17 全部同步合并入 `contents/`，此后留在本地归档、不再维护；今后更新直接编辑 `contents/`。

产品和公司信息目前主要写在 `scripts/build-data.ts` 的 `PRODUCTS` 与 `COMPANY` 常量中。产品资料原始 PDF 在本地归档 `source/product_infomation/`。

## 数据构建规则

`src/data/` 里的文件分两类，规则不同：

**构建产物（11 个，已 gitignore，换机可直 build 再生，不要手工编辑）**：

- `papers.json` / `papers.body.json`
- `guidelines.json` / `guidelines.body.json`
- `blogs.json` / `blogs.body.json`
- `blogs.en.json` / `blogs.body.en.json`（由 `contents/blogs/*.en.md` 生成）
- `products.json` / `company.json` / `index.json`

**手工维护的输入（必须提交入库，丢了无法再生）**：

- 修正层：`citations.json`、`paper-overrides.json`、`paper-fields-v2.json`、`paper-affiliations.json`、`paper-fields.json`、`guideline-pdf-fields.json`、`guideline-citations.json`
- 英文翻译（字段级）：`papers.en.json`、`guidelines.en.json`、`products.en.json`、`company.en.json`（博客英文已 markdown 化到 `contents/blogs/*.en.md`，不再手工维护 JSON）
- 地图与医院数据：`china-map.json`（生成它的临时 geo 输入已删，不可再生）、`china-hospitals.ts`、`cisendo-hospitals.ts`、`cisova-hospitals.ts`

如果要调整引用、摘要、单位、DOI 或手工覆盖字段，优先改修正层 JSON 和 `contents/**/*.md`，改完运行 `npm run prebuild-data` 刷新生成文件。

数据拆分与预渲染策略：

- 列表页分别通过 `src/lib/data/papers.ts`、`guidelines.ts`、`blogs.ts` 使用各自索引。
- 博客正文保存在生成 JSON 中，但只能由 `content.server.ts` 的构建期 loader 读取。
- 每个详情路由生成独立 HTML 和 `.data` 文件；浏览器不会下载全量正文 JSON。
- `react-router.config.ts` 枚举全部中文路径和 `/en` 英文路径，构建产物位于 `build/client/`。

## 前端开发约定

- 使用 TypeScript strict 模式，路径别名为 `@/* -> src/*`。
- 使用 Tailwind 工具类和 `src/styles/index.css` 中已有组件类，不要随意引入新的样式体系。
- 站点视觉基调是暖白底、深炭文字、品牌赤红点缀，配置在 `tailwind.config.ts`。
- 页面容器优先使用 `.shell`。
- Markdown 正文优先使用 `.prose-cispoly`。
- 图标优先使用 `lucide-react`。
- 路由模块由 React Router Framework Mode 自动拆包；新增页面应在 `src/routes.ts` 注册并导出 route module API。
- 中英双语文案优先放入 `src/lib/i18n.tsx`，组件内通过 `useI18n()` 获取 `t`、`lang`；内部链接使用 `src/lib/router.tsx` 的组件以保持语言前缀。
- 数据项如产品、公司信息已有可选英文字段，展示时按当前语言选择对应字段。

## 医学与内容准确性

本项目内容涉及肿瘤筛查、诊断性能、注册证、指南共识和论文引用。改动时要保守：

- 不凭印象改医学结论、灵敏度、特异性、注册证号、适用人群或指南推荐。
- 优先以本地归档的 `source/pdf/` 原始 PDF、产品资料 PDF、论文正文、`contents/citation_lists/` 引用列表或已整理的修正层 JSON 为依据。
- 修改标题、DOI、年份、期刊、作者、单位和引用格式后，运行 `npm run prebuild-data` 检查生成结果。
- 微信公众号导入内容常含 UI 噪声，清洗规则集中在 `build-data.ts` 的 `WECHAT_NOISE_PATTERNS`。

## 验证清单

代码或内容改动后，至少选择相关项执行：

```bash
npm run prebuild-data
npm run check
npm run build
```

前端视觉改动建议额外检查：

- 首页 `/`
- 论文列表 `/papers`
- 论文详情 `/papers/:cancer/:id`
- 指南列表 `/guidelines`
- 指南详情 `/guidelines/:cancer/:id`
- 博客列表 `/blog`
- 博客详情 `/blog/:slug`
- 产品详情 `/products/ciscer`、`/products/cisendo`、`/products/cisova`

海报、Markdown 渲染或 PDF 抽取相关改动，可查看 `test/` 下的 `_check_*`、`render_*`、`gen_poster.py` 等脚本，按任务选择性运行。

## Git 与工作区注意事项

当前仓库可能存在大量内容重命名、删除、生成产物和未跟踪资源。代理执行任务时：

- 先看 `git status --short`。
- 不要回滚自己没有创建的改动。
- 不要用 `git reset --hard` 或 `git checkout --` 清理工作区，除非用户明确要求。
- 新增或修改文件时尽量保持变更范围小。
- 忽略对象（可再生产物与本地归档，不要提交）：`node_modules/`、`dist/`、`.preview/`、`.venv/`、`public/blogs/`、`src/data/` 下的 9 个生成 JSON（见上文清单）、整个 `source/`（本地原始素材归档）、`test/`、`design/`、`建站思路.md`、`implementation_plan.md`。
- `src/data/` 下的修正层 JSON、`*.en.json`、`china-map.json` 和医院数据 ts 是手工输入，修改后必须随代码一起提交，否则换机即丢。

## 常见任务路径

新增或修改博客：

1. 中文：新建 `contents/blogs/[YYYY-MM-DD-HHMM]标题.md`，frontmatter 至少写 `slug`（简短唯一英文），可选 `title`/`tags`/`cover`（`./images/covers/标题.jpg`）；正文图片放 `images/contents/标题-img-NN.ext` 并用相对引用。
2. 英文：同目录同文件名 `.en.md`，frontmatter 写相同的 `slug` + `title`/`tags`/`excerpt`/`cover`（`./images/covers/<中文标题>.jpg`）；正文与中文同构：开头写 `![cover_image](./images/covers/<中文标题>.jpg)`，正文图片用同一套 `./images/contents/...` 相对引用。
4. 微信来源：封面取文章 og:image 元数据（不要用正文首图/装饰占位图）；装饰 gif 一律不保留。
3. 运行 `npm run prebuild-data`（dev 运行中则自动），检查 `/blog` 列表与详情页。

新增或修改论文：

1. 直接编辑 `contents/academic_published_papers/<CISCER|CISENDO|CISOVA>/*.md`；新论文用下一个可用编号前缀命名，不要改动已有文件的 id。
2. 如需修正元数据，编辑 `src/data/paper-overrides.json` 或相关 citations/fields 文件；引用格式以 `contents/citation_lists/` 为权威。
3. 新论文需补充封面：原图放 `contents/images/paper-covers/<癌种>/`，线上版压到 `public/images/journal-covers/<id>.jpg`。
4. 运行 `npm run prebuild-data`。
5. 检查列表页和详情页。

新增或修改指南：

1. 直接编辑 `contents/clinical_guidelines/<cancer 目录>/*.md`；新指南用下一个可用编号前缀命名。
2. 如需修正引用或 PDF 字段，检查 `src/data/guideline-citations.json`、`src/data/guideline-pdf-fields.json`。
3. 运行 `npm run prebuild-data`。
4. 检查 `/guidelines` 和详情页。

修改产品或公司信息：

1. 优先核对本地归档 `source/product_infomation/` 中的资料。
2. 编辑 `scripts/build-data.ts` 的 `PRODUCTS` 或 `COMPANY`。
3. 运行 `npm run prebuild-data` 和 `npm run build`。

修改 UI：

1. 找到对应 `src/pages/` 页面和 `src/components/` 组件。
2. 复用 Tailwind 主题和已有组件类。
3. 保持中文/英文文案路径完整。
4. 运行 `npm run build`，必要时用浏览器检查响应式布局。
