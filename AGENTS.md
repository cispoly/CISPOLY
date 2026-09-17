# 工作规则

1. 每次根据用户要求完成工作、修改完页面等，都要自行审核一遍是否完成。若对页面进行了修改，要对页面进行截图或通过其他方式检查结果是否合适。

2. Blog 图片统一管理铁律：
   - 所有站点 Blog 图片必须存放在 `contents/blogs/images/` 下；不得在单篇博客子目录或其他目录中存放并引用发布用图片。
   - 封面图片统一放在 `contents/blogs/images/covers/`，命名为 `<文章标识>.<ext>`；正文图片统一放在 `contents/blogs/images/contents/`，命名为 `<文章标识>-img-NN.<ext>`。
   - Markdown frontmatter 的 `cover` 以及正文中重复的封面图只能引用 `./images/covers/...`；其余正文图片只能引用 `./images/contents/...`。中英文版本共用同一组图片。
   - `<文章标识>` 为对应博客 Markdown 文件名去除 `[YYYY-MM-DD-HHMM]` 前缀和 `.md`/`.en.md` 后缀；每个引用必须对应存在文件，禁止远程 URL、文章子目录图片和悬空图片引用。
