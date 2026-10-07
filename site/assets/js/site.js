/* Vitruvius site — small, dependency-free interactions.
   Everything here is progressive: with JavaScript off, the nav is a plain
   link list, every section is readable, and the copy buttons simply do
   nothing. No framework, no build step. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- mobile navigation -------------------------------------------------- */
  var toggle = document.querySelector("[data-nav-toggle]");
  var links = document.querySelector("[data-nav-links]");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* --- copy-to-clipboard -------------------------------------------------- */
  document.querySelectorAll("[data-copy]").forEach(function (button) {
    button.addEventListener("click", function () {
      var block = button.closest("[data-command]");
      var code = block ? block.querySelector("code") : null;
      if (!code) return;
      var text = code.textContent.trim();
      var settle = function () {
        var previous = button.textContent;
        button.textContent = "copied";
        window.setTimeout(function () { button.textContent = previous; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(settle, settle);
        return;
      }
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      document.body.appendChild(area);
      area.select();
      try { document.execCommand("copy"); } catch (error) { /* clipboard unavailable */ }
      document.body.removeChild(area);
      settle();
    });
  });

  /* --- reveal on scroll --------------------------------------------------- */
  var items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach(function (item) { item.classList.add("is-visible"); });
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  items.forEach(function (item) { observer.observe(item); });
})();
