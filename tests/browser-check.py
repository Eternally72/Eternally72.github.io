"""Browser checks. Requires Playwright and its Chromium browser; no production dependency."""
import argparse
import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--screenshots', type=Path)
args = parser.parse_args()

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

handler = functools.partial(QuietHandler, directory=str(ROOT))
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/'

try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1)
        context.add_init_script("""window.__cls = 0; window.__longTasks = [];
            new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({type:'layout-shift', buffered:true});
            new PerformanceObserver(list => { for (const e of list.getEntries()) window.__longTasks.push(e.duration); }).observe({type:'longtask', buffered:true});""")
        page = context.new_page()
        errors = []
        failed = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: failed.append(response.url) if response.status >= 400 else None)
        page.goto(url)
        page.evaluate('document.fonts.ready')
        page.wait_for_timeout(1100)
        assert page.locator('h1').is_visible()
        assert page.evaluate("document.fonts.check('600 16px \"Bai Sans\"')")
        metrics = page.evaluate("""({cls: window.__cls, longTasks: window.__longTasks,
            requests: performance.getEntriesByType('resource').length,
            transferredBytes: performance.getEntriesByType('resource').reduce((n,e)=>n+e.transferSize,0)})""")
        for width in [320, 360, 390, 620, 768, 820, 1024, 1440, 1920]:
            page.set_viewport_size({'width': width, 'height': 1000})
            page.wait_for_timeout(100)
            overflow = page.evaluate('document.documentElement.scrollWidth > innerWidth')
            assert not overflow, f'Horizontal overflow at {width}px'
        page.set_viewport_size({'width': 390, 'height': 844})
        menu = page.locator('.menu-toggle')
        assert menu.is_visible()
        assert not page.locator('#nav-links').is_visible()
        menu.click()
        assert menu.get_attribute('aria-expanded') == 'true'
        assert page.locator('#nav-links').is_visible()
        page.keyboard.press('Escape')
        assert menu.get_attribute('aria-expanded') == 'false'
        assert menu.evaluate('(el) => document.activeElement === el')
        menu.click()
        page.locator('#nav-links a[href="#about"]').click()
        page.wait_for_function("location.hash === '#about' && document.querySelector('#about').getBoundingClientRect().top >= -1 && document.querySelector('#about').getBoundingClientRect().top <= 100")
        assert page.url.endswith('#about')
        assert not page.locator('#nav-links').is_visible()
        assert -1 <= page.locator('#about').bounding_box()['y'] <= 100
        menu.click()
        page.locator('#about h2').click()
        assert menu.get_attribute('aria-expanded') == 'false'
        page.set_viewport_size({'width': 1440, 'height': 1000})
        assert page.locator('#nav-links').is_visible()
        context.grant_permissions(['clipboard-read', 'clipboard-write'])
        page.locator('.copy-email').click()
        assert page.evaluate('navigator.clipboard.readText()') == '23281295@bjtu.edu.cn'
        assert '已复制' in page.locator('.copy-status').inner_text()
        page.evaluate("() => { navigator.clipboard.writeText = () => Promise.reject(new Error('denied')); }")
        page.locator('.copy-email').click()
        assert '复制未成功' in page.locator('.copy-status').inner_text()
        page.emulate_media(reduced_motion='reduce')
        assert page.locator('html').evaluate("el => getComputedStyle(el).scrollBehavior") == 'auto'
        assert page.locator('.hero-copy').evaluate("el => getComputedStyle(el).animationName") == 'none'
        page.emulate_media(reduced_motion='no-preference')
        page.goto(url)
        page.evaluate('document.fonts.ready')
        page.wait_for_timeout(1200)
        if args.screenshots:
            args.screenshots.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(args.screenshots / 'desktop.png'), full_page=True)
            page.screenshot(path=str(args.screenshots / 'desktop-hero.png'))
            page.set_viewport_size({'width': 390, 'height': 844})
            page.screenshot(path=str(args.screenshots / 'mobile.png'), full_page=True)
            page.screenshot(path=str(args.screenshots / 'mobile-hero.png'))
        nojs = browser.new_context(java_script_enabled=False, viewport={'width':390,'height':844})
        fallback = nojs.new_page()
        fallback.goto(url)
        assert fallback.locator('#nav-links').is_visible(), 'Navigation unavailable without JS'
        assert fallback.locator('h1').is_visible()
        assert fallback.locator('#work h3').count() == 2
        assert not fallback.locator('.copy-email').is_visible()
        assert not fallback.evaluate('document.documentElement.scrollWidth > innerWidth')
        assert not errors, errors
        assert not failed, failed
        print(json.dumps({'result':'passed', 'viewport_widths':[320,360,390,620,768,820,1024,1440,1920], 'metrics':metrics}, ensure_ascii=False))
        browser.close()
finally:
    server.shutdown()
    server.server_close()
