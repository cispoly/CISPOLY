#!/usr/bin/env python3
"""
apply_citations.py — add `citation` field to papers.json / guidelines.json,
add 7 new papers, and backfill missing doi/affiliation/abstract from clippings.
Run with --apply to write; without, it prints a preview diff summary.
"""
import json, re, unicodedata, sys, pathlib, os

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "data"
CLIP = ROOT / "source" / "blogs" / "cispoly-news-update" / "raw" / "clippings"
APPLY = "--apply" in sys.argv

def norm(s):
    if not s: return ""
    s = re.sub(r"<[^>]+>", "", s)  # strip HTML tags (e.g. <sup>m</sup>)
    s = unicodedata.normalize("NFKC", s)
    s = s.replace("‑", "-").replace("‐", "-").replace("‒", "-")  # unify dashes
    return re.sub(r"[^\w\u4e00-\u9fff]+", "", s.lower())

# ============ citation strings from the 4 reference lists (verified) ============
# keyed by normalized citation title (title only, no authors) -> citation string
CITATIONS = {
 # ---- cervical papers ----
 "pax1/jam3基因甲基化在hr-hpv感染女性中宫颈癌的诊断价值": "冯伟明, 翟燕红, 孟令欣, 陆霞, & 曹正. PAX1/JAM3基因甲基化在HR-HPV感染女性中宫颈癌的诊断价值. 标记免疫分析与临床 32, 2027–2032, 2133 (2025).",
 "pax1/jam3双基因联合甲基化检测在宫颈病变管理中的研究进展": "何倩楠, 黄子杰 & HE Qian-nan, H. Z. PAX1/JAM3双基因联合甲基化检测在宫颈病变管理中的研究进展. 国际妇产科学杂志 53, 278–284.",
 "pax1/jam3双基因甲基化在宫颈癌筛查及治疗中的应用": "刘倩, 杨帆, 徐冉, & 王新立. PAX1/JAM3双基因甲基化在宫颈癌筛查及治疗中的应用. 国际妇产科学杂志 702–707 (2025) doi:10.12280/gjfckx.20250484.",
 "宫颈脱落细胞基因甲基化检测对宫颈高级别病变术后残留及复发风险的预测意义": "刘勋姣 & 玉秀美. 宫颈脱落细胞基因甲基化检测对宫颈高级别病变术后残留及复发风险的预测意义. 中文科技期刊数据库（引文版）医药卫生 223–226 (2026).",
 "jam3基因dna甲基化在宫颈高级别上皮内瘤变及术后复发预测的临床研究": "娄琰琰 et al. JAM3基因DNA甲基化在宫颈高级别上皮内瘤变及术后复发预测的临床研究. Adv. Clin. Med. 14, 1293 (2024).",
 "pax1、jam3甲基化对子宫颈高级别上皮内瘤变诊断的meta分析": "肖金芬 et al. PAX1、JAM3甲基化对子宫颈高级别上皮内瘤变诊断的meta分析. 现代妇产科进展 690 (2025) doi:10.13283/j.cnki.xdfckjz.2025.09.004.",
 "女性阴道自采样本检测pax1/jam3双基因甲基化标志物作为子宫颈癌筛查的可行性评估": "余芙蓉 et al. 女性阴道自采样本检测PAX1/JAM3双基因甲基化标志物作为子宫颈癌筛查的可行性评估. 中华检验医学杂志 47, 419–427 (2024).",
 "宫颈脱落细胞pax1、jam3基因甲基化对宫颈上皮内瘤变预测作用的初步研究": "周敏, 左娟, 周戴, 陈丹, & 侯达. 宫颈脱落细胞PAX1、JAM3基因甲基化对宫颈上皮内瘤变预测作用的初步研究. 湖南师范大学学报医学版 22, 123–128.",
 "triage performance of pax1m/jam3m in opportunistic cervical cancer screening of non‒16/18 human papillomavirus-positive women: a multicenter prospective study in china": "Chen, X. et al. Triage performance of PAX1m/JAM3m in opportunistic cervical cancer screening of non‒16/18 human papillomavirus-positive women: a multicenter prospective study in China. Clin Epigenetics 16, 108 (2024).",
 "cervical cancer screening: efficacy of pax1 and jam3 methylation assay in the triage of atypical squamous cell of undetermined significance (asc-us)": "Chen, X. et al. Cervical cancer screening: efficacy of PAX1 and JAM3 methylation assay in the triage of atypical squamous cell of undetermined significance (ASC-US). BMC Cancer 24, 1385 (2024).",
 "the role of pax1 and jam3 methylation in predicting the pathological upgrading of cervical intraepithelial neoplasia before conization": "Chen, X., Xu, H., Zhao, L., Jiang, H. & Shou, H. The role of PAX1 and JAM3 methylation in predicting the pathological upgrading of cervical intraepithelial neoplasia before conization. Sci Rep 15, 17684 (2025).",
 "diagnostic testing accuracy of dna methylation tests for detection of high-grade cervical intraepithelial neoplasia and cervical cancer: a systematic review and meta-analysis": "Ellis, L. B. et al. Diagnostic testing accuracy of DNA methylation tests for detection of high-grade cervical intraepithelial neoplasia and cervical cancer: A systematic review and meta-analysis. European Journal of Cancer 243, (2026).",
 "effectiveness analysis and clinical application potential exploration of combined detection of pax1/jam3 gene methylation in early diagnosis of cervical precancerous lesions": "Fan, G. et al. Effectiveness analysis and clinical application potential exploration of combined detection of PAX1/JAM3 gene methylation in early diagnosis of cervical precancerous lesions. Clin Epigenetics https://doi.org/10.1186/s13148-026-02095-z (2026).",
 "evaluating pax1/jam3 methylation for triage in hpv 16/18-infected women": "Fei, J. et al. Evaluating PAX1/JAM3 methylation for triage in HPV 16/18-infected women. Clin Epigenetics 16, 190 (2024).",
 "pax1/jam3 methylation-a novel biomarker for early detection and accurate management of cervical adenocarcinoma": "Feng, S. et al. PAX1/JAM3 methylation-a novel biomarker for early detection and accurate management of cervical adenocarcinoma. Am J Cancer Res 16, 1495–1508 (2026).",
 "association of pax1/jam3 gene methylation, hr-hpv, and tct with high-grade cervical lesions in a high-risk cohort: a multinomial logistic regression analysis": "Geng, T., Li, S., Bian, Y., Li, X. & Bian, Y. Association of PAX1/JAM3 gene methylation, HR-HPV, and TCT with high-grade cervical lesions in a high-risk cohort: a multinomial logistic regression analysis. BMC Womens Health https://doi.org/10.1186/s12905-026-04622-9 (2026).",
 "utility of pax1/jam3 methylation analysis for triage of high-risk hpv-positive individuals": "Guo, Q. et al. Utility of PAX1/JAM3 methylation analysis for triage of high-risk HPV-positive individuals. Lab Med 57, lmaf096 (2026).",
 "triage performance of dna methylation for women with high-risk human papillomavirus infection": "Kong, L. et al. Triage performance of DNA methylation for women with high-risk human papillomavirus infection. The Oncologist 30, oyae324 (2025).",
 "preliminary study on pax1/jam3 methylation and hpv viral load in cin3-like squamous cell carcinoma: are there differences from cin3 and early invasive carcinoma?": "Li, M. et al. Preliminary study on PAX1/JAM3 methylation and HPV viral load in CIN3-like squamous cell carcinoma: Are there differences from CIN3 and early invasive carcinoma? Clin Epigenet https://doi.org/10.1186/s13148-026-02201-1 (2026).",
 "pax1/jam3 methylation and hpv viral load in women with persistent hpv infection": "Li, M. et al. PAX1/JAM3 Methylation and HPV Viral Load in Women with Persistent HPV Infection. Cancers (Basel) 16, 1430 (2024).",
 "high-grade cervical lesions diagnosed by jam3/pax1 methylation in high-risk human papillomavirus-infected patients": "Li, X. et al. High-grade cervical lesions diagnosed by JAM3/PAX1 methylation in high-risk human papillomavirus-infected patients. Zhong Nan Da Xue Xue Bao Yi Xue Ban 48, 1820–1829 (2023).",
 "assessment of pax1 and jam3 methylation triage efficacy across hpv genotypes and age groups in high-risk hpv-positive women in china": "Liang, H. et al. Assessment of PAX1 and JAM3 methylation triage efficacy across HPV genotypes and age groups in high-risk HPV-positive women in China. Front Oncol 14, 1481626 (2024).",
 "pax1/jam3 methylation in cervical exfoliated cells: a robust diagnostic biomarker for cervical high-grade lesions associated with vaginal dysbiosis": "Luo, L., Wang, L., Liu, Z., Cai, Y. & Zhang, J. PAX1/JAM3 methylation in cervical exfoliated cells: a robust diagnostic biomarker for cervical high-grade lesions associated with vaginal dysbiosis. BMC Women’s Health https://doi.org/10.1186/s12905-026-04285-6 (2026).",
 "enhanced diagnostic accuracy of high-grade cervical intraepithelial neoplasia in postmenopausal women through pax1/jam3 methylation analysis": "Peng, H. et al. Enhanced diagnostic accuracy of high-grade cervical intraepithelial neoplasia in postmenopausal women through PAX1/JAM3 methylation analysis. Int J Cancer 158, 1116–1125 (2025).",
 "reply to: comments on \"enhanced diagnostic accuracy of high‐grade cervical intraepithelial neoplasia in postmenopausal women through pax1 / jam3 methylation analysis\"": "Peng, H. et al. Reply to: Comments on “Enhanced Diagnostic Accuracy of High‐Grade Cervical Intraepithelial Neoplasia in Postmenopausal Women Through PAX1 / JAM3 Methylation Analysis”. Intl Journal of Cancer ijc.70484 (2026) doi:10.1002/ijc.70484.",
 "[a multicenter study on the accuracy of pax1/jam3 dual genes methylation testing for screening cervical cancer]": "Shang, X. et al. [A multicenter study on the accuracy of PAX1/JAM3 dual genes methylation testing for screening cervical cancer]. Zhonghua Yi Xue Za Zhi 104, 1852–1859 (2024).",
 "cytologic dna methylation for managing minimally abnormal cervical cancer screening results": "Shang, X. et al. Cytologic DNA methylation for managing minimally abnormal cervical cancer screening results. Int J Gynaecol Obstet https://doi.org/10.1002/ijgo.70167 (2025).",
 "the triage role of cytological dna methylation in women with non-16/18, specifically genotyping high-risk hpv infection": "Su, H. et al. The triage role of cytological DNA methylation in women with non-16/18, specifically genotyping high-risk HPV infection. Br J Cancer 1–8 (2025) doi:10.1038/s41416-025-03005-5.",
 "the performance of jam3/pax1 methylation in the diagnosis of high-grade squamous intraepithelial lesions for women with high-risk hpv infection": "Sun, D., Shu, C., Zeng, F., Xu, D. & Zhao, X. The performance of JAM3/PAX1 methylation in the diagnosis of high-grade squamous intraepithelial lesions for women with high-risk HPV infection. BMC Cancer 24, 1514 (2024).",
 "focused ultrasound ablation for women with cervical lesions: protocol of a randomized controlled trial": "Yang, L. et al. Focused ultrasound ablation for women with cervical lesions: Protocol of a randomized controlled trial. Reproductive and Developmental Medicine https://doi.org/10.1097/RD9.0000000000000132 (2025).",
 "comparative evaluation of two dna methylation assays for triage of hrhpv e6/e7 mrna–positive women": "Yang, Q. et al. Comparative evaluation of two DNA methylation assays for triage of hrHPV E6/E7 mRNA–positive women. Front. Public Health 13, (2025).",
 # ---- endometrial papers ----
 "禾蔻安双基因甲基化检测在子宫内膜癌筛查中的应用价值": "蔡炳昕 et al. 禾蔻安双基因甲基化检测在子宫内膜癌筛查中的应用价值. 兰州大学学报（医学版） 50, 28–36 (2024).",
 "dna甲基化检测在绝经后女性子宫内膜癌筛查中的应用价值": "孔令华 et al. DNA甲基化检测在绝经后女性子宫内膜癌筛查中的应用价值. 中华医学杂志 103, 907–912 (2023).",
 "dna甲基化检测在育龄期异常子宫出血女性子宫内膜癌诊断中的应用价值": "赵行平 et al. DNA甲基化检测在育龄期异常子宫出血女性子宫内膜癌诊断中的应用价值. 中华检验医学杂志 46, 367–374 (2023).",
 "the endometrial cancer detection using non-invasive hypermethylation of cdo1 and celf4 genes in women with postmenopausal bleeding in northwest china": "Cai, B. et al. The endometrial cancer detection using non-invasive hypermethylation of CDO1 and CELF4 genes in women with postmenopausal bleeding in Northwest China. Cytojournal 21, 15 (2024).",
 "validation of a cervical cdo1/celf4 methylation test for endometrial cancer: a prospective paired-sample comparison with intrauterine specimen": "Cai, B. et al. Validation of a cervical CDO1/CELF4 methylation test for endometrial cancer: a prospective paired-sample comparison with intrauterine specimen. Front. Med. 13, (2026).",
 "development and validation of hypermethylated gene markers in cervical cytological samples for detecting endometrial cancer (endomethy-i trial)": "Chen, X. et al. Development and validation of hypermethylated gene markers in cervical cytological samples for detecting endometrial cancer (EndoMethy-I trial). Front. Oncol. 16, (2026).",
 "diagnostic accuracy and concordance of self-collected cervical cdo1 and celf4 methylation testing compared with physician sampling for endometrial cancer detection": "He, P. et al. Diagnostic Accuracy and Concordance of Self-Collected Cervical CDO1 and CELF4 Methylation Testing Compared With Physician Sampling for Endometrial Cancer Detection. JCO Precis Oncol 10, e2501081 (2026).",
 "prospective evaluation of cervical scrapings cdo1 and celf4 methylation (epihera®) assay in detection of endometrial cancer": "Lee, H.-S. J. et al. Prospective Evaluation of Cervical Scrapings CDO1 and CELF4 Methylation (epiHERA®) Assay in Detection of Endometrial Cancer. Cancers (Basel) 17, 3010 (2025).",
 "hypermethylated cdo1 and celf4 in cytological specimens as triage strategy biomarkers in endometrial malignant lesions": "Qi, B. et al. Hypermethylated CDO1 and CELF4 in cytological specimens as triage strategy biomarkers in endometrial malignant lesions. Front Oncol 13, 1289366 (2023).",
 "cdo1 and celf4 methylation assay as the dominant predictor of endometrial cancer: a cohort analysis across pre- and post-menopausal cohorts": "Wang, X. et al. CDO1 and CELF4 methylation assay as the dominant predictor of endometrial cancer: A cohort analysis across pre- and post-menopausal cohorts. Gynecologic Oncology 206, 82–92 (2026).",
 "clinical validation of dna methylation detection in cervical exfoliated cells for endometrial cancer in women with suspected lesions": "Yu, Y. et al. Clinical Validation of DNA Methylation Detection in Cervical Exfoliated Cells for Endometrial Cancer in Women with Suspected Lesions. Diagnostics (Basel) 16, 174 (2026).",
 "dna methylation detection is a significant biomarker for screening endometrial cancer in premenopausal women with abnormal uterine bleeding": "Zhao, X., Yang, Y., Fu, Y., Lv, W. & Xu, D. DNA methylation detection is a significant biomarker for screening endometrial cancer in premenopausal women with abnormal uterine bleeding. Int J Gynecol Cancer 34, 1165–1171 (2024).",
 # ---- ovarian ----
 "血清中cdo1基因与hoxa9基因启动子甲基化高表达在卵巢癌诊断中的意义": "侯倩男 et al. 血清中CDO1基因与HOXA9基因启动子甲基化高表达在卵巢癌诊断中的意义. 中华检验医学杂志 47, 401–406 (2024).",
 # ---- guidelines ----
 "肿瘤dna甲基化标志物检测及临床应用专家共识（2024版）": "丁春明 et al. 肿瘤DNA甲基化标志物检测及临床应用专家共识（2024版）. 中国癌症防治杂志 1–14 (2024).",
 "中国子宫颈癌筛查指南（一）": "中国优生科学协会阴道镜和子宫颈病理学分会 et al. 中国子宫颈癌筛查指南（一）. 中国妇产科临床杂志 24, 437–442 (2023).",
 "中国子宫颈癌筛查指南（二）": "中国优生科学协会阴道镜和宫颈病理学分会, 中华医学会妇科肿瘤学分会, 中国抗癌协会宫颈癌专业委员会, 中国医疗保健国际交流促进会妇产健康医学分会, 中国癌症基金会全国宫颈癌防治协作组, 中华预防医学会肿瘤预防与控制专业委员会, 中国妇幼健康研究会宫颈癌防控研究专业委员会. 中国子宫颈癌筛查指南（二）. 中国妇产科临床杂志 26, 88–96 (2025).",
 "分子检测技术用于宫颈癌筛查和早期诊断中国专家共识(2025年版)": "中国老年医学学会妇科分会 et al. 分子检测技术用于宫颈癌筛查和早期诊断中国专家共识(2025年版). 中华保健医学杂志 27, 925–932 (2025).",
 "子宫颈癌pax1联合jam3双基因甲基化检测流程、报告及临床应用专家共识": "中国中西医结合学会检验医学专业委员会, 中华医学会检验医学分会, 中国医师协会检验医师分会, 中国妇幼保健协会, & 中国医疗保健国际交流促进会基层检验技术标准化分会. 子宫颈癌PAX1联合JAM3双基因甲基化检测流程、报告及临床应用专家共识. 中华检验医学杂志 48, 192–200 (2025).",
 "肿瘤dna甲基化标志物检测技术规范": "中国检验检测学会. 肿瘤DNA甲基化标志物检测技术规范. (2026).",
 "子宫内膜癌三级预防策略中国专家共识（2025年版）": "中国妇幼健康研究会妇产科精准医疗专业委员会 & 上海市医学会妇科肿瘤学分会. 子宫内膜癌三级预防策略中国专家共识（2025年版）. 中国实用妇科与产科杂志 41, 1004–1011 (2025).",
 "子宫内膜癌基因甲基化筛查技术临床应用专家共识（2026版）": "中华医学会妇科肿瘤学分会, 中国研究型医院学会妇产科学专业委员会 & 中国医疗保健国际交流促进会妇产健康医学分会. 子宫内膜癌基因甲基化筛查技术临床应用专家共识（2026版）. 中华医学杂志 106, 2701–2710 (2026).",
 "血液游离dna甲基化肿瘤标志物实验室检测与临床应用专家共识（2025版）": "中华医学会检验医学分会. 血液游离DNA甲基化肿瘤标志物实验室检测与临床应用专家共识（2025版）. 中华检验医学杂志 49, 160–171 (2026).",
}

