from playwright.sync_api import sync_playwright
import sys
url = sys.argv[1]
with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page()
    pg.set_viewport_size({'width':1280,'height':900})
    pg.goto(url, wait_until='networkidle')
    pg.wait_for_timeout(3000)
    r = pg.evaluate("""() => {
      const iframe = document.querySelector('iframe');
      let posterOk = false;
      try { posterOk = iframe && iframe.contentDocument && !!iframe.contentDocument.querySelector('.poster'); } catch(e) {}
      return {
        title: document.querySelector('h1') ? document.querySelector('h1').innerText.slice(0,60) : null,
        hasAbs: document.body.innerText.includes('\u6458\u8981'),
        hasCite: document.body.innerText.includes('\u5f15\u7528\u683c\u5f0f'),
        hasPrevNext: document.body.innerText.includes('\u4e0a\u4e00\u7bc7') || document.body.innerText.includes('\u4e0b\u4e00\u7bc7'),
        posterIframe: !!iframe,
        posterLoaded: posterOk,
        iframeSrc: iframe ? iframe.getAttribute('src').slice(0,60) : null,
      };
    }""")
    print(r)
    b.close()
