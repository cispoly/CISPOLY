// CISCER 多中心验证合作医院数据（已去重，含省份/城市坐标）
// 坐标用于在中国地图上标注（经度, 纬度）

export interface HospitalSite {
  id: string
  /** 中文名称 */
  nameZh: string
  /** 英文名称 */
  nameEn: string
  /** 省份全称（必须与 china-map.json 的 province.name 一致） */
  province: string
  /** 城市名（中文） */
  city: string
  /** 经纬度 [lng, lat] */
  coord: [number, number]
  /** 是否牵头单位 */
  lead?: boolean
  /** 是否海外（不在地图上标注） */
  overseas?: boolean
}

export const CISCER_HOSPITALS: HospitalSite[] = [
  // ---- 牵头单位 ----
  { id: 'pumch', nameZh: '北京协和医院', nameEn: 'Peking Union Medical College Hospital', province: '北京市', city: '北京', coord: [116.4074, 39.9042], lead: true },
  // ---- 北京 ----
  { id: 'pkupop', nameZh: '北京大学人民医院', nameEn: 'Peking University People\'s Hospital', province: '北京市', city: '北京', coord: [116.3551, 39.9367] },
  { id: 'bjfcyy', nameZh: '首都医科大学附属北京妇产医院', nameEn: 'Beijing Obstetrics and Gynecology Hospital, Capital Medical University', province: '北京市', city: '北京', coord: [116.4344, 39.9142] },
  { id: 'anzhen', nameZh: '北京安贞医院', nameEn: 'Beijing Anzhen Hospital', province: '北京市', city: '北京', coord: [116.4086, 39.9793] },
  // ---- 山东 ----
  { id: 'qilu', nameZh: '山东大学齐鲁医院', nameEn: 'Qilu Hospital, Shandong University', province: '山东省', city: '济南', coord: [117.0167, 36.6644] },
  { id: 'linyi', nameZh: '临沂市中心医院', nameEn: 'Linyi Central Hospital', province: '山东省', city: '临沂', coord: [118.3564, 35.1046] },
  { id: 'sdfmu', nameZh: '山东第一医科大学（山东省医学科学院）', nameEn: 'Shandong First Medical University', province: '山东省', city: '济南', coord: [117.0472, 36.6525] },
  // ---- 浙江 ----
  { id: 'zju2', nameZh: '浙江大学医学院附属第二医院', nameEn: 'The Second Affiliated Hospital of Zhejiang University School of Medicine', province: '浙江省', city: '杭州', coord: [120.1701, 30.2564] },
  { id: 'zjpph', nameZh: '浙江省人民医院', nameEn: 'Zhejiang Provincial People\'s Hospital', province: '浙江省', city: '杭州', coord: [120.1777, 30.2638] },
  // ---- 湖北 ----
  { id: 'tongji', nameZh: '华中科技大学同济医学院附属同济医院', nameEn: 'Tongji Hospital, Tongji Medical College, HUST', province: '湖北省', city: '武汉', coord: [114.2628, 30.5837] },
  // ---- 四川 ----
  { id: 'hx2', nameZh: '四川大学华西第二医院', nameEn: 'West China Second University Hospital, Sichuan University', province: '四川省', city: '成都', coord: [104.0665, 30.5723] },
  { id: 'ziyang', nameZh: '资阳市中心医院', nameEn: 'Ziyang Central Hospital', province: '四川省', city: '资阳', coord: [104.6276, 30.1286] },
  // ---- 湖南 ----
  { id: 'xy3', nameZh: '中南大学湘雅三医院', nameEn: 'The Third Xiangya Hospital of Central South University', province: '湖南省', city: '长沙', coord: [112.9368, 28.2234] },
  { id: 'hnucm1', nameZh: '湖南中医药大学第一附属医院', nameEn: 'The First Affiliated Hospital of Hunan University of Chinese Medicine', province: '湖南省', city: '长沙', coord: [112.9795, 28.2004] },
  { id: 'yueyang', nameZh: '岳阳市中心医院', nameEn: 'Yueyang Central Hospital', province: '湖南省', city: '岳阳', coord: [113.1287, 29.3571] },
  { id: 'csfey', nameZh: '长沙市妇幼保健院', nameEn: 'Changsha Maternal and Child Health Hospital', province: '湖南省', city: '长沙', coord: [112.9855, 28.1901] },
  { id: 'usc1', nameZh: '南华大学附属第一医院', nameEn: 'The First Affiliated Hospital of University of South China', province: '湖南省', city: '衡阳', coord: [112.6115, 26.8931] },
  // ---- 江苏 ----
  { id: 'xuzhou', nameZh: '徐州市妇幼保健院', nameEn: 'Xuzhou Maternity and Child Health Hospital', province: '江苏省', city: '徐州', coord: [117.2857, 34.2057] },
  // ---- 青海 ----
  { id: 'qhred', nameZh: '青海红十字医院', nameEn: 'Qinghai Red Cross Hospital', province: '青海省', city: '西宁', coord: [101.7782, 36.6171] },
  // ---- 河南 ----
  { id: 'zzu3', nameZh: '郑州大学第三附属医院', nameEn: 'The Third Affiliated Hospital of Zhengzhou University', province: '河南省', city: '郑州', coord: [113.6494, 34.7529] },
  // ---- 甘肃 ----
  { id: 'plaj940', nameZh: '联勤保障部队第九四〇医院', nameEn: '940th Hospital of The Joint Logistic Support Force of PLA', province: '甘肃省', city: '兰州', coord: [103.8233, 36.0580] },
  // ---- 新疆 ----
  { id: 'xjmuh', nameZh: '新疆医科大学附属肿瘤医院', nameEn: 'Tumor Hospital Affiliated to Xinjiang Medical University', province: '新疆维吾尔自治区', city: '乌鲁木齐', coord: [87.5834, 43.8225] },
  // ---- 云南 ----
  { id: 'kmya', nameZh: '昆明医科大学附属延安医院', nameEn: 'Yan\'an Hospital Affiliated to Kunming Medical University', province: '云南省', city: '昆明', coord: [102.7264, 25.0306] },
  // ---- 广西 ----
  { id: 'glfey', nameZh: '桂林市妇幼保健院', nameEn: 'Guilin Maternal and Child Health Hospital', province: '广西壮族自治区', city: '桂林', coord: [110.2902, 25.2736] },
  // ---- 河北 ----
  { id: 'hebm1', nameZh: '河北医科大学第一医院', nameEn: 'First Hospital of Hebei Medical University', province: '河北省', city: '石家庄', coord: [114.5108, 38.0428] },
  // ---- 海外（不在地图上标注） ----
  { id: 'imperial', nameZh: '帝国理工学院', nameEn: 'Imperial College London', province: '', city: '伦敦', coord: [-0.1786, 51.4988], overseas: true },
]

