const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.querySelectorAll("[data-year]").forEach((item) => {
  item.textContent = new Date().getFullYear();
});

let headerFrame = 0;
let headerIsScrolled = null;

const updateHeader = () => {
  const nextState = window.scrollY > 14;

  if (nextState !== headerIsScrolled) {
    header?.classList.toggle("is-scrolled", nextState);
    headerIsScrolled = nextState;
  }

  headerFrame = 0;
};

updateHeader();
window.addEventListener(
  "scroll",
  () => {
    if (headerFrame) return;
    headerFrame = window.requestAnimationFrame(updateHeader);
  },
  { passive: true }
);

if (navToggle && navMenu) {
  const closeMenu = () => {
    navMenu.classList.remove("is-open");
    navToggle.classList.remove("is-open");
    header?.classList.remove("menu-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "打开导航菜单");
  };

  const openMenu = () => {
    navMenu.classList.add("is-open");
    navToggle.classList.add("is-open");
    header?.classList.add("menu-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "关闭导航菜单");
  };

  navToggle.addEventListener("click", () => {
    if (navMenu.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navMenu.classList.contains("is-open")) {
      closeMenu();
      navToggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (!navMenu.classList.contains("is-open")) return;
    if (navMenu.contains(event.target) || navToggle.contains(event.target)) return;
    closeMenu();
  });

  window.addEventListener("resize", () => {
    const desktopNavigationIsVisible =
      window.getComputedStyle(navToggle).display === "none";

    if (desktopNavigationIsVisible) closeMenu();
  });
}

const sectionLinks = Array.from(
  document.querySelectorAll('[data-nav-menu] a[href^="#"]')
);
const observedSections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && observedSections.length > 0) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visibleEntry) return;

      sectionLinks.forEach((link) => {
        link.classList.toggle(
          "is-active",
          link.getAttribute("href") === `#${visibleEntry.target.id}`
        );
      });
    },
    {
      rootMargin: "-32% 0px -55% 0px",
      threshold: [0.01, 0.2, 0.5],
    }
  );

  observedSections.forEach((section) => sectionObserver.observe(section));
}

const revealItems = document.querySelectorAll("[data-reveal]");

if (!reducedMotion && "IntersectionObserver" in window && revealItems.length > 0) {
  document.documentElement.classList.add("reveal-ready");

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.08,
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const personalPage = document.body.classList.contains("personal-page");

if (personalPage && finePointer && !reducedMotion) {
  let pointerFrame = 0;
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 3;

  const updatePointerGlow = () => {
    document.documentElement.style.setProperty("--pointer-x", `${pointerX}px`);
    document.documentElement.style.setProperty("--pointer-y", `${pointerY}px`);
    pointerFrame = 0;
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;

      if (!pointerFrame) {
        pointerFrame = window.requestAnimationFrame(updatePointerGlow);
      }
    },
    { passive: true }
  );

  document.querySelectorAll("[data-tilt]").forEach((element) => {
    let tiltFrame = 0;
    let tiltEvent = null;

    const updateTilt = () => {
      const bounds = element.getBoundingClientRect();
      const horizontal = (tiltEvent.clientX - bounds.left) / bounds.width;
      const vertical = (tiltEvent.clientY - bounds.top) / bounds.height;
      const rotateX = (0.5 - vertical) * 5;
      const rotateY = (horizontal - 0.5) * 6;

      element.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
      element.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
      element.style.setProperty("--glow-x", `${(horizontal * 100).toFixed(1)}%`);
      element.style.setProperty("--glow-y", `${(vertical * 100).toFixed(1)}%`);
      tiltFrame = 0;
    };

    element.addEventListener(
      "pointermove",
      (event) => {
        tiltEvent = event;

        if (!tiltFrame) {
          tiltFrame = window.requestAnimationFrame(updateTilt);
        }
      },
      { passive: true }
    );

    element.addEventListener("pointerleave", () => {
      if (tiltFrame) {
        window.cancelAnimationFrame(tiltFrame);
        tiltFrame = 0;
      }

      element.style.setProperty("--tilt-x", "0deg");
      element.style.setProperty("--tilt-y", "0deg");
      element.style.setProperty("--glow-x", "50%");
      element.style.setProperty("--glow-y", "50%");
    });
  });
}
