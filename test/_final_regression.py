from playwright.sync_api import sync_playwright
import json, urllib.parse

papers = json.load(open('src/data/papers.json', encoding='utf-8'))
guides = json.load(open('src/data/guidelines.json', encoding='utf-8'))

# 选代表页面
def pick(items, cancer, frag):
    for it in items:
        if it['cancer'] == cancer and frag in it['id']:
            return it
    return items[0]

checks = [
    ('paper-cervical', papers, 'cervical', '1_Li'),
    ('paper-endometrial', papers, 'endometrial', '9_Xiuzhen'),
    ('paper-ovarian', papers, 'ovarian', '侯倩男'),
    ('guide-cervical', guides, 'cervical', '9_单行本'),
    ('guide-endometrial', guides, 'endometrial', '中华医学会'),
]
BASE = 'http://127.0.0.1:5173'
with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page()
    pg.set_viewport_size({'width':1280,'height':900})
    results = []
    for label, items, cancer, frag in checks:
        it = pick(items, cancer, frag)
        path = f'/papers/{cancer}/{it["id"]}' if label.startswith('paper') else f'/guidelines/{cancer}/{it["id"]}'
        pg.goto(BASE + path, wait_until='networkidle')
        pg.wait_for_timeout(3000)
        r = pg.evaluate("""() => {
          const iframe = document.querySelector('iframe');
          let posterOk = false;
          try { posterOk = iframe && iframe.contentDocument && !!iframe.contentDocument.querySelector('.poster'); } catch(e) {}
          const h1 = document.querySelector('h1');
          return { posterLoaded: posterOk, hasCite: document.body.innerText.includes('引用格式'), hasPrevNext: document.body.innerText.includes('下一篇') || document.body.innerText.includes('上一篇'), h1: h1 ? h1.innerText.slice(0,40) : null };
        }""")
        results.append((label, r))
        print(f"[{label}] poster={'OK' if r['posterLoaded'] else 'FAIL'} cite={'OK' if r['hasCite'] else 'FAIL'} prevnext={'OK' if r['hasPrevNext'] else 'FAIL'} | {r['h1']}")
    b.close()
print('\nALL DONE')
