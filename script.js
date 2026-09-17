/* =============================================================================
 * Portfolio — behaviour layer
 * -----------------------------------------------------------------------------
 * Static site, no build step, no framework. Every module below is defensive:
 * if the markup it drives is absent, the module exits quietly instead of
 * throwing, so sections can be added or removed from index.html without
 * touching this file.
 *
 * Content lives in index.html. This file contains behaviour only — the single
 * exception is SETTINGS, which holds tuning values (durations, thresholds,
 * storage keys) so nothing is buried as a magic number inside a function.
 * ========================================================================== */

(function () {
  "use strict";

  /** Behavioural configuration. No content, no copy — timings and selectors. */
  var SETTINGS = {
    themeStorageKey: "theme",
    headerScrollOffset: 50,
    backToTopOffset: 400,
    typing: {
      typeSpeedMs: 80,
      deleteSpeedMs: 40,
      holdMs: 2000,
      /** Fallback only — real titles come from [data-titles] in the markup. */
      fallbackTitles: ["Software Engineer"],
      separator: "|"
    },
    counter: {
      durationMs: 1500,
      stepMs: 50
    },
    reveal: {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    }
  };

  var prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var $ = function (selector, scope) {
    return (scope || document).querySelector(selector);
  };
  var $$ = function (selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  };

  /* ---------------------------------------------------------------------------
   * Theme (light / dark)
   * The initial theme is applied inline in <head> to avoid a flash of the wrong
   * theme; this module only handles toggling and persistence afterwards.
   * ------------------------------------------------------------------------ */
  function initTheme() {
    var toggle = $("#theme-toggle");
    var root = document.documentElement;

    function apply(mode) {
      root.setAttribute("data-theme", mode);
      if (toggle) {
        toggle.classList.toggle("dark", mode === "dark");
        toggle.setAttribute("aria-pressed", mode === "dark" ? "true" : "false");
      }
    }

    apply(root.getAttribute("data-theme") || "light");

    if (!toggle) return;

    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      try {
        localStorage.setItem(SETTINGS.themeStorageKey, next);
      } catch (e) {
        /* storage unavailable (private mode) — the theme still applies for this visit */
      }
    });

    // Follow the OS only while the visitor has never chosen explicitly.
    if (window.matchMedia) {
      var media = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function (event) {
        var stored = null;
        try {
          stored = localStorage.getItem(SETTINGS.themeStorageKey);
        } catch (e) { /* ignore */ }
        if (!stored) apply(event.matches ? "dark" : "light");
      };
      if (typeof media.addEventListener === "function") media.addEventListener("change", onChange);
      else if (typeof media.addListener === "function") media.addListener(onChange);
    }
  }

  /* ---------------------------------------------------------------------------
   * Header state, back-to-top, mobile navigation
   * ------------------------------------------------------------------------ */
  function initChrome() {
    var header = $("#header");
    var backToTop = $("#back-to-top");
    var menuToggle = $("#menu-toggle");

    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      if (header) header.classList.toggle("scrolled", y > SETTINGS.headerScrollOffset);
      if (backToTop) backToTop.classList.toggle("visible", y > SETTINGS.backToTopOffset);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (backToTop) {
      backToTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
      });
    }

    if (menuToggle) {
      menuToggle.addEventListener("click", function (event) {
        event.stopPropagation();
        var open = document.body.classList.toggle("menu-open");
        menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
      });

      document.addEventListener("click", function (event) {
        if (!document.body.classList.contains("menu-open")) return;
        var nav = $("#nav");
        var insideNav = nav && nav.contains(event.target);
        if (!insideNav && !menuToggle.contains(event.target)) closeMenu();
      });

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeMenu();
      });
    }

    function closeMenu() {
      document.body.classList.remove("menu-open");
      if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
    }

    /* Smooth in-page scrolling with a header-height offset. */
    var headerHeight = function () {
      return header ? header.offsetHeight : 0;
    };

    $$('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (event) {
        var href = anchor.getAttribute("href");
        if (!href) return;

        if (href === "#") {
          event.preventDefault();
          window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
          closeMenu();
          return;
        }

        var target = document.getElementById(href.slice(1));
        if (!target) return; // let the browser handle unknown anchors

        event.preventDefault();
        var top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight();
        window.scrollTo({ top: top, behavior: prefersReducedMotion ? "auto" : "smooth" });
        closeMenu();
      });
    });
  }

  /* ---------------------------------------------------------------------------
   * Active navigation link
   *
   * Driven by scroll position rather than IntersectionObserver ratios: a section
   * taller than the observer's detection band never reaches a ratio threshold,
   * so ratio-based tracking silently stops updating on long sections. Comparing
   * the scroll offset against each section's top is height-independent and
   * always resolves to exactly one section.
   * ------------------------------------------------------------------------ */
  function initActiveNav() {
    var header = $("#header");
    var entries = [];

    $$(".nav-link").forEach(function (link) {
      var href = link.getAttribute("href") || "";
      if (href.charAt(0) !== "#" || href.length < 2) return;
      var section = document.getElementById(href.slice(1));
      if (!section) return;
      entries.push({ link: link, section: section });
    });

    if (!entries.length) return;

    var current = null;
    var ticking = false;

    function resolve() {
      var headerHeight = header ? header.offsetHeight : 0;
      // A section counts as current once its top passes just below the header.
      var probe = (window.scrollY || window.pageYOffset) + headerHeight + 1;
      var atBottom =
        window.innerHeight + (window.scrollY || window.pageYOffset) >=
        document.documentElement.scrollHeight - 2;

      var match = null;

      if (atBottom) {
        match = entries[entries.length - 1];
      } else {
        for (var i = 0; i < entries.length; i++) {
          var top = entries[i].section.getBoundingClientRect().top + (window.scrollY || window.pageYOffset);
          if (top <= probe) match = entries[i];
        }
      }

      if (match === current) return;
      current = match;

      entries.forEach(function (entry) {
        var active = entry === match;
        entry.link.classList.toggle("active", active);
        if (active) entry.link.setAttribute("aria-current", "true");
        else entry.link.removeAttribute("aria-current");
      });
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        resolve();
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    resolve();
  }

  /* ---------------------------------------------------------------------------
   * Hero typing effect — titles are read from the markup, never hardcoded here
   * ------------------------------------------------------------------------ */
  function initTyping() {
    var el = $("#typed-text");
    if (!el) return;

    var raw = el.getAttribute("data-titles") || "";
    var titles = raw
      .split(SETTINGS.typing.separator)
      .map(function (title) { return title.trim(); })
      .filter(Boolean);

    if (!titles.length) titles = SETTINGS.typing.fallbackTitles;

    // Static text is enough when the visitor has asked for reduced motion.
    if (prefersReducedMotion) {
      el.textContent = titles[0];
      var caret = $(".cursor");
      if (caret) caret.style.display = "none";
      return;
    }

    var titleIndex = 0;
    var charIndex = 0;
    var deleting = false;

    function tick() {
      var current = titles[titleIndex];
      el.textContent = current.substring(0, charIndex);

      if (!deleting) {
        charIndex++;
        if (charIndex > current.length) {
          deleting = true;
          window.setTimeout(tick, SETTINGS.typing.holdMs);
          return;
        }
      } else {
        charIndex--;
        if (charIndex === 0) {
          deleting = false;
          titleIndex = (titleIndex + 1) % titles.length;
        }
      }

      window.setTimeout(tick, deleting ? SETTINGS.typing.deleteSpeedMs : SETTINGS.typing.typeSpeedMs);
    }

    tick();
  }

  /* ---------------------------------------------------------------------------
   * Scroll reveal
   * ------------------------------------------------------------------------ */
  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      items.forEach(function (el) { el.classList.add("revealed"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        });
      },
      { threshold: SETTINGS.reveal.threshold, rootMargin: SETTINGS.reveal.rootMargin }
    );

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------------------
   * Animated statistic counters — targets come from data-count in the markup
   * ------------------------------------------------------------------------ */
  function initCounters() {
    var counters = $$(".stat-number[data-count]");
    if (!counters.length) return;

    function run(el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      if (isNaN(target)) return;

      if (prefersReducedMotion) {
        el.textContent = String(target);
        return;
      }

      var steps = Math.max(1, Math.round(SETTINGS.counter.durationMs / SETTINGS.counter.stepMs));
      var increment = Math.max(1, Math.ceil(target / steps));
      var value = 0;

      var timer = window.setInterval(function () {
        value += increment;
        if (value >= target) {
          value = target;
          window.clearInterval(timer);
        }
        el.textContent = String(value);
      }, SETTINGS.counter.stepMs);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(run);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          run(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------------------
   * Project filtering — categories are read from each card's data-tags
   * ------------------------------------------------------------------------ */
  function initProjectFilters() {
    var buttons = $$(".filter-btn");
    var cards = $$(".project-card[data-tags]");
    var emptyState = $("#projects-empty");

    if (!buttons.length || !cards.length) return;

    function apply(filter) {
      var matches = 0;

      cards.forEach(function (card) {
        var tags = (card.getAttribute("data-tags") || "").split(/\s+/).filter(Boolean);
        var show = filter === "all" || tags.indexOf(filter) !== -1;
        card.hidden = !show;
        if (show) matches++;
      });

      if (emptyState) emptyState.hidden = matches > 0;
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        buttons.forEach(function (other) {
          other.classList.remove("active");
          other.setAttribute("aria-pressed", "false");
        });
        button.classList.add("active");
        button.setAttribute("aria-pressed", "true");
        apply(button.getAttribute("data-filter") || "all");
      });
    });

    var initial = $(".filter-btn.active");
    apply(initial ? initial.getAttribute("data-filter") || "all" : "all");
  }

  /* ---------------------------------------------------------------------------
   * Derived content — values computed from the DOM rather than duplicated in it
   * ------------------------------------------------------------------------ */
  function initDerivedContent() {
    // Footer year
    $$("[data-current-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });

    // Skill-category counts
    $$(".skill-category").forEach(function (category) {
      var slot = $("[data-skill-count]", category);
      if (!slot) return;
      slot.textContent = String($$(".skill-tag", category).length);
    });

    /* Images that fade in on load start at opacity 0. If one is served from
     * cache before its inline handler runs, or fails outright, reveal it here
     * so the slot is never left blank. */
    $$(".hero-image").forEach(function (img) {
      if (img.complete) img.classList.add("loaded");
      img.addEventListener("load", function () { img.classList.add("loaded"); });
      img.addEventListener("error", function () { img.classList.add("loaded"); });
    });
  }

  /* ---------------------------------------------------------------------------
   * Bootstrap
   * ------------------------------------------------------------------------ */
  function init() {
    initTheme();
    initChrome();
    initActiveNav();
    initTyping();
    initReveal();
    initCounters();
    initProjectFilters();
    initDerivedContent();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