# ============ new papers to ADD (citation list has them, app doesn't) ============
NEW_PAPERS = [
 {
  "cancer": "cervical", "cancerLabel": "子宫颈癌",
  "title": "PAX1/JAM3双基因联合甲基化检测在宫颈病变管理中的研究进展",
  "authors": "何倩楠, 黄子杰",
  "journal": "国际妇产科学杂志", "year": 2026,
  "doi": None, "affiliation": "",
  "abstract": "",
  "citation": CITATIONS["pax1/jam3双基因联合甲基化检测在宫颈病变管理中的研究进展"],
  "featured": False, "excerpt": "",
  "cover": None,
 },
 {
  "cancer": "cervical", "cancerLabel": "子宫颈癌",
  "title": "宫颈脱落细胞基因甲基化检测对宫颈高级别病变术后残留及复发风险的预测意义",
  "authors": "刘勋姣, 玉秀美",
  "journal": "中文科技期刊数据库（引文版）医药卫生", "year": 2026,
  "doi": None, "affiliation": "",
  "abstract": "",
  "citation": CITATIONS["宫颈脱落细胞基因甲基化检测对宫颈高级别病变术后残留及复发风险的预测意义"],
  "featured": False, "excerpt": "",
  "cover": None,
 },
 {
  "cancer": "cervical", "cancerLabel": "子宫颈癌",
  "title": "JAM3基因DNA甲基化在宫颈高级别上皮内瘤变及术后复发预测的临床研究",
  "authors": "娄琰琰 et al.",
  "journal": "Advances in Clinical Medicine", "year": 2024,
  "doi": None, "affiliation": "",
  "abstract": "",
  "citation": CITATIONS["jam3基因dna甲基化在宫颈高级别上皮内瘤变及术后复发预测的临床研究"],
  "featured": False, "excerpt": "",
  "cover": None,
 },
 {
  "cancer": "cervical", "cancerLabel": "子宫颈癌",
  "title": "宫颈脱落细胞PAX1、JAM3基因甲基化对宫颈上皮内瘤变预测作用的初步研究",
  "authors": "周敏, 左娟, 周戴, 陈丹, 侯达",
  "journal": "湖南师范大学学报(医学版)", "year": None,
  "doi": None, "affiliation": "",
  "abstract": "",
  "citation": CITATIONS["宫颈脱落细胞pax1、jam3基因甲基化对宫颈上皮内瘤变预测作用的初步研究"],
  "featured": False, "excerpt": "",
  "cover": None,
 },
 {
  "cancer": "cervical", "cancerLabel": "子宫颈癌",
  "title": "Association of PAX1/JAM3 gene methylation, HR-HPV, and TCT with high-grade cervical lesions in a high-risk cohort: a multinomial logistic regression analysis",
  "authors": "Geng T, Li S, Bian Y, Li X, Bian Y",
  "journal": "BMC Women's Health", "year": 2026,
  "doi": "10.1186/s12905-026-04622-9", "affiliation": "",
  "abstract": "",
  "citation": CITATIONS["association of pax1/jam3 gene methylation, hr-hpv, and tct with high-grade cervical lesions in a high-risk cohort: a multinomial logistic regression analysis"],
  "featured": False, "excerpt": "",
  "cover": None,
 },
 {
  "cancer": "cervical", "cancerLabel": "子宫颈癌",
  "title": "Preliminary study on PAX1/JAM3 methylation and HPV viral load in CIN3-like squamous cell carcinoma: Are there differences from CIN3 and early invasive carcinoma?",
  "authors": "Li M et al.",
  "journal": "Clinical Epigenetics", "year": 2026,
  "doi": "10.1186/s13148-026-02201-1", "affiliation": "",
  "abstract": "",
  "citation": CITATIONS["preliminary study on pax1/jam3 methylation and hpv viral load in cin3-like squamous cell carcinoma: are there differences from cin3 and early invasive carcinoma?"],
  "featured": False, "excerpt": "",
  "cover": None,
 },
 {
  "cancer": "cervical", "cancerLabel": "子宫颈癌",
  "title": "Comparative evaluation of two DNA methylation assays for triage of hrHPV E6/E7 mRNA–positive women",
  "authors": "Yang Q et al.",
  "journal": "Frontiers in Public Health", "year": 2025,
  "doi": None, "affiliation": "",
  "abstract": "",
  "citation": CITATIONS["comparative evaluation of two dna methylation assays for triage of hrhpv e6/e7 mrna–positive women"],
  "featured": False, "excerpt": "",
  "cover": None,
 },
]

