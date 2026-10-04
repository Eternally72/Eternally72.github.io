// A small, local canvas follows the three layers of the hero illustration.
(() => {
  const host = document.querySelector('.hero-visual');
  const canvas = host?.querySelector('.hero-particles');
  const toggle = host?.querySelector('.motion-toggle');
  if (!canvas || !toggle || !window.IntersectionObserver || !window.ResizeObserver) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const dialog = document.querySelector('#project-dialog');
  const colors = ['83,126,208', '139,128,194', '64,159,153'];
  let width = 0, height = 0, visible = false, away = false;
  let frame = 0, previous = 0, time = 0, paused = false;
  let pointer = null;
  try { paused = localStorage.getItem('hero-motion-paused') === 'true'; } catch { /* Storage is optional. */ }

  function render() {
    ctx.clearRect(0, 0, width, height);
    const perLayer = width < 430 ? 5 : 8;
    for (let layer = 0; layer < 3; layer++) {
      let last;
      for (let i = 0; i < perLayer; i++) {
        const phase = i * Math.PI * 2 / perLayer + layer * .8;
        const angle = phase + time * (layer === 1 ? -.065 : .05);
        let x = width * (.5 + Math.cos(angle) * (.36 + layer * .015));
        let y = height * (.28 + layer * .19 + Math.sin(angle) * .12);
        y += Math.sin(time * .35 + phase) * 4;
        if (pointer) {
          const dx = x - pointer.x, dy = y - pointer.y;
          const distance = Math.hypot(dx, dy);
          const force = Math.max(0, 1 - distance / 110) * 8;
          x += dx / (distance || 1) * force;
          y += dy / (distance || 1) * force;
        }
        const radius = i % 3 === 0 ? 2 : 1.25;
        if (last && Math.hypot(x - last.x, y - last.y) < width * .24) {
          ctx.strokeStyle = `rgba(${colors[layer]},.12)`;
          ctx.lineWidth = .65;
          ctx.beginPath();
          ctx.moveTo(last.x, last.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(${colors[layer]},.07)`;
        ctx.beginPath();
        ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${colors[layer]},${.45 + Math.sin(time * .4 + phase) * .1})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        last = { x, y };
      }
    }
  }

  function tick(now) {
    // Limit drawing to 30 fps, including on high-refresh-rate displays.
    if (now - previous >= 1000 / 30) {
      time += previous ? Math.min((now - previous) / 1000, .05) : 0;
      previous = now;
      render();
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    canvas.hidden = reduced.matches;
    toggle.hidden = reduced.matches;
    toggle.classList.toggle('is-paused', paused);
    const label = paused ? '开启粒子动效' : '暂停粒子动效';
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    if (!reduced.matches && !paused && visible && !away && !document.hidden && !dialog?.open && width && height) {
      frame = requestAnimationFrame(tick);
    }
  }

  new ResizeObserver(([entry]) => {
    width = entry.contentRect.width;
    height = entry.contentRect.height;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!reduced.matches) render();
    sync();
  }).observe(host);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) pointer = null;
    sync();
  }).observe(host);
  if (dialog) new MutationObserver(sync).observe(dialog, { attributes: true, attributeFilter: ['open'] });
  toggle.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('hero-motion-paused', String(paused)); } catch { /* Storage is optional. */ }
    sync();
  });
  host.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || event.pointerType !== 'mouse' || paused || reduced.matches) return;
    const box = host.getBoundingClientRect();
    pointer = { x: event.clientX - box.left, y: event.clientY - box.top };
  }, { passive: true });
  host.addEventListener('pointerleave', () => { pointer = null; });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { away = true; sync(); });
  window.addEventListener('pageshow', () => { away = false; sync(); });
  sync();
})();
