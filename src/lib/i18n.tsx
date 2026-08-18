/**
 * CISPOLY 双语系统 (i18n)
 *
 * 策略：检测浏览器/系统语言 → 中文显示中文，否则显示英文。
 * 语言检测结果缓存到 localStorage，避免每次加载都重新检测。
 */

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'

export type Lang = 'zh' | 'en'

const STORAGE_KEY = 'cispoly-lang'

/* ---------- 翻译字典 ---------- */

type Dict = Record<string, string>

const zh: Dict = {
  // ---- 导航 ----
  'nav.home': '首页',
  'nav.products': '产品',
  'nav.products.ciscer.name': '禾宫康 CISCER®',
  'nav.products.ciscer.desc': '双基因甲基化检测，助力宫颈癌防治行动',
  'nav.products.cisendo.name': '禾蔻安 CISENDO®',
  'nav.products.cisendo.desc': '全球首个获批无创子宫内膜癌甲基化检测',
  'nav.products.cisova.name': '禾薇益 CISOVA®',
  'nav.products.cisova.desc': '全球首个获批，一管外周血，发现早期卵巢癌',
  'nav.research': '研究',
  'nav.guideline': '指南',
  'nav.blog': '博客',
  'nav.about': '关于',

  // ---- 通用 ----
  'common.contact': '联系我们',
  'common.contactConsult': '合作咨询',
  'common.learnMore': '了解我们',
  'common.viewProducts': '查看产品',
  'common.explorePapers': '探索论文',
  'common.viewGuidelines': '查看指南',
  'common.readNews': '阅读动态',
  'common.allProducts': '全部产品',
  'common.allPapers': '查看全部论文',
  'common.allGuidelines': '查看全部指南',
  'common.allBlogs': '阅读全部',
  'common.all': '全部',
  'common.back': '返回',
  'common.backToPapers': '返回文献',
  'common.backToGuidelines': '返回指南',
  'common.menu': '菜单',
  'common.loading': '加载中…',
  'common.copyOf': '京ICP备 0000000 号',

  // ---- 癌种 ----
  'cancer.cervical': '宫颈癌',
  'cancer.endometrial': '子宫内膜癌',
  'cancer.ovarian': '卵巢癌',

  // ---- Hero 轮播 ----
  'hero.slide1.eyebrow': '我们的使命',
  'hero.slide1.titlePrefix': '以创新表观遗传技术，',
  'hero.slide1.titleHighlight': '守护女性健康',
  'hero.slide1.subtitle':
    '聚禾生物专注宫颈癌、子宫内膜癌、卵巢癌的 DNA 甲基化早筛早诊，以无创技术填补临床空白，造福中国乃至全球的女性。',
  'hero.slide1.cta': '了解我们',

  'hero.slide2.eyebrow': '产品矩阵',
  'hero.slide2.titlePrefix': '三大无创检测，',
  'hero.slide2.titleHighlightPrefix': '覆盖',
  'hero.slide2.titleHighlightSuffix': '妇科三大恶性肿瘤',
  'hero.slide2.subtitle':
    '禾宫康（宫颈癌）、禾蔻安（子宫内膜癌）、禾薇益（卵巢癌）——基于 DNA 甲基化的精准早筛早诊产品，均获 NMPA 注册证。',
  'hero.slide2.cta': '查看产品',

  'hero.slide3.eyebrow': '学术研究',
  'hero.slide3.titlePrefix': '循证为基，',
  'hero.slide3.titleHighlight': '学术成果',
  'hero.slide3.titleSuffix': '丰硕',
  'hero.slide3.subtitle':
    '开展多项前瞻性多中心临床试验，在国际权威期刊发表丰富研究成果，以循证依据推动甲基化检测的临床应用。',
  'hero.slide3.cta': '探索论文',

  'hero.slide4.eyebrow': '临床指南',
  'hero.slide4.titlePrefix': '获多项国家级',
  'hero.slide4.titleHighlight': '指南与共识',
  'hero.slide4.titleSuffix': '推荐',
  'hero.slide4.subtitle':
    '多部临床指南与专家共识支持 DNA 甲基化检测在妇科肿瘤筛查与分流中的规范化应用，引领行业标准。',
  'hero.slide4.cta': '查看指南',

  'hero.slide5.eyebrow': '最新动态',
  'hero.slide5.titlePrefix': '持续创新，',
  'hero.slide5.titleHighlight': '守护每一次',
  'hero.slide5.titleSuffix': '健康',
  'hero.slide5.subtitle':
    '学术成果、指南共识、会议研讨、健康科普与企业喜讯——聚禾生物持续以创新科技服务女性健康。',
  'hero.slide5.cta': '阅读动态',

  // ---- 首页：使命陈述 ----
  'home.vision.eyebrow': '我们的愿景 · Vision',
  'home.vision.line1.word': '准确',
  'home.vision.line1.rest': '，让病变无所遁形',
  'home.vision.line2.word': '可及',
  'home.vision.line2.rest': '，让筛查触手可及',
  'home.vision.line3.word': '无创',
  'home.vision.line3.rest': '，让女性从容安心',
  'home.vision.subtitle': '以甲基化创新，让妇科肿瘤早筛惠及每一位女性。',

  // ---- 首页：产品矩阵 ----
  'home.products.eyebrow': '产品矩阵 · Products',
  'home.products.title1': '三大核心产品，',
  'home.products.title2': '覆盖妇科三大恶性肿瘤',
  'home.products.subtitle':
    '基于 DNA 甲基化的无创早筛早诊产品，针对宫颈癌、子宫内膜癌、卵巢癌提供精准检测方案。',

  // ---- 首页：数据看板 ----
  'home.stats.eyebrow': '实力与成果',
  'home.stats.title': '以循证数据，铸就专业信赖',

  // ---- 首页：精选论文 ----
  'home.papers.eyebrow': '学术研究 · Research',
  'home.papers.title': '循证为基，持续创新',
  'home.papers.subtitle':
    '开展多项前瞻性多中心临床试验，发表多篇学术文献，以循证依据推动甲基化应用。',
  'marquee.ariaLabel': '发表的学术文献封面',
  'marquee.coverAlt': '论文封面',

  // ---- 首页：临床指南 ----
  'home.guidelines.eyebrow': '临床指南 · Guidelines',
  'home.guidelines.title': '获多项指南与共识推荐',
  'home.guidelines.subtitle': '多部国家级临床指南与专家共识支持产品在临床上的规范化应用。',

  // ---- 首页：最新动态 ----
  'home.news.eyebrow': '最新动态 · News',
  'home.news.title': '聚禾动态',
  'home.news.subtitle': '学术成果、指南共识、会议研讨、健康科普，持续更新。',

  // ---- 论文页 ----
  'papers.hero.eyebrow': '学术研究 · Research',
  'papers.hero.title': '循证医学，持续创新',
  'papers.hero.subtitle':
    '聚禾生物注重甲基化应用的循证依据与临床及学术研究，开展多项前瞻性多中心临床试验，发表多篇学术文献。',

  // ---- 指南页 ----
  'guidelines.hero.eyebrow': '临床指南 · Guidelines',
  'guidelines.hero.title': '指南与共识，规范临床应用',
  'guidelines.hero.subtitle':
    '多部国家级临床指南与专家共识支持 DNA 甲基化检测在妇科肿瘤筛查与分流中的规范化应用。',

  // ---- 博客页 ----
  'blog.hero.eyebrow': '最新动态 · Blog',
  'blog.hero.title': '聚禾动态',
  'blog.hero.subtitle':
    '学术成果、指南共识、会议研讨、健康科普与企业资讯。',
  'blog.searchPlaceholder': '搜索文章…',
  'blog.notFound': '未找到相关文章。',
  'blog.updatedAt': '更新于',

  // ---- 博客详情 ----
  'blogPost.back': '返回博客',
  'blogPost.prev': '上一篇',
  'blogPost.next': '下一篇',

  // ---- 关于页 ----
  'about.hero.eyebrow': '关于我们 · About',
  'about.intro.eyebrow': '企业简介 · Overview',
  'about.intro.title': '妇科肿瘤早筛早诊领域的开拓者',
  'about.intro.lead': '深耕 DNA 甲基化技术，以无创早筛突破临床边界。',
  'about.intro.foundedLabel': '成立于',
  'about.intro.focusLabel': '专注',
  'about.intro.focusValue': '妇科肿瘤早筛',
  'about.intro.brandLabel': '品牌',
  'about.stats.eyebrow': '研发实力',
  'about.stats.title': '以创新科技为驱动',
  'about.milestones.eyebrow': '发展历程 · Milestones',
  'about.milestones.title': '一路走来',
  'about.qualifications.eyebrow': '资质荣誉 · Qualifications',
  'about.qualifications.title': '专业认证，值得信赖',
  'about.cta.title1': '期许未来填补临床诊疗路径的不足，',
  'about.cta.title2': '造福中国乃至全球的妇女',
  'about.cta.products': '了解产品',

  // ---- 产品详情 ----
  'product.backToProducts': '返回产品中心',
  'product.clinicalData.eyebrow': '临床效能 · Clinical Data',
  'product.clinicalData.title': '扎实的临床数据支撑',
  'product.clinicalData.subtitle': '基于多中心注册临床试验，灵敏度与特异性均达到行业领先水平。',
  'product.target.eyebrow': '目标人群',
  'product.target.title': '谁需要这项检测？',
  'product.scenarios.eyebrow': '使用场景',
  'product.scenarios.title': '临床如何应用？',
  'product.highlights.eyebrow': '核心优势 · Highlights',
  'product.highlights.title': '为什么选择我们',
  'product.network.eyebrow': '多中心研究 · Clinical Network',
  'product.network.title': '权威医院多中心验证',
  'product.network.subtitle': '与全国顶级妇科肿瘤中心合作，开展多中心真实世界研究。',
  'product.papers.eyebrow': '循证依据',
  'product.papers.titleSuffix': '相关学术文献',
  'product.guidelines.eyebrow': '规范应用',
  'product.guidelines.title': '相关指南与共识',
  'product.sampleType': '采样方式',
  'product.nmpaLabel': 'NMPA 注册证',
  'product.regDateLabel': '获证时间',
  'product.dualGene': '双基因甲基化',

  // ---- Footer ----
  'footer.contactInfo': '联系方式',
  'footer.quickLinks': '快速导航',
  'footer.addressLabel': '公司地址',
  'footer.phoneLabel': '联系电话',
  'footer.emailLabel': '商务邮箱',
  'footer.linkProducts': '产品',
  'footer.linkPapers': '学术',
  'footer.linkGuidelines': '指南',
  'footer.linkBlog': '博客',
  'footer.linkContact': '联系我们',

  // ---- Contact ----
  'contact.hero.eyebrow': '联系我们 · Contact Us',
  'contact.hero.title': '联系我们',
  'contact.hero.subtitle': '无论您是医疗机构、合作伙伴还是投资人，我们期待与您共同推动妇科肿瘤早筛早诊的创新实践。',
  'contact.infoEyebrow': '联系方式',
  'contact.infoTitle': '欢迎与我们联系',
  'contact.infoDesc': '留下您的需求，我们将在 1-2 个工作日内回复您。您也可以通过下方电话或邮箱直接与我们沟通。',
  'contact.workTime': '工作时间',
  'contact.workTimeValue': '周一至周五 9:00 – 18:00',
  'contact.directEmail': '直接发送邮件',
  'contact.addressLabel': '公司地址',
  'contact.phoneLabel': '联系电话',
  'contact.emailLabel': '商务邮箱',
  'contact.replyTime': '我们将在 1-2 个工作日内回复您。',
  'contact.nameLabel': '姓名',
  'contact.namePlaceholder': '您的称呼',
  'contact.contactLabel': '电话 / 邮箱',
  'contact.contactPlaceholder': '便于我们联系您',
  'contact.orgLabel': '所属机构',
  'contact.orgPlaceholder': '医院 / 企业 / 投资机构',
  'contact.messageLabel': '咨询内容',
  'contact.messagePlaceholder': '请简要描述您的需求或合作意向…',
  'contact.sendInquiry': '发送咨询',
  'contact.sending': '发送中…',
  'contact.sentSuccess': '提交成功，我们将在 1-2 个工作日内联系您。',
  'contact.sendError': '提交失败，请稍后重试，或通过邮箱直接联系我们。',
  'contact.unconfigured': '联系表单正在配置中，请通过下方邮箱或电话直接与我们联系。',

  // ---- PosterDetail / 文献详情 ----
  'poster.abstractLabel': '摘要 · Abstract',
  'poster.posterLabel': '文献海报 · Poster',
  'poster.tldr': 'TL;DR 摘要总结',
  'poster.openInNewTab': '在新窗口查看',
  'poster.loading': '海报加载中…',
  'poster.copy': '复制',
  'poster.copied': '已复制',
  'poster.affiliationLabel': '发表单位',
  'poster.citationLabel': '引用格式',
  'poster.clinicalPathway': '临床路径示意 · Clinical Pathway',
  'poster.prevArticle': '上一篇',
  'poster.nextArticle': '下一篇',
  'poster.posterNote':
    '* 海报为中英双语，标题双语对照显示；可在海报右上角切换 EN / 中文，语言自动适配当前页面。',

  // ---- 摘要分段标签 ----
  'abs.background': '背景',
  'abs.objective': '目的',
  'abs.methods': '方法',
  'abs.results': '结果',
  'abs.conclusions': '结论',

  // ---- 临床路径流程图 ----
  'flow.note': '* 以上为基于公开指南与共识的临床路径示意，具体诊疗请遵循临床医师判断与最新指南。',
  'flow.cervical.start.label': 'HPV 筛查阳性',
  'flow.cervical.start.sub': '或细胞学轻度异常 (ASC-US)',
  'flow.cervical.test.label': 'PAX1/JAM3 甲基化检测',
  'flow.cervical.test.sub': '禾宫康 CISCER®',
  'flow.cervical.pos.label': '甲基化阳性',
  'flow.cervical.pos.sub': '高级别病变风险高',
  'flow.cervical.neg.label': '甲基化阴性',
  'flow.cervical.neg.sub': '风险较低',
  'flow.cervical.end1.label': '转诊阴道镜 + 活检',
  'flow.cervical.end2.label': '定期随访',
  'flow.cervical.end2.sub': '降低不必要的转诊',
  'flow.endometrial.start.label': '异常子宫出血 / 绝经后高危',
  'flow.endometrial.test.label': 'CDO1/CELF4 甲基化检测',
  'flow.endometrial.test.sub': '禾蔻安 CISENDO® 无创筛查',
  'flow.endometrial.pos.label': '甲基化阳性',
  'flow.endometrial.pos.sub': '内膜癌风险高',
  'flow.endometrial.neg.label': '甲基化阴性',
  'flow.endometrial.neg.sub': '风险较低',
  'flow.endometrial.end1.label': '宫腔镜 + 内膜活检',
  'flow.endometrial.end2.label': '避免不必要的有创检查',
  'flow.ovarian.start.label': '卵巢囊肿 / 盆腔肿物',
  'flow.ovarian.start.sub': '或高危人群',
  'flow.ovarian.test.label': 'CDO1/HOXA9 甲基化检测',
  'flow.ovarian.test.sub': '禾薇益 CISOVA® 外周血',
  'flow.ovarian.pos.label': '甲基化阳性',
  'flow.ovarian.pos.sub': '恶性风险高',
  'flow.ovarian.neg.label': '甲基化阴性',
  'flow.ovarian.neg.sub': '良性可能性大',
  'flow.ovarian.end1.label': '手术探查 + 病理',
  'flow.ovarian.end2.label': '随访或保守处理',

  // ---- 404 ----
  'notfound.title': '页面未找到',
  'notfound.desc': '您访问的页面可能已被移除或暂时不可用。',
  'notfound.back': '返回首页',

  // ---- Home 产品矩阵说明 ----
  'home.products.note':
    '三大产品均已取得 NMPA III 类医疗器械注册证，完成完整的临床 I/II/III 期研究，并获多项国内外临床指南与专家共识推荐。所有检测均基于无创采样，大幅提升受检者依从性，推动妇科肿瘤早筛的普及。',
  'home.products.noteHighlight': '无创采样',
}

