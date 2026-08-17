import { useMemo, useState } from 'react'
import { Building2, MapPin, Globe2 } from 'lucide-react'
import chinaMap from '@/data/china-map.json'
import {
  PROVINCE_EN,
  CITY_EN,
  type HospitalSite,
} from '@/data/china-hospitals'
import { useI18n } from '@/lib/i18n'

interface ChinaHospitalMapProps {
  /** 医院列表（已去重） */
  hospitals: HospitalSite[]
}

interface Region {
  lonMin: number
  lonMax: number
  latMin: number
  latMax: number
  width: number
  height: number
}

/** 经纬度 → SVG 坐标（与 scripts/build-china-map.mjs 相同的等距柱状投影） */
function project(lon: number, lat: number, region: Region): [number, number] {
  const x = ((lon - region.lonMin) / (region.lonMax - region.lonMin)) * region.width
  const y = ((region.latMax - lat) / (region.latMax - region.latMin)) * region.height
  return [x, y]
}

const MAIN: Region = chinaMap.main
const INSET: Region = chinaMap.inset

/** 按省份分组医院（保持原始顺序） */
function groupByProvince(hospitals: HospitalSite[]) {
  const groups: { province: string; hospitals: HospitalSite[] }[] = []
  for (const h of hospitals) {
    const existing = groups.find((g) => g.province === h.province)
    if (existing) existing.hospitals.push(h)
    else groups.push({ province: h.province, hospitals: [h] })
  }
  return groups
}

