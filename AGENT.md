# CISPOLY3 Agent Guide

本文件是给后续 AI/开发代理使用的项目指南。进入本仓库后先读这里，再改代码或内容。

## 项目概览

这是聚禾生物 CISPOLY 官网项目，技术栈为 Vite + React 18 + TypeScript + Tailwind CSS。站点展示三类妇科肿瘤早筛产品、学术论文、临床指南、企业动态和关于页。

核心形态不是纯手写页面，而是：

1. `source/` 中维护 Markdown、PDF、图片等内容源。
2. `scripts/build-data.ts` 扫描并解析内容源。
3. 生成 `src/data/*.json` 和 `src/data/*.body.json`。
4. `src/lib/data.ts` 作为前端统一数据入口。
5. `src/pages/` 与 `src/components/` 渲染页面。

## 常用命令

```bash
npm run prebuild-data
npm run dev
npm run build
npm run preview
```

- `npm run prebuild-data`: 只运行 `tsx scripts/build-data.ts`，用于内容改动后刷新 `src/data/`。
- `npm run dev`: 先构建数据，再启动 Vite dev server，默认 `0.0.0.0:5173`。
- `npm run build`: 先构建数据，再运行 `tsc -b` 与 `vite build`。
- `npm run preview`: 预览 `dist/` 构建产物。

## 目录地图

- `src/App.tsx`: 路由入口。首页、产品、论文、指南、博客、关于页都在这里注册。
- `src/main.tsx`: React 入口。
- `src/pages/`: 页面级组件。
- `src/components/`: 可复用展示组件，如 `Hero`、`Header`、`PaperCard`、`PosterDetail`。
- `src/lib/data.ts`: 前端数据访问层，导入 `src/data/*.json` 并提供查询函数和正文按需加载函数。
- `src/lib/i18n.tsx`: 中英双语字典与语言切换逻辑。
- `src/lib/markdown.tsx`: Markdown 渲染相关逻辑。
- `src/styles/index.css`: Tailwind base/components，全局 `.shell`、`.card`、`.prose-cispoly` 等样式。
- `scripts/build-data.ts`: 数据构建主脚本，解析论文、指南、博客、产品和公司信息。
- `scripts/*.ts` / `scripts/*.mjs`: PDF 字段抽取、引用修正、海报处理等辅助脚本。
- `source/`: 内容源目录，优先编辑这里。其中真正参与构建的只有：`academic_published_papers/`、`clinical_guidelines/`、`blogs/聚禾生物cispoly/`、`blogs/cispoly-news-update/raw/clippings/` 下的 4 个引用列表 md；其余子目录（`pdf/`、`images/`、`product_infomation/`、`blogs/posters/`、`blogs/cispoly-news-update/raw/asserts/`）是本地原始素材归档，已加入 `.gitignore`，只留在本地备查，不推 GitHub。
- `public/`: 公开静态资源，包含 `logo.png`、favicon、海报（`posters/`）、期刊封面（`images/journal-covers/`）、hero 图（`hero/`）。注意 `public/blogs/` 是构建时从博客源自动复制的可再生目录，已 gitignore；海报草稿区在 `source/blogs/posters/`（同样不入库），线上实际服务的是 `public/posters/`。
- `design/research-visualization/`: 独立的研究可视化设计/实验子项目。
- `test/`: 视觉检查、海报生成与回归校验脚本及测试素材。

## 内容源约定

论文原始整理源位于：

- `source/blogs/cispoly-news-update/raw/clippings/academic_papers`
- 其下按产品/癌种分为 `CISCER`、`CISENDO`、`CISOVA`，并包含 `文献条目.csv` 与各癌种引用列表。

指南原始整理源位于：

- `source/blogs/cispoly-news-update/raw/clippings/clinical_guidelines`
- 其下按癌种分为 `cervical_cancer`、`endometrial_cancer`、`ovarian_cancer`，并包含 `指南共识引用列表.md`。

当前构建脚本仍读取规范化后的站点内容目录：

- 论文：`source/academic_published_papers/<CISCER|CISENDO|CISOVA>`
- 指南：`source/clinical_guidelines/<cervical_cancer_methylation|endometrial_cancer_methylation|ovarian_cancer_methylation>`

如果要让 `raw/clippings` 成为唯一事实源，需要同步修改 `scripts/build-data.ts` 的扫描路径，或增加一个明确的同步脚本，把 `raw/clippings` 转换到上述规范化目录。

博客源来自：

- `source/blogs/聚禾生物cispoly`

`source/blogs/cispoly-news-update` 是微信公众号/文献/指南导入与整理工作区，不是博客构建源。

产品和公司信息目前主要写在 `scripts/build-data.ts` 的 `PRODUCTS` 与 `COMPANY` 常量中。产品资料原始文件在 `source/product_infomation/`。

## 数据构建规则

`src/data/` 里的文件分两类，规则不同：

**构建产物（9 个，已 gitignore，换机可直 build 再生，不要手工编辑）**：

- `papers.json` / `papers.body.json`
- `guidelines.json` / `guidelines.body.json`
- `blogs.json` / `blogs.body.json`
- `products.json` / `company.json` / `index.json`

