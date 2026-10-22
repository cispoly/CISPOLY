# 第三方品牌一致性审计（Third-Party Consistency Audit）

> 依据 ai-seo skill 的 positioning-and-consensus 原则：AI 引擎做产品推荐时依赖
> 全网多源共识。各平台对公司的描述若互相矛盾或缺失关键事实，会稀释品牌实体的
> 置信度。本审计核对各第三方资料与官网定位（2026-10-21）的一致性。

## 官网基准定位（Source of Truth）

- **品牌名**：CISPOLY / 聚禾生物 / 北京起源聚禾生物科技有限公司（英文注册名 Beijing OriginPoly Bio-Tec Co., Ltd. / JH Cispoly）
- **一句话定位**：妇科肿瘤（宫颈/子宫内膜/卵巢癌）DNA 甲基化早筛早诊开拓者
- **关键事实**：成立 2020，北京大兴；3 款 NMPA III 类产品（CISCER 2023 / CISENDO 2024 / CISOVA 2025）；国家高新技术企业；Propersity7 领投 B 轮 1 亿元（2023-12）

## 逐平台核对

| 平台 | 现状描述 | 一致性 | 问题与建议 |
|------|---------|:---:|-----------|
| **LinkedIn**（linkedin.com/company/beijing-originpoly-bio-tec-co-ltd） | 名 CISPOLY；简介用 "JHcispoly is focused on improving women's health..."（旧品牌名 + 语法瑕疵 "Our using the technology"） | ⚠️ 部分 | ① 简称混用 JHcispoly 与 CISPOLY；② 定位句未提"3 款 NMPA 获批产品"与"妇科肿瘤甲基化早筛开拓者"；③ 建议按官网基准重写 About，补 Products 页与三个产品名 |
| **Crunchbase**（/organization/jh-cispoly） | 名 "JH Cispoly"；一句话 "develops diagnostic technology and equipment for gynecological tumors" | ⚠️ 部分 | 未提及甲基化技术、三大产品、NMPA 注册——这些是 AI 引擎判定"这是什么公司"的关键词。建议更新描述并补全产品线 |
| **PitchBook**（/profiles/company/467769-97） | "Manufacturer of diagnostic technology... methylation detection" | ✅ 基本一致 | 补产品名更佳（付费编辑，优先级低） |
| **Preqin** | "biotech company that focuses on early diagnosis of female tumors" | ✅ 可接受 | 一致但笼统 |
| **Prosperity7 新闻稿**（融资方） | "pioneer in the early diagnosis of gynecological tumors... patent-protected markers"；明确提到 CISENDO 完成临床 | ✅ 一致 | 权威外链，保持 |
| **The Asset / 药谷 ByDrug / 早筛网**（媒体报道） | 一致使用"聚禾生物""禾蔻安""甲基化第一证"等 | ✅ 一致 | 中文媒体侧基础好；官网品牌词问题主要在收录而非共识 |
| **学术署名**（PubMed 论文 affiliation） | "Beijing Origin-Poly Bio-Tec Co., Ltd."（带连字符 Origin-Poly） | ⚠️ 微差 | 与注册名 OriginPoly 拼写不一致（连字符有无）。这是论文原始署名，无法改历史论文；建议官网 About 页注明 "Beijing Origin-Poly Bio-Tec Co., Ltd.（亦写作 Beijing OriginPoly）" 建立别名关联 |
| **专利数据库**（Google Patents / IPqwery） | Beijing Originpoly Bio-tec Co., Ltd. + CDO1/HOXA9 卵巢癌专利 | ✅ 技术一致 | — |

## 主要发现

1. **最大裂缝在英文品牌名**：CISPOLY（品牌）/ JH Cispoly（Crunchbase、LinkedIn 旧简介）/ Beijing OriginPoly（注册名）/ Beijing Origin-Poly（论文署名）四种写法并存。AI 引擎做实体归一时需要明确这些是同一家。→ 已在官网 Organization schema 的 alternateName 中补齐全部四个别名（2026-10-21 部署）。
2. **LinkedIn 与 Crunchbase 的描述落后于公司现状**：都没有反映 3 款 NMPA 获批产品与"甲基化早筛开拓者"定位。这两个平台是英文品牌提问（"What is CISPOLY?"）最常被引用的来源。
3. **中文共识基础好**：媒体报道、学术论文署名、临床研究均一致使用"聚禾生物 + 产品名"，主要矛盾是官网收录弱（GSC 清单解决）而非共识分裂。

## 行动清单（按优先级）

- [ ] **LinkedIn About 重写**（账号管理员操作）：替换 JHcispoly 旧简介，采用官网 mission + 三产品 + NMPA 事实；修正语法； headquarters、website、industry 字段核对
- [ ] **Crunchbase 描述更新**（认领/编辑权限）：一句话定位改为 "CISPOLY (Beijing OriginPoly Bio-Tec) is a pioneer in DNA methylation-based early detection of gynecologic cancers — cervical (CISCER), endometrial (CISENDO), and ovarian (CISOVA) — all three NMPA Class III approved."
- [ ] **官网 About 页加英文名别名说明**（一行，建立 OriginPoly/Origin-Poly 关联）——待实施
- [ ] LinkedIn 每月 1-2 条产品/学术动态帖（ChatGPT 对专业类提问高频引用 LinkedIn；发帖前 30 字前置关键词）

## 完成后验证

用以下提问在 ChatGPT/Perplexity 复测（每月，见 ai-visibility-baseline.md）：
- "What is CISPOLY?" / "聚禾生物是什么公司？"
- "CISENDO endometrial cancer test accuracy"
- "Who makes CISOVA ovarian cancer test?"

预期：更新后 4-8 周内，AI 回答开始出现"3 款 NMPA 获批产品"与三产品名。