export default function ChinaHospitalMap({ hospitals }: ChinaHospitalMapProps) {
  const { lang } = useI18n()
  const [hovered, setHovered] = useState<string | null>(null)

  const mappedHospitals = useMemo(() => hospitals.filter((h) => !h.overseas), [hospitals])
  const overseasHospitals = useMemo(() => hospitals.filter((h) => h.overseas), [hospitals])
  const provinceGroups = useMemo(() => groupByProvince(mappedHospitals), [mappedHospitals])
  const totalCount = hospitals.length
  const mappedCount = mappedHospitals.length
  const overseasCount = overseasHospitals.length

  const highlighted = useMemo(
    () => new Set(mappedHospitals.map((h) => h.province)),
    [mappedHospitals],
  )

  // 主图视口大小（比例由数据决定）
  const mainW = MAIN.width
  const mainH = MAIN.height

  // 医院标注点（主图坐标系）
  const markerPoints = useMemo(
    () =>
      mappedHospitals.map((h) => {
        const [x, y] = project(h.coord[0], h.coord[1], MAIN)
        return { ...h, x, y }
      }),
    [mappedHospitals],
  )

  const isZh = lang === 'zh'
  const provinceName = (p: string) => p.replace(/省|市|壮族自治区|维吾尔自治区|回族自治区|自治区/g, '')
  const provinceLabel = (p: string) => (isZh ? provinceName(p) : PROVINCE_EN[p] || p)
  const cityLabel = (c: string) => (isZh ? c : CITY_EN[c] || c)

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
      {/* ===== 左侧：地图 ===== */}
      <div>
        <div className="card overflow-hidden p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <MapPin size={16} className="text-brand-500" />
              {isZh ? '全国合作医院分布' : 'Nationwide Hospital Network'}
            </div>
            <div className="flex items-center gap-4 text-xs text-inkSoft">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-pink-300" />
                {isZh ? '合作省份' : 'Partner provinces'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-600" />
                </span>
                {isZh ? '合作医院' : 'Hospitals'}
              </span>
            </div>
          </div>

          <div className="mt-4 map-enter">
            <svg
              viewBox={`0 0 ${mainW} ${mainH + 14}`}
              className="mx-auto w-full"
              role="img"
              aria-label={isZh ? '中国合作医院分布地图' : 'China hospital network map'}
            >
              {/* 主图省份 */}
              <g>
                {chinaMap.provinces.map((p, i) => {
                  const active = highlighted.has(p.name)
                  return (
                    <path
                      key={p.name}
                      d={p.d}
                      fill={active ? '#F9C9DF' : '#F0EDEA'}
                      stroke={active ? '#E88B8A' : '#DDD7D1'}
                      strokeWidth={0.7}
                      className={active ? 'map-province-active' : 'transition-colors duration-300'}
                      style={active ? { animationDelay: `${(i % 7) * 0.35}s` } : undefined}
                    />
                  )
                })}
              </g>

              {/* 医院标注（红色动态圆点） */}
              <g>
                {markerPoints.map((h) => (
                  <g
                    key={h.id}
                    transform={`translate(${h.x} ${h.y})`}
                    onMouseEnter={() => setHovered(h.id)}
                    onMouseLeave={() => setHovered(null)}
                    className="cursor-pointer"
                  >
                    {/* 中心柔光 */}
                    <circle r={8} fill="#D74B4A" opacity={0.14} />
                    {/* 动态扩散环 1（近） */}
                    <circle r={9} fill="none" stroke="#D74B4A" strokeWidth={1.2} opacity={0.5} className="map-pulse-ring" />
                    {/* 动态扩散环 2（远、淡） */}
                    <circle r={9} fill="none" stroke="#D74B4A" strokeWidth={0.9} opacity={0.3} className="map-pulse-ring map-pulse-ring--slow" />
                    {/* 中心圆点（牵头更大、呼吸） */}
                    <circle
                      r={h.lead ? 5.4 : 4.2}
                      fill={h.lead ? '#C24140' : '#D74B4A'}
                      stroke="#fff"
                      strokeWidth={h.lead ? 1.6 : 1.2}
                      className={h.lead ? 'map-dot-core' : undefined}
                    />
                    {/* hover 标签（foreignObject 自动适配文字宽度，相对父 g 定位） */}
                    {hovered === h.id && (
                      <foreignObject
                        x={-150}
                        y={-52}
                        width={300}
                        height={40}
                        style={{ pointerEvents: 'none' }}
                      >
                        <div className="flex h-full w-full items-center justify-center">
                          <span
                            className="rounded-lg bg-[#2A2422]/95 px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
                            style={{ maxWidth: 280, lineHeight: 1.35, textAlign: 'center' }}
                          >
                            {isZh ? h.nameZh : h.nameEn}
                          </span>
                        </div>
                      </foreignObject>
                    )}
                  </g>
                ))}
              </g>

              {/* 南海诸岛小图（右下角） */}
              <g transform={`translate(${mainW - INSET.width - 14}, ${mainH - INSET.height + 4})`}>
                <rect
                  x={-7}
                  y={-7}
                  width={INSET.width + 14}
                  height={INSET.height + 14}
                  fill="#fff"
                  stroke="#DDD7D1"
                  strokeWidth={1}
                  rx={4}
                />
                {chinaMap.southSea.map((p) => (
                  <path key={p.name} d={p.d} fill="#F0EDEA" stroke="#DDD7D1" strokeWidth={0.6} />
                ))}
                {chinaMap.nineDashLines.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="#8A8A93"
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                    className="map-nine-line"
                    style={{ animationDuration: `${3 + i * 0.3}s`, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
                <text
                  x={INSET.width / 2}
                  y={INSET.height + 2}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#6B635E"
                >
                  {isZh ? '南海诸岛' : 'South China Sea'}
                </text>
              </g>
            </svg>
          </div>

          {/* 图例统计 */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-inkSoft">
            <span>
              {isZh
                ? `覆盖 ${highlighted.size} 个省级行政区 · ${mappedCount} 家合作医院`
                : `${highlighted.size} provinces · ${mappedCount} hospitals`}
            </span>
            {overseasCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Globe2 size={13} className="text-brand-400" />
                {isZh
                  ? `另有 ${overseasCount} 家海外合作单位`
                  : `+ ${overseasCount} overseas partner`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ===== 右侧：可滚动医院列表 ===== */}
      <div>
        <div className="card flex h-full flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Building2 size={16} className="text-brand-500" />
              {isZh ? '合作医院名录' : 'Partner Hospitals'}
            </div>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-600">
              {totalCount}
            </span>
          </div>

          <div className="scroll-smooth overflow-y-auto p-4 md:p-5" style={{ maxHeight: 560 }}>
            {provinceGroups.map((group) => (
              <div key={group.province} className="mb-5 last:mb-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-md bg-pink-100 px-2 py-0.5 text-xs font-bold text-pink-600">
                    {provinceLabel(group.province)}
                  </span>
                  <span className="h-px flex-1 bg-line" />
                  <span className="text-[11px] font-medium text-inkSoft">
                    {group.hospitals.length}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {group.hospitals.map((h) => (
                    <li
                      key={h.id}
                      className="group flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-brand-50/60"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-medium leading-snug text-ink">
                          {isZh ? h.nameZh : h.nameEn}
                          {h.lead && (
                            <span className="ml-1.5 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white align-middle">
                              {isZh ? '牵头' : 'LEAD'}
                            </span>
                          )}
                        </div>
                        <div className="text-[11.5px] text-inkSoft">
                          {provinceName(group.province) === h.city ? (
                            cityLabel(h.city)
                          ) : (
                            <>
                              {provinceLabel(group.province)}
                              <span className="mx-1">·</span>
                              {cityLabel(h.city)}
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {overseasCount > 0 && (
              <div className="mb-2 mt-6 rounded-lg border border-dashed border-brand-200 bg-brand-50/40 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-600">
                  <Globe2 size={14} />
                  {isZh ? '海外合作单位' : 'Overseas Partners'}
                </div>
                {overseasHospitals.map((h) => (
                  <div key={h.id} className="mt-2 text-[13px] font-medium text-ink">
                    {isZh ? h.nameZh : h.nameEn}
                    <span className="ml-2 text-[11.5px] font-normal text-inkSoft">
                      {cityLabel(h.city)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
