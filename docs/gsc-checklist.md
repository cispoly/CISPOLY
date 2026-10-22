# GSC 提交与抓取操作清单（Search Console Checklist）

> 背景：2026-10 基线测量发现中文品牌词（聚禾生物/禾蔻安/CISENDO）搜索零结果，
> 站点未被有效收录。本清单用于一次性完成 GSC 侧的提交与加速抓取。
> 域级验证已存在：DNS TXT `google-site-verification=amquMByuWbemI-PX82-55QgHOrqIPuzIiJjvNIUo15I`
>
> 控制台地址：https://search.google.com/search-console （选择资源 cispoly.com，域属性）

## 一、提交 Sitemap（一次性，5 分钟）

1. 左侧菜单 → **索引 → 站点地图**
2. 输入 `sitemap.xml` → 提交
3. 预期状态：成功，发现 **366 个网址**（244 内容页 + 论文/指南/列表页）
4. 一周后回来检查"发现"与"已编入索引"数量

> 说明：sitemap 每次部署自动重新生成（构建时从内容数据产出），含 hreflang 双语
> alternates，无需手工维护。

## 二、手动请求抓取（重点 URL，10 分钟）

GSC 顶部 **网址检查**（URL Inspection）输入框，逐条输入以下 URL，
每次点 **请求编入索引**（Request Indexing）：

### 品牌核心页（优先级最高——修复"品牌词零收录"）
```
https://www.cispoly.com/
https://www.cispoly.com/en
https://www.cispoly.com/about/
https://www.cispoly.com/products/
https://www.cispoly.com/products/ciscer/
https://www.cispoly.com/products/cisendo/
https://www.cispoly.com/products/cisova/
https://www.cispoly.com/privacy/
```

### GEO 改写的 4 篇重点博客（FAQPage 富摘要候选）
```
https://www.cispoly.com/blog/new-publication-who-esgo-guideline-experts/
https://www.cispoly.com/blog/two-guards-for-cervical-health-hpv-tracks/
https://www.cispoly.com/blog/changshu-hpv-pax1-jam3-methylation-screening/
https://www.cispoly.com/blog/pax1-jam3-precision-cervical-screening-pathway/
```

> 每日请求配额约 10-12 条，上述共 12 条，一天完成。
> 英文版（/en/...）如配额允许可次日提交。

## 三、验证与监控设置（一次性）

1. **索引覆盖**：索引 → 页面。一周后检查"未编入索引"原因分布，
   重点关注 `soft-404`（应为 0——已修复真实 404）和 `重复网页，Google 选择了不同规范网址`。
2. **品牌词监控**：效果 → 查询过滤 `聚禾` / `禾宫康` / `CISENDO` / `CISOVA` / `CISPOLY`，
   记录基线展示/点击（预期当前≈0，目标是 8 周内品牌词出现展示）。
3. **FAQ 富摘要**：效果 → 搜索外观 → 筛选"常见问题"（FAQ），4 篇改写博客上线
   FAQPage schema 后 2-4 周可出现在此报告。

## 四、可选：Bing Webmaster Tools（15 分钟）

Bing 占国内必应/部分 AI 引擎（Copilot）索引来源：
1. https://www.bing.com/webmasters → 从 Google Search Console 导入（一键）
2. 导入后同样提交 `https://www.cispoly.com/sitemap.xml`

## 五、完成标准

- [ ] Sitemap 提交成功且发现 300+ URL
- [ ] 12 条重点 URL 全部请求编入索引
- [ ] 一周后：索引覆盖无 soft-404 类错误
- [ ] 品牌词基线已记录（记录到 ai-visibility-baseline.md 第六节）
