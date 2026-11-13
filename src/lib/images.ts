// 各页面首视图用的背景图片（已压缩，存放于 public/hero/）
export const PAGE_HERO_IMAGES = {
  products: '/hero/becca-tapert-u5e1kqW6E3M.jpg',
  ciscer: '/hero/becca-tapert-u5e1kqW6E3M.jpg',
  cisendo: '/hero/becca-tapert-eAfrl7A6gBs.jpg',
  cisova: '/hero/isaac-iverson-lvYf2D6R4Nk.jpg',
  papers: '/hero/artem-beliaikin-X42pLx6b5TU.jpg',
  guidelines: '/hero/fausto-garcia-menendez-zXNywOKuCoI.jpg',
  blog: '/hero/freestocks-urfVdTSFKfo.jpg',
  about: '/hero/anita-austvika-XQbCwyHjp6s.jpg',
  contact: '/hero/anita-austvika-XQbCwyHjp6s.jpg',
} as const

/**
 * hero 背景图统一走 WebP 双档（960 / 1920），比原 JPEG 小 3-5 倍。
 * 源文件仍保留 .jpg 作为兜底，文件名约定：<name>-1920.webp / <name>-960.webp。
 */
export function heroImage(src: string) {
  const stem = src.replace(/\.(jpe?g|png)$/i, '')
  return {
    src: `${stem}-1920.webp`,
    srcSet: `${stem}-960.webp 960w, ${stem}-1920.webp 1920w`,
    sizes: '100vw',
  }
}
