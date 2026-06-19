const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");
const navLinks = document.querySelectorAll('[data-nav-menu] a[href^="#"]');
const sections = Array.from(navLinks)
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 自动更新页脚年份，避免每年手动修改。
document.querySelectorAll("[data-year]").forEach((item) => {
  item.textContent = new Date().getFullYear();
});

const syncHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 18);
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

if (navToggle && navMenu) {
  const closeMenu = () => {
    navMenu.classList.remove("is-open");
    navToggle.classList.remove("is-open");
    header?.classList.remove("menu-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "打开导航菜单");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", isOpen);
    header?.classList.toggle("menu-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "关闭导航菜单" : "打开导航菜单");
  });

  navMenu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
}

// 首页滚动时同步高亮当前导航区域；详情页会自然跳过这段逻辑。
if ("IntersectionObserver" in window && sections.length > 0) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-38% 0px -52% 0px", threshold: 0.01 }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

// 未配置的 GitHub 与 Resume 入口保持静止，替换 href 后即可正常跳转。
document.querySelectorAll("[data-placeholder-link]").forEach((link) => {
  link.addEventListener("click", (event) => event.preventDefault());
});

if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
  let frameId = 0;

  window.addEventListener("pointermove", (event) => {
    if (frameId) return;
    frameId = window.requestAnimationFrame(() => {
      document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
      frameId = 0;
    });
  }, { passive: true });
}

if (!reducedMotion) {
  const colors = ["#79aef8", "#7fdcc1", "#b3a3ee", "#efa8bf"];

  // 点击特效使用临时 DOM 节点，动画结束后立即清理，不干扰原有点击行为。
  window.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;

    const ripple = document.createElement("span");
    ripple.className = "click-ripple";
    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    document.body.appendChild(ripple);

    for (let index = 0; index < 5; index += 1) {
      const angle = (Math.PI * 2 * index) / 5 + Math.random() * 0.35;
      const distance = 28 + Math.random() * 22;
      const particle = document.createElement("span");
      particle.className = "click-particle";
      particle.style.left = `${event.clientX}px`;
      particle.style.top = `${event.clientY}px`;
      particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
      particle.style.setProperty("--particle-color", colors[index % colors.length]);
      document.body.appendChild(particle);
      window.setTimeout(() => particle.remove(), 700);
    }

    window.setTimeout(() => ripple.remove(), 750);
  }, { passive: true });
}
