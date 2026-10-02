// All content and links remain usable without JavaScript.
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#nav-links');
const mobile = window.matchMedia('(max-width: 620px)');

if (menuButton && menu) {
  document.documentElement.classList.add('js');
  menuButton.hidden = false;
  const closeMenu = (restoreFocus = false) => {
    menu.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '打开导航菜单');
    if (restoreFocus) menuButton.focus();
  };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menu.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
  });
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav')) closeMenu();
  });
  document.querySelector('.nav').addEventListener('focusout', (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) closeMenu();
  });
  mobile.addEventListener('change', () => closeMenu());
}

const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        links.forEach((link) => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      } else {
        links.find((link) => link.hash === `#${entry.target.id}`)?.removeAttribute('aria-current');
      }
    }
  }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
  links.forEach((link) => {
    const section = document.querySelector(link.hash);
    if (section) observer.observe(section);
  });
}

const copyButton = document.querySelector('.copy-email');
const copyStatus = document.querySelector('.copy-status');
if (copyButton && copyStatus && navigator.clipboard?.writeText && window.isSecureContext) {
  copyButton.hidden = false;
  let resetTimer;
  copyButton.addEventListener('click', async () => {
    clearTimeout(resetTimer);
    try {
      await navigator.clipboard.writeText(copyButton.dataset.email);
      copyStatus.textContent = '邮箱已复制。';
    } catch {
      copyStatus.textContent = '复制未成功，请长按或选中邮箱地址复制。';
    }
    resetTimer = setTimeout(() => { copyStatus.textContent = ''; }, 4500);
  });
}

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});

// Keep the original documentation links as the no-JS / older-browser fallback.
const projectDialog = document.querySelector('#project-dialog');
if (projectDialog && typeof projectDialog.showModal === 'function') {
  const entries = [...document.querySelectorAll('.detail-entry')];
  const panel = projectDialog.querySelector('#project-panel');
  const tablist = projectDialog.querySelector('.detail-tabs');
  let controller;
  let resources;
  let opener;
  let request = 0;
  let pointerStartedOutside = false;
  const outside = (event) => {
    const box = projectDialog.getBoundingClientRect();
    return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
  };
  const loadResources = () => {
    if (!resources) {
      const style = new Promise((resolve, reject) => {
        const sheet = document.createElement('link');
        sheet.rel = 'stylesheet';
        sheet.href = 'project-details.css';
        sheet.onload = resolve;
        sheet.onerror = () => { sheet.remove(); reject(new Error('Stylesheet unavailable')); };
        document.head.append(sheet);
      });
      resources = Promise.all([import('./project-details.js'), style]);
    }
    return resources;
  };
  entries.forEach((entry) => {
    entry.setAttribute('aria-haspopup', 'dialog');
    entry.addEventListener('click', async (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const current = ++request;
      opener = entry;
      projectDialog.querySelector('#project-dialog-title').textContent = entry.closest('.project').querySelector('h3').textContent;
      projectDialog.querySelector('#project-dialog-subtitle').textContent = '架构、时序与验证记录';
      projectDialog.querySelector('[data-project-source]').href = entry.href;
      tablist.hidden = true;
      panel.setAttribute('aria-busy', 'true');
      panel.innerHTML = '<p class="detail-loading" role="status">正在加载项目详情…</p>';
      projectDialog.showModal();
      document.body.classList.add('details-open');
      projectDialog.querySelector('.detail-close').focus({ preventScroll: true });
      try {
        const [module] = await loadResources();
        if (!projectDialog.open || current !== request) return;
        controller ??= module.createProjectDetails(projectDialog);
        controller.show(entry.dataset.project, entry.dataset.view);
        tablist.hidden = false;
      } catch {
        if (!projectDialog.open || current !== request) return;
        panel.innerHTML = '<div class="detail-loading" role="status"><p>项目详情暂时无法加载，请刷新页面重试。</p><p>也可以通过上方链接查看项目源码或文档。</p></div>';
      } finally {
        if (current === request) panel.removeAttribute('aria-busy');
      }
    });
  });
  projectDialog.querySelector('.detail-close').addEventListener('click', () => projectDialog.close());
  projectDialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusable = [...projectDialog.querySelectorAll('a[href], button, [tabindex], summary')]
      .filter((element) => element.tabIndex >= 0 && !element.disabled && element.getClientRects().length);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
  projectDialog.addEventListener('pointerdown', (event) => { pointerStartedOutside = outside(event); });
  projectDialog.addEventListener('click', (event) => {
    if (pointerStartedOutside && outside(event)) projectDialog.close();
    pointerStartedOutside = false;
  });
  projectDialog.addEventListener('close', () => {
    ++request;
    panel.removeAttribute('aria-busy');
    document.body.classList.remove('details-open');
    opener?.focus({ preventScroll: true });
  });
}
