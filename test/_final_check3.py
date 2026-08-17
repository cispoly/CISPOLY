from playwright.sync_api import sync_playwright
import json, os, urllib.parse

papers = json.load(open('src/data/papers.json', encoding='utf-8'))
guides = json.load(open('src/data/guidelines.json', encoding='utf-8'))
BASE = 'http://127.0.0.1:5173'

# 用 encodeURIComponent 方式验证所有 poster HTML 可访问（通过 iframe 加载）
with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page()
    ok = 0; fail = 0
    for c in ('cervical','endometrial','ovarian'):
        for root, dirs, files in os.walk(f'public/posters/{c}'):
            if 'poster.html' not in files: continue
            rel = root.replace('public','').replace(os.sep, '/')
            # 模拟 React 页面的 encodeURIComponent 路径
            parts = rel.split('/')
            id_part = urllib.parse.quote(parts[-1])
            url = f'{BASE}/posters/{c}/{id_part}/poster.html'
            try:
                pg.goto(url, wait_until='load', timeout=8000)
                pg.wait_for_timeout(500)
                has_poster = pg.evaluate("() => !!document.querySelector('.poster')")
                if has_poster: ok += 1
                else: fail += 1; print('  FAIL (no .poster):', parts[-1][:40])
            except Exception as e:
                fail += 1; print('  ERR:', parts[-1][:40], str(e)[:60])
    print(f'poster.html via encoded URL: {ok} OK, {fail} FAIL')
    b.close()
