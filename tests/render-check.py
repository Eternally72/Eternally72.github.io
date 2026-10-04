"""Verify first paint even when every optional asset remains pending.

Use --url to run the same checks against the deployed GitHub Pages site.
"""
import argparse
import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--url')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
server = None

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

if not args.url:
    handler = functools.partial(QuietHandler, directory=str(root))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
url = args.url or f'http://127.0.0.1:{server.server_port}/'

try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for mode in ['normal', 'pending-styles', 'pending-all-assets', 'paused-animations']:
            context = browser.new_context(viewport={'width': 1280, 'height': 900})
            page = context.new_page()
            pending = []
            if mode.startswith('pending-'):
                def route_request(route):
                    if route.request.resource_type != 'document' and (
                        mode == 'pending-all-assets' or route.request.resource_type == 'stylesheet'
                    ):
                        pending.append(route)
                    else:
                        route.continue_()
                page.route('**/*', route_request)
            response = page.goto(url, wait_until='commit', timeout=30000)
            page.wait_for_function("document.querySelector('#contact') !== null", polling=50)
            if mode == 'paused-animations':
                page.add_style_tag(content='*,*::before,*::after { animation-play-state: paused !important; }')
                page.evaluate("document.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 0; })")
            page.wait_for_timeout(1500)
            result = page.evaluate("""() => ({
                painted: performance.getEntriesByType('paint').some(e => e.name === 'first-contentful-paint'),
                heading: document.querySelector('h1').textContent,
                opacity: getComputedStyle(document.querySelector('.hero-copy')).opacity,
                bodyWidth: document.body.scrollWidth,
                viewport: innerWidth
            })""")
            result.update(mode=mode, status=response.status, pending=len(pending))
            print(json.dumps(result, ensure_ascii=False), flush=True)
            for route in pending:
                route.abort()
            page.unroute_all(behavior='wait')
            context.close()
            assert result['status'] == 200
            assert result['painted'], f'{mode}: blank page while assets are pending'
            assert '白俊' in result['heading'] and float(result['opacity']) > .95
            assert result['bodyWidth'] <= result['viewport']
        browser.close()
finally:
    if server:
        server.shutdown()
        server.server_close()
