(function () {
  "use strict";

  var cfg = window.ZENTA_CONFIG || {};

  /* ---------- Inject contact-driven links/hrefs ---------- */
  function buildWaLink(number, message) {
    if (!number) return "#";
    var base = "https://wa.me/" + number;
    return message ? base + "?text=" + encodeURIComponent(message) : base;
  }

  document.querySelectorAll("[data-wa-link]").forEach(function (el) {
    el.setAttribute("href", buildWaLink(cfg.whatsappNumber, cfg.whatsappMessage));
  });
  document.querySelectorAll("[data-email-link]").forEach(function (el) {
    if (!cfg.email) return;
    var subject = el.getAttribute("data-email-subject");
    var href = "mailto:" + cfg.email;
    if (subject) href += "?subject=" + encodeURIComponent(subject);
    el.setAttribute("href", href);
  });

  function wireDemoLink(selector, url) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (url) {
        el.setAttribute("href", url);
      } else {
        el.classList.add("is-pending");
        el.setAttribute("href", "#");
        el.setAttribute("aria-disabled", "true");
        el.addEventListener("click", function (e) { e.preventDefault(); });
      }
    });
  }
  wireDemoLink("[data-demo='ebooks']", cfg.demoEbooks);
  wireDemoLink("[data-demo='dejara']", cfg.demoDejara);
  wireDemoLink("[data-demo='ovidio']", cfg.demoOvidio);
  wireDemoLink("[data-demo='inmobiliaria']", cfg.demoInmobiliaria);
  wireDemoLink("[data-demo='inmobiliaria-generica']", cfg.demoInmobiliariaGenerica);

  /* ---------- Header: shrink + mobile menu ---------- */
  var header = document.getElementById("siteHeader");
  function onScroll() {
    if (window.scrollY > 24) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var navToggle = document.getElementById("navToggle");
  var mobileMenu = document.getElementById("mobileMenu");
  var mobileMenuClose = document.getElementById("mobileMenuClose");
  function closeMenu() { mobileMenu.classList.remove("is-open"); document.documentElement.style.overflow = ""; }
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      mobileMenu.classList.add("is-open");
      document.documentElement.style.overflow = "hidden";
    });
  }
  if (mobileMenuClose) mobileMenuClose.addEventListener("click", closeMenu);
  mobileMenu && mobileMenu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });

  /* ---------- Sticky mobile CTA (appears after hero) ---------- */
  var stickyCta = document.getElementById("stickyCta");
  var hero = document.querySelector(".hero");
  if (stickyCta && hero && "IntersectionObserver" in window) {
    var heroObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        stickyCta.classList.toggle("is-visible", !entry.isIntersecting);
      });
    }, { threshold: 0 });
    heroObs.observe(hero);
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el, i) {
      el.style.setProperty("--i", i % 8);
      revealObs.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");
    q.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      document.querySelectorAll(".faq-item.is-open").forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove("is-open");
          openItem.querySelector(".faq-a").style.maxHeight = null;
        }
      });
      if (isOpen) {
        item.classList.remove("is-open");
        a.style.maxHeight = null;
      } else {
        item.classList.add("is-open");
        a.style.maxHeight = a.scrollHeight + "px";
      }
    });
  });

  /* ---------- Smooth-scroll for in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length > 1) {
        var target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });
})();
