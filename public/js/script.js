/* public/js/script.js
 * Small, framework-free enhancements:
 * 1) Mark current nav link with aria-current="page" (helps fallback nav)
 * 2) Move focus to in-page anchors for accessibility (hash links / skip link)
 * 3) Auto-dismiss flash messages (success/notice) after a short delay
 * 4) Optional password visibility toggle via [data-toggle="password"]
 */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  setActiveNavLink();
  setupHashFocus();
  setupAutoDismissMessages();
  setupPasswordToggles();
});

/* 1) Highlight current nav link (adds aria-current="page") */
function setActiveNavLink() {
  try {
    const here = new URL(window.location.href);
    // Look in primary nav first, then any <nav>
    const nav = document.querySelector(".site-nav") || document.querySelector("nav");
    if (!nav) return;

    const links = Array.from(nav.querySelectorAll("a[href]"));
    let matched = false;

    for (const a of links) {
      // Ignore external links
      let href;
      try { href = new URL(a.href, here.origin); } catch { continue; }
      if (href.origin !== here.origin) continue;

      // Consider exact path match ignoring trailing slashes and query/hash
      const clean = (u) => u.pathname.replace(/\/+$/, "") || "/";
      if (clean(href) === clean(here)) {
        a.setAttribute("aria-current", "page");
        matched = true;
      } else {
        a.removeAttribute("aria-current");
      }
    }

    // If nothing matched and we're on home, mark Home if present
    if (!matched && (here.pathname === "/" || here.pathname === "")) {
      const home = links.find((a) => a.getAttribute("href") === "/" || a.getAttribute("href") === "");
      if (home) home.setAttribute("aria-current", "page");
    }
  } catch {
    /* noop */
  }
}

/* 2) Focus target on in-page navigation for keyboard users */
function setupHashFocus() {
  function focusHashTarget() {
    if (!location.hash) return;
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    // Make sure it can receive focus
    const hadTabindex = el.hasAttribute("tabindex");
    if (!hadTabindex) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: false });
    // Clean up temporary tabindex
    if (!hadTabindex) {
      el.addEventListener("blur", () => el.removeAttribute("tabindex"), { once: true });
    }
  }

  // On load (if page was opened with a hash) and on hash changes
  if (location.hash) focusHashTarget();
  window.addEventListener("hashchange", focusHashTarget);
}

/* 3) Auto-dismiss flash messages from express-messages */
function setupAutoDismissMessages() {
  const container = document.getElementById("messages");
  if (!container) return;

  // Only auto-dismiss non-error messages
  const toDismiss = container.querySelectorAll("ul.messages li.notice, ul.messages li.success");
  if (!toDismiss.length) return;

  // Stagger removals a bit for nicer UX
  const baseDelay = 4000; // first at 4s
  const step = 600;       // each subsequent +0.6s

  toDismiss.forEach((el, i) => {
    const delay = baseDelay + i * step;
    window.setTimeout(() => {
      try {
        // Optional: simple fade-out
        el.style.transition = "opacity 200ms linear, height 200ms ease, margin 200ms ease, padding 200ms ease";
        el.style.opacity = "0";
        el.style.height = "0";
        el.style.margin = "0";
        el.style.padding = "0";
        setTimeout(() => el.remove(), 220);
      } catch {
        // Fallback: just remove
        el.remove();
      }
    }, delay);
  });
}

/* 4) Password visibility toggle
 * Usage:
 *   <input id="password" type="password" ...>
 *   <button type="button" data-toggle="password" data-target="#password">Show</button>
 */
function setupPasswordToggles() {
  const toggles = document.querySelectorAll('[data-toggle="password"]');
  if (!toggles.length) return;

  toggles.forEach((btn) => {
    const sel = btn.getAttribute("data-target");
    if (!sel) return;
    const input = document.querySelector(sel);
    if (!input || !(input instanceof HTMLInputElement)) return;

    btn.addEventListener("click", () => {
      const toType = input.type === "password" ? "text" : "password";
      input.setAttribute("type", toType);
      // Optional label swap for a11y
      const current = (btn.textContent || "").trim().toLowerCase();
      btn.textContent = toType === "text"
        ? (current && current.includes("show") ? "Hide" : "Hide")
        : (current && current.includes("hide") ? "Show" : "Show");
      // Keep focus on input for convenience
      input.focus();
    });
  });
}