const en: Dict = {
  // ---- Navigation ----
  'nav.home': 'Home',
  'nav.products': 'Product',
  'nav.products.ciscer.name': 'CISCER®',
  'nav.products.ciscer.desc': 'Dual-gene methylation testing for cervical cancer prevention',
  'nav.products.cisendo.name': 'CISENDO®',
  'nav.products.cisendo.desc': 'The world’s first approved non-invasive endometrial cancer methylation test',
  'nav.products.cisova.name': 'CISOVA®',
  'nav.products.cisova.desc': 'The world’s first approved peripheral-blood test for early ovarian cancer detection',
  'nav.research': 'Research',
  'nav.guideline': 'Guideline',
  'nav.blog': 'Blog',
  'nav.about': 'About',

  // ---- Common ----
  'common.contact': 'Contact Us',
  'common.contactConsult': 'Partner with Us',
  'common.learnMore': 'Learn More',
  'common.viewProducts': 'View Products',
  'common.explorePapers': 'Explore Papers',
  'common.viewGuidelines': 'View Guidelines',
  'common.readNews': 'Read News',
  'common.allProducts': 'All Products',
  'common.allPapers': 'View All Papers',
  'common.allGuidelines': 'View All Guidelines',
  'common.allBlogs': 'Read All',
  'common.all': 'All',
  'common.back': 'Back',
  'common.backToPapers': 'Back to Papers',
  'common.backToGuidelines': 'Back to Guidelines',
  'common.menu': 'Menu',
  'common.loading': 'Loading…',
  'common.copyOf': '',

  // ---- Cancer types ----
  'cancer.cervical': 'Cervical Cancer',
  'cancer.endometrial': 'Endometrial Cancer',
  'cancer.ovarian': 'Ovarian Cancer',

  // ---- Hero carousel ----
  'hero.slide1.eyebrow': 'Our Mission',
  'hero.slide1.titlePrefix': 'Guarding women\u2019s health with',
  'hero.slide1.titleHighlight': 'innovative epigenetic technology',
  'hero.slide1.subtitle':
    'CISPOLY focuses on DNA methylation-based early screening and diagnosis of cervical, endometrial, and ovarian cancers, filling clinical gaps with non-invasive technology to benefit women in China and worldwide.',
  'hero.slide1.cta': 'Learn More',

  'hero.slide2.eyebrow': 'Product Portfolio',
  'hero.slide2.titlePrefix': 'Three non-invasive tests covering',
  'hero.slide2.titleHighlightPrefix': 'the',
  'hero.slide2.titleHighlightSuffix': 'three major gynecologic malignancies',
  'hero.slide2.subtitle':
    'CISCER® (cervical), CISENDO® (endometrial), CISOVA® (ovarian) — DNA methylation-based precision screening products, all NMPA-registered.',
  'hero.slide2.cta': 'View Products',

  'hero.slide3.eyebrow': 'Academic Research',
  'hero.slide3.titlePrefix': 'Evidence-based with',
  'hero.slide3.titleHighlight': 'extensive',
  'hero.slide3.titleSuffix': 'publications',
  'hero.slide3.subtitle':
    'Conducting multiple prospective multi-center clinical trials and publishing extensively in leading international journals, driving the clinical application of methylation testing.',
  'hero.slide3.cta': 'Explore Papers',

  'hero.slide4.eyebrow': 'Clinical Guidelines',
  'hero.slide4.titlePrefix': 'Recommended by multiple national',
  'hero.slide4.titleHighlight': 'guidelines',
  'hero.slide4.titleSuffix': 'and consensus statements',
  'hero.slide4.subtitle':
    'Multiple clinical guidelines and expert consensus statements support the standardized application of DNA methylation testing in gynecologic cancer screening and triage.',
  'hero.slide4.cta': 'View Guidelines',

  'hero.slide5.eyebrow': 'Latest News',
  'hero.slide5.titlePrefix': 'Continuous innovation,',
  'hero.slide5.titleHighlight': 'safeguarding every',
  'hero.slide5.titleSuffix': 'health journey',
  'hero.slide5.subtitle':
    'Research achievements, guideline endorsements, conference highlights, health education, and company milestones — CISPOLY continues to serve women\u2019s health through innovation.',
  'hero.slide5.cta': 'Read News',

  // ---- Home: Vision ----
  'home.vision.eyebrow': 'Our Vision',
  'home.vision.line1.word': 'Accurate',
  'home.vision.line1.rest': ', leaving no lesion hidden',
  'home.vision.line2.word': 'Accessible',
  'home.vision.line2.rest': ', bringing screening within reach',
  'home.vision.line3.word': 'Non-invasive',
  'home.vision.line3.rest': ', giving women peace of mind',
  'home.vision.subtitle':
    'Making gynecologic cancer early screening accessible to every woman through methylation innovation.',

  // ---- Home: Products ----
  'home.products.eyebrow': 'Products',
  'home.products.title1': 'Three core products covering',
  'home.products.title2': 'all three major gynecologic cancers',
  'home.products.subtitle':
    'DNA methylation-based non-invasive early screening and diagnostic products for cervical, endometrial, and ovarian cancers.',

  // ---- Home: Stats ----
  'home.stats.eyebrow': 'Strength & Achievements',
  'home.stats.title': 'Building professional trust through evidence-based data',

  // ---- Home: Papers ----
  'home.papers.eyebrow': 'Research',
  'home.papers.title': 'Evidence-based, continuously innovating',
  'home.papers.subtitle':
    'Conducting multiple prospective multi-center clinical trials with numerous publications, advancing methylation applications through evidence.',
  'marquee.ariaLabel': 'Published academic journal covers',
  'marquee.coverAlt': 'Journal cover',

  // ---- Home: Guidelines ----
  'home.guidelines.eyebrow': 'Guidelines',
  'home.guidelines.title': 'Recommended by multiple guidelines and consensus',
  'home.guidelines.subtitle':
    'Multiple national clinical guidelines and expert consensus statements support the standardized clinical application of our products.',

  // ---- Home: News ----
  'home.news.eyebrow': 'News',
  'home.news.title': 'CISPOLY Updates',
  'home.news.subtitle':
    'Research achievements, guideline consensus, conference highlights, and health education — continuously updated.',

  // ---- Papers page ----
  'papers.hero.eyebrow': 'Research',
  'papers.hero.title': 'Evidence-based medicine, continuous innovation',
  'papers.hero.subtitle':
    'CISPOLY emphasizes the evidence base and clinical research of methylation applications, conducting multiple prospective multi-center clinical trials with numerous publications.',

  // ---- Guidelines page ----
  'guidelines.hero.eyebrow': 'Guidelines',
  'guidelines.hero.title': 'Guidelines and consensus for standardized clinical practice',
  'guidelines.hero.subtitle':
    'Multiple national clinical guidelines and expert consensus statements support the standardized application of DNA methylation testing in gynecologic cancer screening and triage.',

  // ---- Blog page ----
  'blog.hero.eyebrow': 'Blog',
  'blog.hero.title': 'CISPOLY Updates',
  'blog.hero.subtitle':
    'Research achievements, guideline consensus, conference highlights, health education, and company news.',
  'blog.searchPlaceholder': 'Search articles…',
  'blog.notFound': 'No articles found.',
  'blog.updatedAt': 'Updated',

  // ---- Blog post ----
  'blogPost.back': 'Back to Blog',
  'blogPost.prev': 'Previous',
  'blogPost.next': 'Next',

  // ---- About page ----
  'about.hero.eyebrow': 'About',
  'about.intro.eyebrow': 'Overview',
  'about.intro.title': 'A pioneer in early screening & diagnosis of gynecologic tumors',
  'about.intro.lead': 'Advancing DNA methylation technology to break new ground in non-invasive early detection.',
  'about.intro.foundedLabel': 'Founded',
  'about.intro.focusLabel': 'Focus',
  'about.intro.focusValue': 'Gynecologic early screening',
  'about.intro.brandLabel': 'Brand',
  'about.stats.eyebrow': 'R&D Strength',
  'about.stats.title': 'Driven by innovative technology',
  'about.milestones.eyebrow': 'Milestones',
  'about.milestones.title': 'Our Journey',
  'about.qualifications.eyebrow': 'Qualifications',
  'about.qualifications.title': 'Certified excellence, trusted expertise',
  'about.cta.title1': 'Aspiring to fill gaps in clinical diagnostic pathways,',
  'about.cta.title2': 'benefiting women in China and worldwide',
  'about.cta.products': 'View Products',

  // ---- Product detail ----
  'product.backToProducts': 'Back to Products',
  'product.clinicalData.eyebrow': 'Clinical Data',
  'product.clinicalData.title': 'Robust clinical data support',
  'product.clinicalData.subtitle':
    'Based on multi-center registered clinical trials, sensitivity and specificity both reach industry-leading levels.',
  'product.target.eyebrow': 'Target Population',
  'product.target.title': 'Who needs this test?',
  'product.scenarios.eyebrow': 'Clinical Scenarios',
  'product.scenarios.title': 'How is it applied clinically?',
  'product.highlights.eyebrow': 'Highlights',
  'product.highlights.title': 'Why choose us',
  'product.network.eyebrow': 'Clinical Network',
  'product.network.title': 'Validated by leading hospitals nationwide',
  'product.network.subtitle':
    'Partnering with top gynecologic oncology centers across China for multi-center real-world studies.',
  'product.papers.eyebrow': 'Evidence',
  'product.papers.titleSuffix': 'Related Publications',
  'product.guidelines.eyebrow': 'Standardized Application',
  'product.guidelines.title': 'Related Guidelines & Consensus',
  'product.sampleType': 'Sample Type',
  'product.nmpaLabel': 'NMPA Registration',
  'product.regDateLabel': 'Date Approved',
  'product.dualGene': 'dual-gene methylation',

  // ---- Footer ----
  'footer.contactInfo': 'Contact',
  'footer.quickLinks': 'Quick Links',
  'footer.addressLabel': 'Address',
  'footer.phoneLabel': 'Phone',
  'footer.emailLabel': 'Email',
  'footer.linkProducts': 'Products',
  'footer.linkPapers': 'Research',
  'footer.linkGuidelines': 'Guidelines',
  'footer.linkBlog': 'Blog',
  'footer.linkContact': 'Contact Us',

  // ---- Contact ----
  'contact.hero.eyebrow': 'Contact Us',
  'contact.hero.title': 'Get in Touch',
  'contact.hero.subtitle':
    'Whether you are a medical institution, partner, or investor, we look forward to advancing innovation in gynecologic cancer early screening and diagnosis together.',
  'contact.infoEyebrow': 'Contact Info',
  'contact.infoTitle': 'We’d love to hear from you',
  'contact.infoDesc': 'Leave your inquiry and we will respond within 1-2 business days. You can also reach us directly by phone or email below.',
  'contact.workTime': 'Working Hours',
  'contact.workTimeValue': 'Mon – Fri, 9:00 – 18:00',
  'contact.directEmail': 'Email Us Directly',
  'contact.addressLabel': 'Address',
  'contact.phoneLabel': 'Phone',
  'contact.emailLabel': 'Email',
  'contact.replyTime': 'We will respond within 1-2 business days.',
  'contact.nameLabel': 'Name',
  'contact.namePlaceholder': 'Your name',
  'contact.contactLabel': 'Phone / Email',
  'contact.contactPlaceholder': 'How to reach you',
  'contact.orgLabel': 'Organization',
  'contact.orgPlaceholder': 'Hospital / Company / Investor',
  'contact.messageLabel': 'Message',
  'contact.messagePlaceholder': 'Briefly describe your needs or partnership interest…',
  'contact.sendInquiry': 'Send Inquiry',
  'contact.sending': 'Sending…',
  'contact.sentSuccess': 'Submitted successfully. We will get back to you within 1-2 business days.',
  'contact.sendError': 'Submission failed. Please try again later or email us directly.',
  'contact.unconfigured': 'The contact form is being configured. Please reach us directly via email or phone below.',

  // ---- PosterDetail ----
  'poster.abstractLabel': 'Abstract',
  'poster.posterLabel': 'Poster',
  'poster.tldr': 'TL;DR Summary',
  'poster.openInNewTab': 'Open in new tab',
  'poster.loading': 'Loading poster…',
  'poster.copy': 'Copy',
  'poster.copied': 'Copied',
  'poster.affiliationLabel': 'Affiliation',
  'poster.citationLabel': 'Citation',
  'poster.clinicalPathway': 'Clinical Pathway',
  'poster.prevArticle': 'Previous',
  'poster.nextArticle': 'Next',
  'poster.posterNote':
    '* The poster is bilingual. Switch between EN / 中文 in the top-right corner of the poster; language auto-adapts to the current page.',

  // ---- Abstract section labels ----
  'abs.background': 'Background',
  'abs.objective': 'Objective',
  'abs.methods': 'Methods',
  'abs.results': 'Results',
  'abs.conclusions': 'Conclusions',

  // ---- Clinical pathway flowchart ----
  'flow.note': '* The above clinical pathway is based on published guidelines and consensus. Actual diagnosis and treatment should follow clinical judgment and the latest guidelines.',
  'flow.cervical.start.label': 'HPV screening positive',
  'flow.cervical.start.sub': 'or mild cytological abnormality (ASC-US)',
  'flow.cervical.test.label': 'PAX1/JAM3 Methylation Test',
  'flow.cervical.test.sub': 'CISCER®',
  'flow.cervical.pos.label': 'Methylation positive',
  'flow.cervical.pos.sub': 'High risk of high-grade lesions',
  'flow.cervical.neg.label': 'Methylation negative',
  'flow.cervical.neg.sub': 'Lower risk',
  'flow.cervical.end1.label': 'Colposcopy + Biopsy',
  'flow.cervical.end2.label': 'Regular follow-up',
  'flow.cervical.end2.sub': 'Reduce unnecessary referrals',
  'flow.endometrial.start.label': 'Abnormal uterine bleeding / postmenopausal high-risk',
  'flow.endometrial.test.label': 'CDO1/CELF4 Methylation Test',
  'flow.endometrial.test.sub': 'CISENDO® non-invasive screening',
  'flow.endometrial.pos.label': 'Methylation positive',
  'flow.endometrial.pos.sub': 'High risk of endometrial cancer',
  'flow.endometrial.neg.label': 'Methylation negative',
  'flow.endometrial.neg.sub': 'Lower risk',
  'flow.endometrial.end1.label': 'Hysteroscopy + Endometrial biopsy',
  'flow.endometrial.end2.label': 'Avoid unnecessary invasive procedures',
  'flow.ovarian.start.label': 'Ovarian cyst / pelvic mass',
  'flow.ovarian.start.sub': 'or high-risk populations',
  'flow.ovarian.test.label': 'CDO1/HOXA9 Methylation Test',
  'flow.ovarian.test.sub': 'CISOVA® peripheral blood',
  'flow.ovarian.pos.label': 'Methylation positive',
  'flow.ovarian.pos.sub': 'High risk of malignancy',
  'flow.ovarian.neg.label': 'Methylation negative',
  'flow.ovarian.neg.sub': 'Likely benign',
  'flow.ovarian.end1.label': 'Surgical exploration + Pathology',
  'flow.ovarian.end2.label': 'Follow-up or conservative management',

  // ---- 404 ----
  'notfound.title': 'Page Not Found',
  'notfound.desc': 'The page you are looking for may have been removed or is temporarily unavailable.',
  'notfound.back': 'Back to Home',

  // ---- Home products note ----
  'home.products.note':
    'All three products have obtained NMPA Class III medical device registrations, completed full Phase I/II/III clinical studies, and are recommended by multiple domestic and international clinical guidelines and expert consensus statements. All tests are based on non-invasive sampling, significantly improving patient compliance and promoting the adoption of gynecologic cancer early screening.',
  'home.products.noteHighlight': 'non-invasive sampling',
}