/** 有地图标注的医院（排除海外） */
export const CISCER_HOSPITALS_MAPPED = CISCER_HOSPITALS.filter((h) => !h.overseas)

/** 涉及省份（用于省份高亮） */
export const CISCER_PROVINCES = Array.from(new Set(CISCER_HOSPITALS_MAPPED.map((h) => h.province)))

/** 省份中英文映射（列表分组标题用） */
export const PROVINCE_EN: Record<string, string> = {
  北京市: 'Beijing',
  山东省: 'Shandong',
  浙江省: 'Zhejiang',
  湖北省: 'Hubei',
  四川省: 'Sichuan',
  湖南省: 'Hunan',
  江苏省: 'Jiangsu',
  青海省: 'Qinghai',
  河南省: 'Henan',
  甘肃省: 'Gansu',
  新疆维吾尔自治区: 'Xinjiang',
  云南省: 'Yunnan',
  广西壮族自治区: 'Guangxi',
  河北省: 'Hebei',
  上海市: 'Shanghai',
  吉林省: 'Jilin',
  内蒙古自治区: 'Inner Mongolia',
  陕西省: 'Shaanxi',
  广东省: 'Guangdong',
  海南省: 'Hainan',
  香港特别行政区: 'Hong Kong',
  山西省: 'Shanxi',
  重庆市: 'Chongqing',
  江西省: 'Jiangxi',
}

/** 城市中英文映射（列表副标题用） */
export const CITY_EN: Record<string, string> = {
  北京: 'Beijing',
  济南: 'Jinan',
  临沂: 'Linyi',
  杭州: 'Hangzhou',
  武汉: 'Wuhan',
  成都: 'Chengdu',
  资阳: 'Ziyang',
  长沙: 'Changsha',
  岳阳: 'Yueyang',
  衡阳: 'Hengyang',
  徐州: 'Xuzhou',
  西宁: 'Xining',
  郑州: 'Zhengzhou',
  兰州: 'Lanzhou',
  乌鲁木齐: 'Urumqi',
  昆明: 'Kunming',
  桂林: 'Guilin',
  石家庄: 'Shijiazhuang',
  伦敦: 'London',
  沧州: 'Cangzhou',
  上海: 'Shanghai',
  长春: 'Changchun',
  南京: 'Nanjing',
  苏州: 'Suzhou',
  呼和浩特: 'Hohhot',
  西安: "Xi'an",
  深圳: 'Shenzhen',
  海口: 'Haikou',
  香港: 'Hong Kong',
  巴塞罗那: 'Barcelona',
  青岛: 'Qingdao',
  包头: 'Baotou',
  太原: 'Taiyuan',
  重庆: 'Chongqing',
  赣州: 'Ganzhou',
}