**手工维护的输入（必须提交入库，丢了无法再生）**：

- 修正层：`citations.json`、`paper-overrides.json`、`paper-fields-v2.json`、`paper-affiliations.json`、`paper-fields.json`、`guideline-pdf-fields.json`、`guideline-citations.json`
- 英文翻译：`papers.en.json`、`guidelines.en.json`、`blogs.en.json`、`blogs.body.en.json`、`products.en.json`、`company.en.json`
- 地图与医院数据：`china-map.json`（生成它的临时 geo 输入已删，不可再生）、`china-hospitals.ts`、`cisendo-hospitals.ts`、`cisova-hospitals.ts`

如果要调整引用、摘要、单位、DOI 或手工覆盖字段，优先改修正层 JSON 和 `source/**/*.md`，改完运行 `npm run prebuild-data` 刷新生成文件。

数据拆分策略：

- 列表页使用 `papers.json`、`guidelines.json`、`blogs.json`。
- 正文被拆到 `papers.body.json`、`guidelines.body.json`、`blogs.body.json`。
- 详情页通过 `loadPaperBody`、`loadGuidelineBody`、`loadBlogBody` 动态加载正文，避免首屏 bundle 过大。

## 前端开发约定

- 使用 TypeScript strict 模式，路径别名为 `@/* -> src/*`。
- 使用 Tailwind 工具类和 `src/styles/index.css` 中已有组件类，不要随意引入新的样式体系。
- 站点视觉基调是暖白底、深炭文字、品牌赤红点缀，配置在 `tailwind.config.ts`。
- 页面容器优先使用 `.shell`。
- Markdown 正文优先使用 `.prose-cispoly`。
- 图标优先使用 `lucide-react`。
- 路由级页面已经使用 `React.lazy` 按需加载；新增重页面时保持这一模式。
- 中英双语文案优先放入 `src/lib/i18n.tsx`，组件内通过 `useI18n()` 获取 `t`、`lang`。
- 数据项如产品、公司信息已有可选英文字段，展示时按当前语言选择对应字段。

## 医学与内容准确性

本项目内容涉及肿瘤筛查、诊断性能、注册证、指南共识和论文引用。改动时要保守：

- 不凭印象改医学结论、灵敏度、特异性、注册证号、适用人群或指南推荐。
- 优先以 `source/pdf/`、产品资料 PDF、论文正文、引用列表或已整理的修正层 JSON 为依据。
- 修改标题、DOI、年份、期刊、作者、单位和引用格式后，运行 `npm run prebuild-data` 检查生成结果。
- 微信公众号导入内容常含 UI 噪声，清洗规则集中在 `build-data.ts` 的 `WECHAT_NOISE_PATTERNS`。

## 验证清单

代码或内容改动后，至少选择相关项执行：

```bash
npm run prebuild-data
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
- 忽略对象（可再生产物与本地归档，不要提交）：`node_modules/`、`dist/`、`.preview/`、`.venv/`、`public/blogs/`、`src/data/` 下的 9 个生成 JSON（见上文清单）、`source/pdf/`、`source/images/`、`source/product_infomation/`、`source/blogs/posters/`、`source/blogs/cispoly-news-update/raw/asserts/`。
- `src/data/` 下的修正层 JSON、`*.en.json`、`china-map.json` 和医院数据 ts 是手工输入，修改后必须随代码一起提交，否则换机即丢。

## 常见任务路径

新增或修改论文：

1. 优先编辑 `source/blogs/cispoly-news-update/raw/clippings/academic_papers/<CISCER|CISENDO|CISOVA>` 下的原始整理内容。
2. 若站点仍由规范化目录构建，同步到 `source/academic_published_papers/<CISCER|CISENDO|CISOVA>/*.md`，或先调整 `scripts/build-data.ts` 直接读取 clippings。
3. 如需修正元数据，编辑 `src/data/paper-overrides.json` 或相关 citations/fields 文件。
4. 运行 `npm run prebuild-data`。
5. 检查列表页和详情页。

新增或修改指南：

1. 优先编辑 `source/blogs/cispoly-news-update/raw/clippings/clinical_guidelines/<cervical_cancer|endometrial_cancer|ovarian_cancer>` 下的原始整理内容。
2. 若站点仍由规范化目录构建，同步到 `source/clinical_guidelines/<cancer_dir>/*.md`，或先调整 `scripts/build-data.ts` 直接读取 clippings。
3. 如需修正引用或 PDF 字段，检查 `src/data/guideline-citations.json`、`src/data/guideline-pdf-fields.json`。
4. 运行 `npm run prebuild-data`。
5. 检查 `/guidelines` 和详情页。

修改产品或公司信息：

1. 优先核对 `source/product_infomation/` 中的资料。
2. 编辑 `scripts/build-data.ts` 的 `PRODUCTS` 或 `COMPANY`。
3. 运行 `npm run prebuild-data` 和 `npm run build`。

修改 UI：

1. 找到对应 `src/pages/` 页面和 `src/components/` 组件。
2. 复用 Tailwind 主题和已有组件类。
3. 保持中文/英文文案路径完整。
4. 运行 `npm run build`，必要时用浏览器检查响应式布局。
