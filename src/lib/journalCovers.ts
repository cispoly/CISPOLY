const COVER_ROOT = '/images/journal-covers/_journals/'

// Issue-specific covers supplied for papers whose journal publishes multiple
// issues in the local index. These take precedence over the journal fallback.
// User-supplied issue covers take precedence over the journal-level fallback.
const paperCovers: Record<string, string> = {
  '27_joint_methylation_progress': `${COVER_ROOT}international-journal-obstetrics-2026.jpg`,
  '12_minimally_abnormal_management': `${COVER_ROOT}ijgo-155-3.png`,
  '20_screening_treatment_review': `${COVER_ROOT}international-journal-obstetrics-2025.jpg`,
  '3_multicenter_screening': `${COVER_ROOT}zhonghua-yi-xue-za-zhi-2024.png`,
  '26_diagnostic_accuracy_meta': `${COVER_ROOT}european-journal-cancer-user.jpg`,
  '28_postop_recurrence_prediction': `${COVER_ROOT}yiyao-weisheng.webp`,
  '19_hrhpv_diagnostic_value': `${COVER_ROOT}90825x2025010f0001.jpg`,
  '31_jam3_recurrence_prediction': `${COVER_ROOT}72374x2024007f0001.jpg`,
  '1_postmenopausal_screening': `${COVER_ROOT}zhonghua-yi-xue-za-zhi-2024.png`,
  '10_paired_sample_validation': `${COVER_ROOT}frontiers-in-medicine-article.jpg`,
}

const guidelineCovers: Record<string, string> = {
  '2_ec_methylation_consensus2026': `${COVER_ROOT}zhonghua-yi-xue-za-zhi-2024.png`,
  '1_methylation_tech_spec': '/blogs/cispolys-methylation-tests-for-three/img-01.png',
}

const covers: Array<[string[], string]> = [
  [['bmc women', 'bmc womens'], `${COVER_ROOT}bmc-womens-health.jpg`],
  [['clinical epigenetics'], `${COVER_ROOT}clinical-epigenetics.jpg`],
  [['bmc cancer'], `${COVER_ROOT}bmc-cancer.jpg`],
  [['frontiers in medicine'], `${COVER_ROOT}frontiers-in-medicine-cover.svg`],
  [['frontiers in oncology'], `${COVER_ROOT}frontiers-oncology.png`],
  [['int j cancer', 'international journal of cancer', 'international journal cancer'], `${COVER_ROOT}international-journal-cancer.jpg`],
  [['international journal of gynecological cancer', 'international journal gynecological cancer', '国际妇科肿瘤学杂志'], `${COVER_ROOT}international-journal-gyn-cancer.jpg`],
  [['gynecologic oncology'], `${COVER_ROOT}gynecologic-oncology.jpg`],
  [['american journal of cancer research', 'american journal cancer research'], `${COVER_ROOT}american-journal-cancer-research.jpg`],
  [['british journal of cancer', 'british journal cancer'], `${COVER_ROOT}british-journal-cancer.jpg`],
  [['european journal of cancer'], `${COVER_ROOT}european-journal-cancer.jpg`],
  [['中华检验医学杂志', 'chinese journal laboratory medicine', 'chinese journal of laboratory medicine'], `${COVER_ROOT}chinese-lab-medicine.jpg`],
  [['laboratory medicine'], `${COVER_ROOT}laboratory-medicine.jpg`],
  [['scientific reports'], `${COVER_ROOT}scientific-reports.jpeg`],
  [['cancers'], `${COVER_ROOT}cancers.png`],
  [['diagnostics'], `${COVER_ROOT}diagnostics.png`],
  [['the oncologist'], `${COVER_ROOT}the-oncologist.jpeg`],
  [['jco precision oncology'], `${COVER_ROOT}jco-precision-oncology.jpg`],
  [['reproductive and developmental medicine'], `${COVER_ROOT}reproductive-developmental-medicine.png`],
  [['central south university'], `${COVER_ROOT}central-south-university.jpg`],
  [['zhonghua yi xue za zhi', '中华医学杂志', 'chinese medical journal'], `${COVER_ROOT}national-medical-journal.jpg`],
  [['中国妇产科临床杂志', 'chinese journal clinical obstetrics'], `${COVER_ROOT}chinese-clinical-obstet.jpg`],
  [['中国实用妇科与产科杂志', 'chinese journal practical gynecology'], `${COVER_ROOT}chinese-practical-gyn.jpg`],
  [['中国癌症防治杂志', 'chinese journal cancer prevention'], `${COVER_ROOT}china-oncology-prevention.jpg`],
  [['湖南师范大学学报', 'hunan normal'], `${COVER_ROOT}hunan-normal-medical.png`],
  [['兰州大学学报', 'lanzhou university'], `${COVER_ROOT}central-south-university.jpg`],
  [['国际妇产科学杂志', 'international journal of obstetrics and gynecology', 'international journal of gynaecology and obstetrics', 'international journal obstetrics'], `${COVER_ROOT}ijgo-155-3.png`],
  [['标记免疫分析与临床', 'labeled immunoassays'], `${COVER_ROOT}chinese-lab-medicine.jpg`],
  [['现代妇产科进展', 'progress in obstetrics'], `${COVER_ROOT}chinese-clinical-obstet.jpg`],
  [['临床医学进展', 'advances in clinical medicine'], `${COVER_ROOT}chinese-clinical-obstet.jpg`],
  [['中文科技期刊数据库', 'china science and technology journal'], `${COVER_ROOT}chinese-lab-medicine.jpg`],
  [['团体标准', 'group standard'], `${COVER_ROOT}chinese-lab-medicine.jpg`],
  [['中华保健医学杂志', 'chinese journal of health care and medicine'], `${COVER_ROOT}zhonghua-healthcare.jpg`],
  [['cytojournal'], `${COVER_ROOT}cytojournal.jpg`],
]

export function journalCoverFor(journal?: string) {
  const value = (journal ?? '').toLowerCase()
  return covers.find(([names]) => names.some((name) => value.includes(name.toLowerCase())))?.[1]
}

export function paperCoverFor(id: string, journal?: string) {
  return paperCovers[id] ?? journalCoverFor(journal)
}

export function guidelineCoverFor(id: string, publisher?: string) {
  return guidelineCovers[id] ?? journalCoverFor(publisher)
}
