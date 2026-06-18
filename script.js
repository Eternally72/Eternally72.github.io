const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("[data-nav-links]");
const year = document.querySelector("[data-year]");
const sectionLinks = document.querySelectorAll(".nav-links a");
const placeholderLinks = document.querySelectorAll('a[href="#"]');
const sections = Array.from(sectionLinks)
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if (year) {
  year.textContent = new Date().getFullYear();
}

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");

    // 同步按钮状态，方便屏幕阅读器正确理解移动端导航是否展开。
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "关闭导航" : "打开导航");
  });

  sectionLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "打开导航");
    });
  });
}

placeholderLinks.forEach((link) => {
  // 项目链接还是占位状态时，避免点击后页面跳回顶部。
  link.addEventListener("click", (event) => event.preventDefault());
});

if ("IntersectionObserver" in window && sections.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        // 根据当前滚动位置高亮导航项，让单页结构更容易定位。
        sectionLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    {
      rootMargin: "-35% 0px -55% 0px",
      threshold: 0.01,
    }
  );

  sections.forEach((section) => observer.observe(section));
}
