import os, json, re, unicodedata
papers = json.load(open('src/data/papers.json', encoding='utf-8'))
def norm(s):
    if not s: return ''
    s = unicodedata.normalize('NFKC', s)
    return re.sub(r'[^\w\u4e00-\u9fff]+','',s.lower())

clip = {
 'cervical': 'source/blogs/cispoly-news-update/raw/clippings/academic_papers/CISCER',
 'endometrial': 'source/blogs/cispoly-news-update/raw/clippings/academic_papers/CISENDO',
 'ovarian': 'source/blogs/cispoly-news-update/raw/clippings/academic_papers/CISOVA',
}
clip_titles = {}
for c, d in clip.items():
    ts = []
    for f in os.listdir(d):
        if f.endswith('.md'):
            head = ""
            try:
                head = open(os.path.join(d,f), encoding="utf-8", errors="ignore").read(600)
            except OSError:
                head = ""
            m = re.search(r'title:\s*"([^"]+)"', head)
            ts.append(m.group(1) if m else f[:-3])
    clip_titles[c] = ts

def exists_in_papers(title, cancer):
    nt = norm(title)
    for p in papers:
        if p['cancer'] != cancer: continue
        pn = norm(p['title'])
        if nt == pn: return p['id']
        if len(nt) > 15 and len(pn) > 15 and (nt in pn or pn in nt): return p['id']
    return None

new_papers = [
 ('cervical', '何倩楠, 黄子杰 & HE Qian-nan, H. Z. PAX1/JAM3双基因联合甲基化检测在宫颈病变管理中的研究进展. 国际妇产科学杂志 53, 278–284.', 'PAX1/JAM3双基因联合甲基化检测在宫颈病变管理中的研究进展'),
 ('cervical', '刘勋姣 & 玉秀美. 宫颈脱落细胞基因甲基化检测对宫颈高级别病变术后残留及复发风险的预测意义. 中文科技期刊数据库（引文版）医药卫生 223–226 (2026).', '宫颈脱落细胞基因甲基化检测对宫颈高级别病变术后残留及复发风险的预测意义'),
 ('cervical', '娄琰琰 et al. JAM3基因DNA甲基化在宫颈高级别上皮内瘤变及术后复发预测的临床研究. Adv. Clin. Med. 14, 1293 (2024).', 'JAM3基因DNA甲基化在宫颈高级别上皮内瘤变及术后复发预测的临床研究'),
 ('cervical', '周敏, 左娟, 周戴, 陈丹, & 侯达. 宫颈脱落细胞PAX1、JAM3基因甲基化对宫颈上皮内瘤变预测作用的初步研究. 湖南师范大学学报医学版 22, 123–128.', '宫颈脱落细胞PAX1、JAM3基因甲基化对宫颈上皮内瘤变预测作用的初步研究'),
 ('cervical', 'Geng, T., Li, S., Bian, Y., Li, X. & Bian, Y. Association of PAX1/JAM3 gene methylation, HR-HPV, and TCT with high-grade cervical lesions in a high-risk cohort: a multinomial logistic regression analysis. BMC Womens Health https://doi.org/10.1186/s12905-026-04622-9 (2026).', 'Association of PAX1/JAM3 gene methylation, HR-HPV, and TCT with high-grade cervical lesions'),
 ('cervical', 'Li, M. et al. Preliminary study on PAX1/JAM3 methylation and HPV viral load in CIN3-like squamous cell carcinoma: Are there differences from CIN3 and early invasive carcinoma? Clin Epigenet https://doi.org/10.1186/s13148-026-02201-1 (2026).', 'Preliminary study on PAX1/JAM3 methylation and HPV viral load in CIN3-like squamous cell carcinoma'),
 ('cervical', 'Yang, Q. et al. Comparative evaluation of two DNA methylation assays for triage of hrHPV E6/E7 mRNA–positive women. Front. Public Health 13, (2025).', 'Comparative evaluation of two DNA methylation assays for triage of hrHPV E6/E7 mRNA'),
]
print('=== 新文献清单（引用列表有、站内无）===')
for c, cite, t in new_papers:
    has_clip = any(norm(t) in norm(x) or norm(x) in norm(t) for x in clip_titles[c])
    tag = 'clippings有全文' if has_clip else '仅引用串'
    print(f'  [{c}] [{tag}] {t[:50]}')
    print(f'         {cite[:95]}')