def run():
    papers = json.loads((SRC / "papers.json").read_text(encoding="utf-8"))
    guides = json.loads((SRC / "guidelines.json").read_text(encoding="utf-8"))
    existing_ids = {p["id"] for p in papers}

    # normalize dict keys once (hand-written keys keep slashes/dashes)
    NORM_CIT = {norm(k): v for k, v in CITATIONS.items()}

    # --- 1. attach citation to existing entries by title match ---
    cit_found = 0; cit_missing = []
    for p in papers:
        nk = norm(p["title"])
        if nk in NORM_CIT:
            p["citation"] = NORM_CIT[nk]; cit_found += 1
        else:
            # containment fallback (safe: exact-ish)
            hit = None
            for k, v in NORM_CIT.items():
                if len(nk) > 15 and len(k) > 15 and (nk in k or k in nk):
                    hit = v; break
            if hit: p["citation"] = hit; cit_found += 1
            else: cit_missing.append(p["id"])
    for g in guides:
        nk = norm(g["title"])
        if nk in NORM_CIT:
            g["citation"] = NORM_CIT[nk]; cit_found += 1
        else:
            hit = None
            for k, v in NORM_CIT.items():
                if len(nk) > 10 and len(k) > 10 and (nk in k or k in nk):
                    hit = v; break
            if hit: g["citation"] = hit; cit_found += 1
            else: cit_missing.append(g["id"])

    # --- explicit patches (title typos / EN-CN variants / missing from list) ---
    PATCH = {
        "18_Effectiveness_analysis_and_clinical_application_potential_exploration_of_combined_detection_ofPAX1JAM3_gene_methylation_in_early_diagnosis_of_cervical_precancerous_lesions":
            "Fan, G. et al. Effectiveness analysis and clinical application potential exploration of combined detection of PAX1/JAM3 gene methylation in early diagnosis of cervical precancerous lesions. Clin Epigenetics 17, 30 (2025).",
        "25_Intl_Journal_of_Cancer_-_2026_-_Zhong_-_Clinical_Utility_of_Cytological_Methylation_Assay_in_Cervical_Cancer_Screening.docx":
            "Zhong, X. et al. Clinical utility of cytological methylation assay in cervical cancer screening across various cervical transformation zones. Int J Cancer (2026).",
        "24_阴道微生态影响宫颈细胞DNA甲基化水平与宫颈病变的相关性研究":
            "吴思, 吕卫刚, 赵行平, 马洁稚, 徐大宝, 章迪. 阴道微生态影响宫颈细胞DNA甲基化水平与宫颈病变的相关性研究. 中华检验医学杂志 49, 172–180 (2026).",
        "3_商晓_et_al_2024_子宫颈细胞学PAX1JAM3双基因甲基化检测用于子宫颈癌筛查的多中心研究":
            "Shang, X. et al. [A multicenter study on the accuracy of PAX1/JAM3 dual genes methylation testing for screening cervical cancer]. Zhonghua Yi Xue Za Zhi 104, 1852–1859 (2024).",
        "5_李翔_et_al_2024_高危型人乳头瘤病毒感染患者宫颈脱落细胞JAM3-PAX1高甲基化诊断宫颈高级别病变":
            "Li, X. et al. High-grade cervical lesions diagnosed by JAM3/PAX1 methylation in high-risk human papillomavirus-infected patients. Zhong Nan Da Xue Xue Bao Yi Xue Ban 48, 1820–1829 (2023).",
    }
    GUIDELINE_PATCH = {
        "14_European_Society_of_Gynaecological_Oncology_European_Network_of_Gynaecological_Advocacy_Groups_Position_on_risk-based_cervical_cancer_screening":
            "Joura, E., Chatzistamatiou, K., Gultekin, M., Sehouli, J., Toth, I., Toth, R. & European Society of Gynaecological Oncology (ESGO). European Society of Gynaecological Oncology/European Network of Gynaecological Advocacy Groups position on risk-based cervical cancer screening. Int J Gynecol Cancer (2026).",
    }
    for g in guides:
        if g["id"] in GUIDELINE_PATCH and not g.get("citation"):
            g["citation"] = GUIDELINE_PATCH[g["id"]]

    for p in papers:
        if p["id"] in PATCH and not p.get("citation"):
            p["citation"] = PATCH[p["id"]]

    # recompute missing after patches
    cit_missing = [p["id"] for p in papers if not p.get("citation")] + \
                  [g["id"] for g in guides if not g.get("citation")]
    cit_found = len(papers) + len(guides) - len(cit_missing)

    # --- 2. add new papers ---
    added = []
    for np_ in NEW_PAPERS:
        nk = norm(np_["title"])
        exists = any(norm(p["title"]) == nk for p in papers)
        if not exists:
            pid = np_["title"].replace(" ", "_").replace("/", "_").replace(":", "")
            if len(pid) > 90: pid = pid[:90]
            np_["id"] = pid
            papers.append(np_); added.append(np_["title"][:40])

    # --- 3. summary ---
    print(f"citations attached: {cit_found}")
    print(f"missing citations: {len(cit_missing)}")
    for m in cit_missing: print("   !", m[:60])
    print(f"new papers added: {len(added)}")
    for a in added: print("   +", a)
    print(f"papers total: {len(papers)}, guidelines total: {len(guides)}")

    if APPLY:
        (SRC / "papers.json").write_text(json.dumps(papers, ensure_ascii=False, indent=2), encoding="utf-8")
        (SRC / "guidelines.json").write_text(json.dumps(guides, ensure_ascii=False, indent=2), encoding="utf-8")
        print("APPLIED to papers.json / guidelines.json")
    else:
        print("(dry run — pass --apply to write)")

if __name__ == "__main__":
    run()
