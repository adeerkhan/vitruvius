/* Vitruvius site — behaviour only. No framework, no build step, no tracking.
   Four things: reveal on scroll, neural parallax, nav scroll state, copy to
   clipboard. Everything degrades: with JS off the page renders fully, and with
   prefers-reduced-motion set the parallax never attaches.
   The whole file is loaded with `defer`. */

(() => {
  "use strict";

  const root = document.documentElement;
  // The page ships with class="no-js" so revealed content is visible before
  // this runs. Remove it once, before anything observes, so the animation path
  // is the only path that hides content.
  root.classList.remove("no-js");

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");

  /* --- reveal on scroll -------------------------------------------------- */

  const revealTargets = document.querySelectorAll("[data-reveal]");

  if (revealTargets.length && "IntersectionObserver" in window && !reduced.matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.dataset.shown = "true";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    for (const el of revealTargets) observer.observe(el);
  } else {
    for (const el of revealTargets) el.dataset.shown = "true";
  }

  /* --- nav scroll state -------------------------------------------------- */

  const nav = document.querySelector("[data-nav]");
  if (nav) {
    const sync = () => {
      nav.dataset.stuck = String(window.scrollY > 8);
    };
    sync();
    addEventListener(
      "scroll",
      () => {
        if (!nav.dataset.stuck && window.scrollY > 8) nav.dataset.stuck = "true";
        else if (nav.dataset.stuck === "true" && window.scrollY <= 8) nav.dataset.stuck = "false";
      },
      { passive: true },
    );
  }

  /* --- neural parallax --------------------------------------------------- */

  const field = document.querySelector("[data-neural]");
  if (field && finePointer.matches && !reduced.matches) {
    let queued = false;
    let x = 0;
    let y = 0;

    const paint = () => {
      queued = false;
      field.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    };

    addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType !== "mouse") return;
        const nx = event.clientX / innerWidth - 0.5;
        const ny = event.clientY / innerHeight - 0.5;
        x = nx * 18;
        y = ny * 12;
        if (queued) return;
        queued = true;
        requestAnimationFrame(paint);
      },
      { passive: true },
    );
  }

  /* --- copy to clipboard ------------------------------------------------- */

  for (const button of document.querySelectorAll("[data-copy]")) {
    button.addEventListener("click", async () => {
      const text = button.closest("[data-command]")?.querySelector("code")?.textContent ?? "";
      if (!text) return;
      const label = button.textContent;
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = "copied";
      } catch {
        button.textContent = "press ctrl+c";
      }
      setTimeout(() => {
        button.textContent = label;
      }, 1600);
    });
  }
})();