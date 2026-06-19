const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");
const sectionLinks = document.querySelectorAll('[data-nav-menu] a[href^="#"]');
const sections = Array.from(sectionLinks)
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 年份和导航状态属于所有页面共用的基础交互。
document.querySelectorAll("[data-year]").forEach((item) => {
  item.textContent = new Date().getFullYear();
});

let headerFrame = 0;
let headerIsScrolled = null;

const updateHeader = () => {
  const nextState = window.scrollY > 16;
  if (nextState !== headerIsScrolled) {
    header?.classList.toggle("is-scrolled", nextState);
    headerIsScrolled = nextState;
  }
  headerFrame = 0;
};

updateHeader();
window.addEventListener("scroll", () => {
  if (headerFrame) return;
  headerFrame = window.requestAnimationFrame(updateHeader);
}, { passive: true });

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

// 首页按当前可见区块高亮导航，项目详情页会自动跳过。
if ("IntersectionObserver" in window && sections.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-38% 0px -52% 0px", threshold: 0.01 }
  );

  sections.forEach((section) => observer.observe(section));
}

document.querySelectorAll("[data-placeholder-link]").forEach((link) => {
  link.addEventListener("click", (event) => event.preventDefault());
});

if (!reducedMotion) {
  // 仅保留一圈轻量扩散，避免粒子堆叠造成视觉噪声。
  window.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const ripple = document.createElement("span");
    ripple.className = "click-ripple";
    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    document.body.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 660);
  }, { passive: true });
}
