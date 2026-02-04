/* Portfolio interactions (static site) */

(function () {
  const root = document.documentElement;
  const body = document.body;

  // Year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Header scrolled state
  const header = document.getElementById("site-header");
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 40) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Back to top
  const toTop = document.getElementById("to-top");
  if (toTop) {
    window.addEventListener(
      "scroll",
      () => {
        if (window.scrollY > 700) toTop.classList.add("show");
        else toTop.classList.remove("show");
      },
      { passive: true },
    );
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  // Mobile nav
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });

    // close on link click
    navLinks.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });

    // close if clicking outside
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!target) return;
      if (navLinks.classList.contains("open")) {
        const inside = navLinks.contains(target) || navToggle.contains(target);
        if (!inside) {
          navLinks.classList.remove("open");
          navToggle.setAttribute("aria-expanded", "false");
        }
      }
    });
  }

  // Smooth scrolling with header offset
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (!el) return;

      e.preventDefault();
      const offset = (header?.offsetHeight ?? 70) + 18;
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  // Active nav link (IntersectionObserver)
  const sections = ["about", "skills", "experience", "projects", "certifications", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const navMap = new Map();
  document.querySelectorAll(".nav-link").forEach((a) => {
    const href = a.getAttribute("href");
    if (href && href.startsWith("#")) navMap.set(href.slice(1), a);
  });

  if ("IntersectionObserver" in window && sections.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        // pick the most visible entry
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (visible && visible.target && visible.target.id) {
          document.querySelectorAll(".nav-link.active").forEach((a) => a.classList.remove("active"));
          const link = navMap.get(visible.target.id);
          if (link) link.classList.add("active");
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0.05, 0.2, 0.4, 0.6, 0.8] },
    );

    sections.forEach((s) => obs.observe(s));
  }

  // Theme toggle
  const themeBtn = document.getElementById("theme-toggle");
  const storageKey = "hr_theme";
  function setTheme(mode) {
    if (mode === "dark") body.classList.add("dark-mode");
    else body.classList.remove("dark-mode");
    localStorage.setItem(storageKey, mode);
  }
  function initTheme() {
    const stored = localStorage.getItem(storageKey);
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      return;
    }
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }
  initTheme();

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const isDark = body.classList.contains("dark-mode");
      setTheme(isDark ? "light" : "dark");
    });
  }

  // Project filtering
  const filterButtons = document.querySelectorAll(".filter-btn");
  const projects = document.querySelectorAll(".project");
  function applyFilter(tag) {
    projects.forEach((card) => {
      const tags = (card.getAttribute("data-tags") || "").split(/\s+/).filter(Boolean);
      const show = tag === "all" ? true : tags.includes(tag);
      card.style.display = show ? "" : "none";
    });
  }
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyFilter(btn.getAttribute("data-filter") || "all");
    });
  });
  applyFilter("all");
})();
