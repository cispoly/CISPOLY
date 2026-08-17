// CISOVA 多中心验证合作医院数据（已去重，含省份/城市坐标）
// 复用 CISCER 的 china-hospitals.ts 中的 HospitalSite 接口

import type { HospitalSite } from './china-hospitals'

export const CISOVA_HOSPITALS: HospitalSite[] = [
  // ---- 牵头单位 ----
  { id: 'pumch', nameZh: '北京协和医院', nameEn: 'Peking Union Medical College Hospital', province: '北京市', city: '北京', coord: [116.4074, 39.9042], lead: true },
  // ---- 北京 ----
  { id: 'bj6', nameZh: '北京第六医院', nameEn: 'Beijing Sixth Hospital', province: '北京市', city: '北京', coord: [116.4177, 39.9288] },
  { id: 'bjcyl', nameZh: '北京垂杨柳医院', nameEn: 'Beijing Chuilyangliu Hospital', province: '北京市', city: '北京', coord: [116.4592, 39.8934] },
  // ---- 山东 ----
  { id: 'sdu2', nameZh: '山东大学第二医院', nameEn: 'The Second Hospital of Shandong University', province: '山东省', city: '济南', coord: [117.0513, 36.6732] },
  { id: 'qdu', nameZh: '青岛大学附属医院', nameEn: 'The Affiliated Hospital of Qingdao University', province: '山东省', city: '青岛', coord: [120.4014, 36.1002] },
  // ---- 河南 ----
  { id: 'zzu1', nameZh: '郑州大学第一附属医院', nameEn: 'The First Affiliated Hospital of Zhengzhou University', province: '河南省', city: '郑州', coord: [113.6507, 34.7539] },
  // ---- 河北 ----
  { id: 'hebm1', nameZh: '河北医科大学第一医院', nameEn: 'The First Hospital of Hebei Medical University', province: '河北省', city: '石家庄', coord: [114.5108, 38.0428] },
  { id: 'cangzhou', nameZh: '沧州市中心医院', nameEn: 'Cangzhou Central Hospital', province: '河北省', city: '沧州', coord: [116.8388, 38.3045] },
  // ---- 甘肃 ----
  { id: 'gsfy', nameZh: '甘肃省妇幼保健院', nameEn: 'Gansu Provincial Maternity and Child-care Hospital', province: '甘肃省', city: '兰州', coord: [103.8299, 36.0603] },
  // ---- 内蒙古 ----
  { id: 'nmgyy', nameZh: '内蒙古自治区人民医院', nameEn: 'Inner Mongolia Autonomous Region People\'s Hospital', province: '内蒙古自治区', city: '呼和浩特', coord: [111.7492, 40.8426] },
  { id: 'btmc2', nameZh: '包头医学院第二附属医院', nameEn: 'The Second Affiliated Hospital of Baotou Medical College', province: '内蒙古自治区', city: '包头', coord: [109.8783, 40.6571] },
  // ---- 新疆 ----
  { id: 'xjmuh', nameZh: '新疆医科大学附属肿瘤医院', nameEn: 'Cancer Hospital of Xinjiang Medical University', province: '新疆维吾尔自治区', city: '乌鲁木齐', coord: [87.5834, 43.8225] },
  // ---- 山西 ----
  { id: 'sxbqe', nameZh: '山西白求恩医院', nameEn: 'Shanxi Bethune Hospital', province: '山西省', city: '太原', coord: [112.5338, 37.7973] },
  // ---- 吉林 ----
  { id: 'jlu2', nameZh: '吉林大学第二医院', nameEn: 'The Second Hospital of Jilin University', province: '吉林省', city: '长春', coord: [125.3245, 43.8868] },
  // ---- 重庆 ----
  { id: 'cqmu2', nameZh: '重庆医科大学附属第二医院', nameEn: 'The Second Affiliated Hospital of Chongqing Medical University', province: '重庆市', city: '重庆', coord: [106.5571, 29.5404] },
  { id: 'cqcancer', nameZh: '重庆大学附属肿瘤医院', nameEn: 'Chongqing University Cancer Hospital', province: '重庆市', city: '重庆', coord: [106.5407, 29.5547] },
  // ---- 四川 ----
  { id: 'cdfec', nameZh: '成都市妇女儿童中心医院', nameEn: 'Chengdu Women\'s and Children\'s Central Hospital', province: '四川省', city: '成都', coord: [104.0665, 30.6597] },
  // ---- 江西 ----
  { id: 'gnmc1', nameZh: '赣南医学院第一附属医院', nameEn: 'The First Affiliated Hospital of Gannan Medical University', province: '江西省', city: '赣州', coord: [114.9325, 25.8497] },
  // ---- 广东 ----
  { id: 'pkuszh', nameZh: '北京大学深圳医院', nameEn: 'Peking University Shenzhen Hospital', province: '广东省', city: '深圳', coord: [114.0585, 22.5533] },
  // ---- 江苏 ----
  { id: 'jscancer', nameZh: '江苏省肿瘤医院', nameEn: 'Jiangsu Cancer Hospital', province: '江苏省', city: '南京', coord: [118.8374, 32.0301] },
  { id: 'jspph', nameZh: '江苏省人民医院', nameEn: 'Jiangsu Provincial People\'s Hospital', province: '江苏省', city: '南京', coord: [118.7485, 32.0516] },
  // ---- 上海 ----
  { id: 'ipmch', nameZh: '上海市国际和平妇幼保健院', nameEn: 'International Peace Maternity and Child Health Hospital', province: '上海市', city: '上海', coord: [121.4435, 31.1965] },
]

/** 有地图标注的医院（排除海外） */
export const CISOVA_HOSPITALS_MAPPED = CISOVA_HOSPITALS.filter((h) => !h.overseas)

/** 涉及省份（用于省份高亮） */
export const CISOVA_PROVINCES = Array.from(new Set(CISOVA_HOSPITALS_MAPPED.map((h) => h.province)))
