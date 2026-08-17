import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * 路由切换时回到顶部（除非是带 hash 的锚点）。
 * 用双重方式确保回顶：history.scrollRestoration 关闭浏览器默认恢复 + 显式滚动。
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // 关闭浏览器默认的滚动位置恢复，避免从深层滚动位置进入新页面
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    if (hash) {
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname, hash])

  return null
}
