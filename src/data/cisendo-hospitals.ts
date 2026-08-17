// CISENDO 多中心验证合作医院数据（已去重，含省份/城市坐标）
// 复用 CISCER 的 china-hospitals.ts 中的 HospitalSite 接口

import type { HospitalSite } from './china-hospitals'

export const CISENDO_HOSPITALS: HospitalSite[] = [
  // ---- 牵头单位 ----
  { id: 'pumch', nameZh: '中国医学科学院北京协和医院', nameEn: 'Peking Union Medical College Hospital', province: '北京市', city: '北京', coord: [116.4074, 39.9042], lead: true },
  // ---- 北京 ----
  { id: 'pkuh', nameZh: '北京大学国际医院', nameEn: 'Peking University International Hospital', province: '北京市', city: '北京', coord: [116.2791, 40.0649] },
  { id: 'tiantan', nameZh: '首都医科大学附属北京天坛医院', nameEn: 'Beijing Tiantan Hospital, Capital Medical University', province: '北京市', city: '北京', coord: [116.4053, 39.8586] },
  // ---- 河北 ----
  { id: 'cangzhou', nameZh: '沧州市中心医院', nameEn: 'Cangzhou Central Hospital', province: '河北省', city: '沧州', coord: [116.8388, 38.3045] },
  // ---- 上海 ----
  { id: 'fdfck', nameZh: '复旦大学附属妇产科医院', nameEn: 'Obstetrics & Gynecology Hospital of Fudan University', province: '上海市', city: '上海', coord: [121.4831, 31.2304] },
  // ---- 吉林 ----
  { id: 'jlu2', nameZh: '吉林大学第二医院', nameEn: 'The Second Hospital of Jilin University', province: '吉林省', city: '长春', coord: [125.3245, 43.8868] },
  // ---- 江苏 ----
  { id: 'njfy', nameZh: '南京市妇幼保健院', nameEn: 'Nanjing Maternity and Child Health Care Hospital', province: '江苏省', city: '南京', coord: [118.7843, 32.0519] },
  { id: 'suda2', nameZh: '苏州大学附属第二医院', nameEn: 'The Second Affiliated Hospital of Soochow University', province: '江苏省', city: '苏州', coord: [120.5941, 31.3115] },
  // ---- 内蒙古 ----
  { id: 'nmgyy', nameZh: '内蒙古自治区人民医院', nameEn: 'Inner Mongolia Autonomous Region People\'s Hospital', province: '内蒙古自治区', city: '呼和浩特', coord: [111.7492, 40.8426] },
  // ---- 陕西 ----
  { id: 'sxrm', nameZh: '陕西省人民医院', nameEn: 'Shaanxi Provincial People\'s Hospital', province: '陕西省', city: '西安', coord: [108.9579, 34.2463] },
  // ---- 广东 ----
  { id: 'szlh', nameZh: '深圳市罗湖区人民医院', nameEn: 'Shenzhen Luohu People\'s Hospital', province: '广东省', city: '深圳', coord: [114.1289, 22.5484] },
  // ---- 湖南 ----
  { id: 'xy3', nameZh: '中南大学湘雅三医院', nameEn: 'The Third Xiangya Hospital of Central South University', province: '湖南省', city: '长沙', coord: [112.9368, 28.2234] },
  { id: 'xy2', nameZh: '中南大学湘雅二医院', nameEn: 'The Second Xiangya Hospital of Central South University', province: '湖南省', city: '长沙', coord: [112.9866, 28.1938] },
  // ---- 甘肃 ----
  { id: 'gsfy', nameZh: '甘肃省妇幼保健院', nameEn: 'Gansu Provincial Maternity and Child-care Hospital', province: '甘肃省', city: '兰州', coord: [103.8299, 36.0603] },
  // ---- 海南 ----
  { id: 'hainan', nameZh: '海南省人民医院', nameEn: 'Hainan General Hospital (Hainan Affiliated Hospital of Hainan Medical University)', province: '海南省', city: '海口', coord: [110.3308, 20.0222] },
  // ---- 香港特别行政区 ----
  { id: 'cuhk', nameZh: '香港中文大学', nameEn: 'The Chinese University of Hong Kong', province: '香港特别行政区', city: '香港', coord: [114.2068, 22.4196] },
  // ---- 海外（不在地图上标注） ----
  { id: 'idibell', nameZh: 'IDIBELL 研究所', nameEn: 'IDIBELL (Bellvitge Biomedical Research Institute)', province: '', city: '巴塞罗那', coord: [2.1112, 41.3424], overseas: true },
]

/** 有地图标注的医院（排除海外） */
export const CISENDO_HOSPITALS_MAPPED = CISENDO_HOSPITALS.filter((h) => !h.overseas)

/** 涉及省份（用于省份高亮） */
export const CISENDO_PROVINCES = Array.from(new Set(CISENDO_HOSPITALS_MAPPED.map((h) => h.province)))
