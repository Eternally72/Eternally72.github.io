"""Browser checks. Requires Playwright and its Chromium browser; no production dependency."""
import argparse
import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright, expect

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
            window.__particleDraws = 0; window.__rafCalls = 0; window.__rafCosts = [];
            const clear = CanvasRenderingContext2D.prototype.clearRect;
            CanvasRenderingContext2D.prototype.clearRect = function (...args) {
                if (this.canvas.matches('.hero-particles')) window.__particleDraws++;
                return clear.apply(this, args);
            };
            const raf = window.requestAnimationFrame;
            window.requestAnimationFrame = callback => raf.call(window, now => {
                const start = performance.now(); window.__rafCalls++;
                callback(now);
                if (window.__rafCosts.length < 300) window.__rafCosts.push(performance.now() - start);
            });
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
        assert not page.evaluate("performance.getEntriesByType('resource').some(e => /project-(details|data|diagrams)|bai-details/.test(e.name))"), 'Details loaded before interaction'
        assert page.evaluate("document.fonts.check('600 16px \"Bai Sans\"')")
        metrics = page.evaluate("""({cls: window.__cls, longTasks: window.__longTasks,
            requests: performance.getEntriesByType('resource').length,
            transferredBytes: performance.getEntriesByType('resource').reduce((n,e)=>n+e.transferSize,0)})""")
        # Decorative particles must stop scheduling frames, not merely become invisible.
        motion = page.locator('.motion-toggle')
        assert motion.is_visible()
        assert page.evaluate('window.__particleDraws') > 5
        start = page.evaluate('({draws: __particleDraws, time: performance.now()})')
        page.wait_for_timeout(1100)
        particle_metrics = page.evaluate("""start => ({
            fps: (__particleDraws - start.draws) / ((performance.now() - start.time) / 1000),
            maxFrameMs: Math.max(...__rafCosts)
        })""", start)
        assert 5 < particle_metrics['fps'] <= 31, particle_metrics

        def expect_particles_stopped():
            page.wait_for_timeout(150)
            before = page.evaluate('[__particleDraws, __rafCalls]')
            page.wait_for_timeout(220)
            assert page.evaluate('[__particleDraws, __rafCalls]') == before, 'Particles kept running while paused'

        def expect_particles_running():
            before = page.evaluate('__particleDraws')
            page.wait_for_function('before => __particleDraws > before + 2', arg=before)

        motion.click()
        expect(motion).to_have_attribute('aria-label', '开启粒子动效')
        expect_particles_stopped()
        page.reload()
        expect(page.locator('.motion-toggle')).to_have_attribute('aria-label', '开启粒子动效')
        expect_particles_stopped()
        page.locator('.motion-toggle').click()
        expect_particles_running()
        page.emulate_media(reduced_motion='reduce')
        expect(page.locator('.hero-particles')).not_to_be_visible()
        expect_particles_stopped()
        page.reload()
        expect_particles_stopped()
        page.emulate_media(reduced_motion='no-preference')
        expect_particles_running()
        page.evaluate("scrollTo({top: document.body.scrollHeight, behavior: 'instant'})")
        expect_particles_stopped()
        page.evaluate("scrollTo({top: 0, behavior: 'instant'})")
        expect_particles_running()
        page.evaluate("Object.defineProperty(document, 'hidden', {configurable: true, value: true}); document.dispatchEvent(new Event('visibilitychange'))")
        expect_particles_stopped()
        page.evaluate("delete document.hidden; document.dispatchEvent(new Event('visibilitychange'))")
        expect_particles_running()
        page.evaluate("document.querySelector('#project-dialog').showModal()")
        expect_particles_stopped()
        page.evaluate("document.querySelector('#project-dialog').close()")
        expect_particles_running()
        for width in [320, 360, 390, 620, 768, 820, 1024, 1440, 1920]:
            page.set_viewport_size({'width': width, 'height': 1000})
            page.wait_for_timeout(100)
            overflow = page.evaluate('document.documentElement.scrollWidth > innerWidth')
            assert not overflow, f'Horizontal overflow at {width}px'
            control = page.locator('.motion-toggle').bounding_box()
            label = page.locator('.label-infra').bounding_box()
            assert control['y'] >= label['y'] + label['height'] + 4, f'Motion control overlaps label at {width}px'
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
        # Every card opens the intended project and tab. Content stays inside a native modal.
        page.set_viewport_size({'width':1440,'height':1000})
        dialog = page.locator('#project-dialog')
        for project in ['platform', 'review']:
            for view in ['architecture', 'sequence', 'results']:
                entry = page.locator(f'.detail-entry[data-project="{project}"][data-view="{view}"]')
                entry.scroll_into_view_if_needed()
                scroll_before = page.evaluate('scrollY')
                entry.click()
                expect(dialog).to_be_visible()
                expect(dialog).to_have_attribute('data-project', project)
                expect(dialog.locator(f'[role="tab"][data-view="{view}"]')).to_have_attribute('aria-selected', 'true')
                expect(dialog.locator('.panel-heading')).to_be_visible()
                if project == 'platform' and view == 'architecture':
                    page.evaluate('document.fonts.ready')
                    details_metrics = page.evaluate("({longTasks: window.__longTasks, resources: performance.getEntriesByType('resource').filter(e => /project-(details|data|diagrams)|bai-details|architecture.svg/.test(e.name)).length})")
                assert not page.evaluate("document.querySelector('#project-panel').scrollWidth > document.querySelector('#project-panel').clientWidth")
                if view == 'architecture':
                    for node in dialog.locator('[data-node]').all():
                        node.click()
                        expect(node).to_have_attribute('aria-pressed', 'true')
                        assert dialog.locator('#node-inspector h4').inner_text() == node.locator('strong').inner_text()
                        if project == 'platform':
                            assert '/feature/baijun/' in dialog.locator('#node-inspector a').get_attribute('href')
                    dialog.locator('[data-node="worker"]' if project == 'platform' else '[data-node="filter"]').click()
                if view == 'sequence':
                    expect(dialog.locator('.sequence-image')).to_be_visible()
                    dialog.locator('.failure-note summary').click()
                    assert dialog.locator('.failure-note').get_attribute('open') is not None
                if view == 'results':
                    assert dialog.locator('.result-metrics>div').count() == 3
                if args.screenshots:
                    page.evaluate('document.fonts.ready')
                    dialog.locator('#project-panel').evaluate('(el) => el.scrollTop = 0')
                    page.screenshot(path=str(args.screenshots / f'{project}-{view}-desktop.png'), animations='disabled')
                page.keyboard.press('Escape')
                expect(dialog).not_to_be_visible()
                assert entry.evaluate('(el) => document.activeElement === el'), 'Focus did not return to opener'
                assert abs(page.evaluate('scrollY') - scroll_before) <= 1, 'Background scroll position changed'
                assert not page.locator('body').evaluate("el => el.classList.contains('details-open')")
        page.locator('.detail-entry[data-project="platform"][data-view="architecture"]').click()
        expect(dialog.locator('.panel-heading')).to_be_visible()
        first_tab = dialog.locator('[role="tab"]').first
        first_tab.focus()
        page.keyboard.press('ArrowRight')
        expect(dialog.locator('[data-view="sequence"]')).to_have_attribute('aria-selected', 'true')
        page.keyboard.press('End')
        expect(dialog.locator('[data-view="results"]')).to_have_attribute('aria-selected', 'true')
        page.keyboard.press('Home')
        expect(first_tab).to_have_attribute('aria-selected', 'true')
        page.emulate_media(reduced_motion='reduce')
        assert dialog.evaluate("el => getComputedStyle(el).animationName") == 'none'
        page.emulate_media(reduced_motion='no-preference')
        # Tab wraps within the modal; backdrop clicks close it.
        dialog.locator('#node-inspector a').focus()
        page.keyboard.press('Tab')
        assert page.evaluate("document.querySelector('#project-dialog').contains(document.activeElement)")
        page.mouse.click(5, 5)
        expect(dialog).not_to_be_visible()
        # All detail views fit mobile screens; only diagram regions scroll sideways.
        for width in [320,390,768]:
            page.set_viewport_size({'width':width,'height':844})
            for project in ['platform','review']:
                page.locator(f'.detail-entry[data-project="{project}"][data-view="architecture"]').click()
                expect(dialog.locator('.panel-heading')).to_be_visible()
                for view in ['architecture','sequence','results']:
                    dialog.locator(f'[role="tab"][data-view="{view}"]').click()
                    assert not dialog.evaluate('(el) => el.scrollWidth > el.clientWidth')
                    assert not dialog.locator('#project-panel').evaluate('(el) => el.scrollWidth > el.clientWidth')
                    if view == 'architecture':
                        dialog.locator('[data-node]').last.click()
                        expect(dialog.locator('[data-node]').last).to_have_attribute('aria-pressed','true')
                    if args.screenshots and width == 390:
                        page.evaluate('document.fonts.ready')
                        dialog.locator('#project-panel').evaluate('(el) => el.scrollTop = 0')
                        page.screenshot(path=str(args.screenshots / f'{project}-{view}-mobile.png'), animations='disabled')
                dialog.locator('.detail-close').click()
                expect(dialog).not_to_be_visible()
        # Successful resources are reused across openings.
        assert page.evaluate("performance.getEntriesByType('resource').filter(e => e.name.endsWith('/project-details.js')).length") == 1
        # Closing during a slow import must never reopen a dialog or replace a newer selection.
        slow = browser.new_context(viewport={'width':1200,'height':900})
        delayed = slow.new_page()
        held = []
        delayed.route('**/project-details.js', lambda route: held.append(route))
        delayed.goto(url)
        delayed.locator('.detail-entry[data-project="platform"]').first.click()
        expect(delayed.locator('.detail-loading')).to_be_visible()
        delayed.keyboard.press('Escape')
        delayed.locator('.detail-entry[data-project="review"][data-view="results"]').click()
        delayed.wait_for_timeout(100)
        assert len(held) == 1
        held[0].continue_()
        expect(delayed.locator('#project-dialog')).to_have_attribute('data-project','review')
        expect(delayed.locator('[data-view="results"][role="tab"]')).to_have_attribute('aria-selected','true')
        delayed.keyboard.press('Escape')
        slow.close()
        # A failed optional bundle leaves an explicit message, working source link and close button.
        broken = browser.new_context()
        offline = broken.new_page()
        offline.route('**/project-details.js', lambda route: route.abort())
        offline.goto(url)
        offline.locator('.detail-entry').first.click()
        expect(offline.locator('.detail-loading')).to_contain_text('暂时无法加载')
        assert '/feature/baijun/' in offline.locator('[data-project-source]').get_attribute('href')
        offline.locator('.detail-close').click()
        expect(offline.locator('#project-dialog')).not_to_be_visible()
        broken.close()
        nojs = browser.new_context(java_script_enabled=False, viewport={'width':390,'height':844})
        fallback = nojs.new_page()
        fallback.goto(url)
        assert fallback.locator('#nav-links').is_visible(), 'Navigation unavailable without JS'
        assert fallback.locator('h1').is_visible()
        assert fallback.locator('#work h3').count() == 2
        assert fallback.locator('.detail-entry[href^="https://"]').count() == 6
        assert not fallback.locator('.copy-email').is_visible()
        assert not fallback.locator('.motion-toggle').is_visible()
        assert not fallback.locator('.hero-particles').is_visible()
        assert not fallback.evaluate('document.documentElement.scrollWidth > innerWidth')
        assert not errors, errors
        assert not failed, failed
        print(json.dumps({'result':'passed', 'viewport_widths':[320,360,390,620,768,820,1024,1440,1920], 'metrics':metrics, 'particles':particle_metrics, 'details':details_metrics}, ensure_ascii=False))
        browser.close()
finally:
    server.shutdown()
    server.server_close()
