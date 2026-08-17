from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page()
    pg.set_viewport_size({'width':1280,'height':900})
    pg.goto('http://127.0.0.1:5173/papers/cervical/1_Li_et_al_2024_PAX1-JAM3_Methylation_and_HPV_Viral_Load_in_Women_with_Persistent_HPV_Infection', wait_until='networkidle')
    pg.wait_for_timeout(3000)
    r = pg.evaluate("""() => {
      const prevNext = Array.from(document.querySelectorAll('a')).filter(a => (a.getAttribute('href')||'').includes('/papers/cervical/') && (a.innerText||'').includes('\u7bc7'));
      return {
        pageHeight: document.documentElement.scrollHeight,
        viewport: innerHeight,
        prevNextCount: prevNext.length,
        prevNextTexts: prevNext.map(a => (a.innerText||'').slice(0,90)),
        posterIframeOk: !!document.querySelector('iframe'),
      };
    }""")
    print(r)
    pg.evaluate('window.scrollTo(0, document.documentElement.scrollHeight)')
    pg.wait_for_timeout(800)
    pg.screenshot(path='test/_detail_page_bottom.png')
    b.close()
print('done')
