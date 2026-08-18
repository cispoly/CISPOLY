from playwright.sync_api import sync_playwright
import json

papers = json.load(open('src/data/papers.json', encoding='utf-8'))
guides = json.load(open('src/data/guidelines.json', encoding='utf-8'))
BASE = 'http://127.0.0.1:5173'

# 验证所有 poster 的 HTML 可访问（HTTP 200）
import urllib.request
ok = 0; fail = 0
for c in ('cervical','endometrial','ovarian'):
    for root, dirs, files in __import__('os').walk(f'public/posters/{c}'):
        if 'poster.html' in files:
            url = BASE + root.replace('public', '') + '/poster.html'
            try:
                r = urllib.request.urlopen(url, timeout=5)
                if r.status == 200: ok += 1
                else: fail += 1; print('  FAIL', url)
            except Exception as e:
                fail += 1; print('  ERR', url, e)
print(f'poster.html accessible: {ok} OK, {fail} FAIL')

# 指南 ovarian 页面验证
for g in guides:
    if g['cancer'] == 'ovarian':
        pg_url = f'{BASE}/guidelines/ovarian/{g["id"]}'
        with sync_playwright() as pw:
            b = pw.chromium.launch(); pg = b.new_page()
            pg.set_viewport_size({'width':1280,'height':900})
            pg.goto(pg_url, wait_until='networkidle'); pg.wait_for_timeout(3000)
            r = pg.evaluate("""() => {
              const iframe = document.querySelector('iframe');
              let ok = false;
              try { ok = iframe && iframe.contentDocument && !!iframe.contentDocument.querySelector('.poster'); } catch(e) {}
              return ok;
            }""")
            print(f'guide-ovarian poster: {"OK" if r else "FAIL"}')
            b.close()
