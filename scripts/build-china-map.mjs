// 生成中国地图 SVG path 数据（主图 + 南海诸岛 inset + 九段线）
// 用法: node scripts/build-china-map.mjs
// 输入: china_geo_tmp.json (DataV 100000_full), nine_dash_tmp.json (ArcGIS Nine Dash Line)
// 输出: src/data/china-map.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const geo = JSON.parse(readFileSync(join(root, 'china_geo_tmp.json'), 'utf-8'))
const nineDash = JSON.parse(readFileSync(join(root, 'nine_dash_tmp.json'), 'utf-8'))

// ---- 投影参数（等距柱状，保留纵横比）----
// 主图区域（含大陆、台湾、海南）
const MAIN = { lonMin: 73.2, lonMax: 134.8, latMin: 16.5, latMax: 54.2, width: 860, height: 640 }
// 南海 inset（九段线 + 南海诸岛）—— 紧凑比例，右下角小图
const INSET = { lonMin: 106, lonMax: 124.5, latMin: 3, latMax: 24.5, width: 128, height: 142 }

function project(lon, lat, region) {
  const x = ((lon - region.lonMin) / (region.lonMax - region.lonMin)) * region.width
  const y = ((region.latMax - lat) / (region.latMax - region.latMin)) * region.height
  return [x, y]
}

// ring -> SVG path 片段
function ringToPath(ring, region) {
  let d = ''
  ring.forEach((c, i) => {
    const [x, y] = project(c[0], c[1], region)
    d += (i === 0 ? `M${x.toFixed(1)} ${y.toFixed(1)}` : `L${x.toFixed(1)} ${y.toFixed(1)}`)
  })
  return d + 'Z'
}

// 多边形(含洞) -> path d
function polygonToD(polygon, region) {
  // polygon[0] 外环，其余为洞
  return polygon.map((ring) => ringToPath(ring, region)).join(' ')
}

// MultiPolygon -> d（用 evenodd 填充规则处理洞）
function multiPolygonToD(multi, region) {
  return multi.map((polygon) => polygonToD(polygon, region)).join(' ')
}

function isInMain(feature) {
  // 台湾、海南在纬度范围内；南海诸岛(100000_JD)放 inset
  if (feature.properties.adcode === '100000_JD' || feature.properties.name === '') return false
  return true
}

const provinces = []
const southSea = []

geo.features.forEach((f) => {
  const name = f.properties.name || '南海诸岛'
  // 兼容 Polygon / MultiPolygon 两种类型（内蒙古等个别省份是 Polygon）
  const coords = f.geometry.coordinates
  const d =
    f.geometry.type === 'MultiPolygon'
      ? multiPolygonToD(coords, isInMain(f) ? MAIN : INSET)
      : polygonToD(coords, isInMain(f) ? MAIN : INSET)
  const item = { name, adcode: String(f.properties.adcode), d }
  if (isInMain(f)) provinces.push(item)
  else southSea.push(item)
})

// 九段线（MultiLineString 或 LineString）
const nineDashLines = []
nineDash.features.forEach((f) => {
  const coords = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates]
  coords.forEach((line) => {
    let d = ''
    line.forEach((c, i) => {
      const [x, y] = project(c[0], c[1], INSET)
      d += (i === 0 ? `M${x.toFixed(1)} ${y.toFixed(1)}` : `L${x.toFixed(1)} ${y.toFixed(1)}`)
    })
    if (d) nineDashLines.push(d)
  })
})

const out = {
  main: { ...MAIN },
  inset: { ...INSET },
  provinces,
  southSea,
  nineDashLines,
  meta: {
    provinceCount: provinces.length,
    southSeaCount: southSea.length,
    nineDashSegments: nineDashLines.length,
  },
}

const outDir = join(root, 'src', 'data')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'china-map.json'), JSON.stringify(out))
console.log('生成完成:', out.meta, '总大小:', (Buffer.byteLength(JSON.stringify(out)) / 1024).toFixed(1), 'KB')
