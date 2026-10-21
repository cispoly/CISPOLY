# AI 可见性基线记录（AI Visibility Baseline）

> 依据 ai-seo skill 的 DIY Monitoring 方法建立。每月复测一次，每次查询运行 3-5 遍取提及率（n=样本数）。
> 建立时间：2026-10-21 | 首次测量：2026-10-21

## 一、Agent Readiness 评分（is-agentic）

| 日期 | 分数 | Essential | Recommended | 备注 |
|------|------|-----------|-------------|------|
| 2026-10-21（部署前） | 68/100 | 53.3/80 | 13/20 | 软404/MD协商/Organization不完整 |
| 2026-10-21（部署后实测） | 待复评 | — | — | 404+MD协商已修复并线上验证，工具报告为缓存（08:08） |

**已修复项**（实测通过，待工具缓存刷新后确认）：
- ✅ Agent-friendly 404s：未知路径返回 404 + text/markdown body（含 llms.txt 指引）
- ✅ Organization schema 补全（contactPoint/PostalAddress/description）+ WebSite entity
- ✅ Trust anchor：新增 /privacy 页（zh+en，500+ 字）

**未修复项**：
- ❌ Markdown content negotiation（静态页面）：EdgeOne 静态优先路由，文件层无法实现；替代方案 = llms.txt/llms-full.txt 已上线
- ❌ Brand name discoverability：依赖外链/报道长期积累

## 二、核心提问清单（Prompt Portfolio）

按购买阶段分层，覆盖三个产品线：

### 问题认知期（Problem-aware）
| # | 提问 | 语言 |
|---|------|------|
| P1 | 宫颈癌 HPV 阳性后怎么分流？ | zh |
| P2 | HPV 感染和宫颈癌变有什么区别？ | zh |
| P3 | 绝经后子宫内膜癌怎么筛查？ | zh |
| P4 | 卵巢囊肿良恶性怎么鉴别？ | zh |

### 方案认知期（Solution-aware）
| # | 提问 | 语言 |
|---|------|------|
| S1 | 宫颈癌甲基化检测哪家好？ | zh |
| S2 | PAX1/JAM3 甲基化检测准确率是多少？ | zh |
| S3 | What is PAX1/JAM3 methylation testing? | en |
| S4 | Best methylation tests for cervical cancer triage | en |
| S5 | 非侵入性子宫内膜癌筛查方法有哪些？ | zh |

### 产品认知期（Product-aware）
| # | 提问 | 语言 |
|---|------|------|
| B1 | 聚禾生物 是什么公司？ | zh |
| B2 | 禾宫康 CISCER 准不准？ | zh |
| B3 | CISENDO vs 内膜活检 | zh |
| B4 | CISOVA 卵巢癌检测 准确率 | zh |
| B5 | CISPOLY cervical cancer test | en |

## 三、首次测量结果（2026-10-21，搜索引擎层）

用 AnySearch（聚合搜索）实测，AI 引擎（ChatGPT/Perplexity/Gemini）需人工月度复测：

| 提问 | cispoly.com 被引用？ | 被引来源 | 竞品/第三方占位 |
|------|:---:|---------|----------------|
| P1 宫颈癌 HPV阳性 分流 | ❌ | Frontiers Oncol、PMC（学术论文） | 金域医学、检验医学网 |
| S2 PAX1/JAM3 准确率 | ❌ | 学术论文为主 | — |
| B1 聚禾生物 | ❌（"No relevant results"） | — | 药谷/bydrug 报道融资 |
| B2 禾宫康 CISCER | ❌（官网未被直接返回） | sohu 转载官网内容 | 华大华妍康 |
| B3 CISENDO | ❌（"No relevant results"） | — | bydrug 报道 |
| B4 CISOVA | ❌ | 学术综述 | — |
| 英文 CISPOLY | ✅（搜索 cispoly.com 可见） | LinkedIn/Crunchbase/PitchBook/ Prosperity7 新闻稿 | 官网 blog 有收录 |

## 四、关键洞察（首次测量）

1. **官网品牌词收录弱**：中文品牌词（聚禾生物/禾蔻安/CISENDO）搜索无结果，英文品牌词主要靠第三方（LinkedIn、Crunchbase、融资新闻稿）。→ 需要外链建设 + 官网内容被更多第三方引用。
2. **学术来源垄断产品类提问**：HPV分流/甲基化准确率类提问的答案来源全部是学术论文（Frontiers/PMC）。→ 站内 51 篇论文页是资产，但要确保论文页与产品页互相链接（已做），并让博客的数据块与论文互相引用。
3. **第三方报道比官网更易被检索**：CISCER 的搜索可见内容是 sohu/bydrug 转载。→ Presence 策略：继续争取行业媒体报道；每篇重要博客同步到微信公众号（已有渠道）形成引用闭环。
4. **竞品占位**：华大（华妍康）在同类提问中出现。→ 对比内容（如"HPV vs 甲基化"表格）已上线，继续扩充"甲基化检测选型"类内容。

## 五、月度复测流程（每月第一个工作日）

1. 逐条运行第二节提问清单（每个 3-5 次），记录 cispoly.com 引用率（如 2/5）
2. 记录被引 URL（区分官网/学术/第三方）
3. 重跑 `npx is-agentic www.cispoly.com` 记录分数
4. GSC 检查：产品页/重点博客的展示与点击变化（FAQPage 富摘要、sitemap 状态）
5. 将结果追加到本文档第六节

## 六、月度追踪表

| 月份 | 核心提问引用率 | is-agentic 分数 | 备注 |
|------|--------------|----------------|------|
| 2026-10（基线） | 0/7 提问被引（品牌词英文除外） | 68（缓存）/待复评 | 基线建立；GEO 改写 4 篇上线 |
