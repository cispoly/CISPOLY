from playwright.sync_api import sync_playwright
import pathlib, sys
poster = sys.argv[1]
url = pathlib.Path(poster).resolve().as_uri() + '?lang=zh'
with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page()
    pg.set_viewport_size({'width':1920,'height':1080})
    pg.goto(url, wait_until='networkidle'); pg.wait_for_timeout(500)
    r = pg.evaluate("""() => {
      const h1 = document.querySelector('h1').innerText;
      const panels = Array.from(document.querySelectorAll('.panel h3')).map(h => h.innerText);
      const imgs = Array.from(document.querySelectorAll('img')).map(i => [i.naturalWidth, i.naturalHeight]);
      const lis = document.querySelectorAll('.panel ul li').length;
      return {h1, panels, imgs, lis, lang: document.body.className};
    }""")
    print('H1:', r['h1'])
    print('Panels:', r['panels'])
    print('Lis:', r['lis'], '| Imgs:', r['imgs'], '| lang:', r['lang'])
    b.close()