/* ---------- Context ---------- */

interface I18nContextValue {
  lang: Lang
  t: (key: string) => string
  setLang: (lang: Lang) => void
  toggleLang: () => void
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'zh',
  t: (key) => key,
  setLang: () => {},
  toggleLang: () => {},
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const { pathname, search, hash } = useLocation()
  const navigate = useNavigate()
  const lang: Lang = pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'zh'

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* 隐私模式下忽略 */
    }
  }, [lang])

  const setLang = (newLang: Lang) => {
    if (newLang === lang) return
    const barePath = pathname === '/en' ? '/' : pathname.replace(/^\/en(?=\/)/, '')
    const nextPath = newLang === 'en' ? (barePath === '/' ? '/en' : `/en${barePath}`) : barePath
    navigate(`${nextPath}${search}${hash}`)
  }

  const toggleLang = () => setLang(lang === 'zh' ? 'en' : 'zh')

  const t = (key: string): string => {
    const dict = lang === 'zh' ? zh : en
    return dict[key] ?? zh[key] ?? key
  }

  return <I18nContext.Provider value={{ lang, t, setLang, toggleLang }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}

/* ---------- 数据层辅助：按语言选字段 ---------- */

export function pick<T>(zh: T, en: T, lang: Lang): T {
  return lang === 'zh' ? zh : en
}
