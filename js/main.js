/* ==========================================================================
   main.js — Riverton Community Bike Workshop (site-wide behaviour)
   Loaded deferred on EVERY page. Vanilla ES6, zero dependencies.
   Each feature is an isolated IIFE with its own guard clauses, so a missing
   element on one page can never break the others (graceful degradation).

   CONTENTS
   0. Bootstrap — no-js → js class swap (gates all CSS-only enhancements)
   1. Feature A — Theme switcher (light/dark, persisted in localStorage)
   2. Feature B — Responsive navigation toggle (accessible, ARIA-driven)
   3. Feature C — Course table live filter (services.html)
   4. Micro    — footer year (content accuracy, trivially progressive)
   ========================================================================== */
'use strict';

/* --------------------------------------------------------------------------
   0. BOOTSTRAP
   The <html> element ships with class="no-js". CSS hides JS-dependent
   controls (.nav-toggle, .filter-box) under .no-js and enables the
   collapsible nav only under .js. Swapping the class here — before first
   paint in practice — is the standard progressive-enhancement gate.
   -------------------------------------------------------------------------- */
(function () {
  const root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');
})();

/* --------------------------------------------------------------------------
   1. FEATURE A — THEME SWITCHER
   User need: comfortable reading in low light / personal preference.
   Priority order: saved choice (localStorage) → OS preference → light.
   All storage access is wrapped in try/catch because some browsers block
   localStorage (private mode, strict settings) — the feature must still work
   for the session in that case.
   -------------------------------------------------------------------------- */
(function initTheme() {
  const STORAGE_KEY = 'rcbw-theme';
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return; // guard: button missing → do nothing

  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    // Label states the ACTION (not the state) — the accessible toggle pattern.
    toggle.setAttribute('aria-label',
      theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    // Keep the mobile browser chrome in sync with the page theme.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#17402a' : '#1f6f43');
  }

  function storedTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (error) { return null; }
  }

  // Initial theme (runs on every page load, so the choice follows the user)
  const initial = storedTheme() === 'dark' || storedTheme() === 'light'
    ? storedTheme()
    : (systemDark.matches ? 'dark' : 'light');
  apply(initial);

  toggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(STORAGE_KEY, next); } catch (error) { /* non-fatal */ }
    apply(next);
  });

  // Follow live OS changes, but only while the user has NOT made a choice —
  // an explicit click must always win over the operating system.
  systemDark.addEventListener('change', (event) => {
    if (storedTheme() !== 'light' && storedTheme() !== 'dark') {
      apply(event.matches ? 'dark' : 'light');
    }
  });
})();

/* --------------------------------------------------------------------------
   2. FEATURE B — RESPONSIVE NAVIGATION TOGGLE
   User need: one-hand reachability of the menu on phones.
   Accessibility: aria-expanded communicates state, aria-controls ties the
   button to the region, Escape closes and restores focus to the button.
   NOTE: this is standard site navigation, so we deliberately do NOT use
   role="menu" (that role is for application-style menus and would change
   keyboard expectations). Links stay in normal tab order when visible.
   -------------------------------------------------------------------------- */
(function initNav() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return; // guard

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }

  toggle.addEventListener('click', () => {
    setOpen(!nav.classList.contains('is-open'));
  });

  // Choosing a destination closes the menu (also covers anchor links).
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  // Escape closes and returns focus to the toggle — expected modal-ish affordance.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  // If the viewport grows past the mobile breakpoint, reset state so the
  // (CSS-forced-visible) desktop nav doesn't disagree with aria-expanded.
  const desktop = window.matchMedia('(min-width: 40em)');
  desktop.addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
})();

/* --------------------------------------------------------------------------
   3. FEATURE C — COURSE TABLE LIVE FILTER (services.html)
   User need: "which course suits me / when is it on?" without reading the
   whole table. Rows are filtered as the user types; a polite live region
   (role="status") announces match counts for screen reader users. The whole
   control is hidden under .no-js, so nobody meets a dead input.
   -------------------------------------------------------------------------- */
(function initCourseFilter() {
  const input = document.getElementById('course-filter');
  const table = document.getElementById('course-table');
  const status = document.getElementById('filter-status');
  if (!input || !table || !status) return; // guard: only exists on services.html

  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const total = rows.length;

  status.textContent = `Showing all ${total} courses.`;

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    let shown = 0;

    rows.forEach((row) => {
      const matches = row.textContent.toLowerCase().includes(query);
      row.hidden = !matches; // hidden attr: out of view AND out of the a11y tree
      if (matches) shown += 1;
    });

    if (query === '') {
      status.textContent = `Showing all ${total} courses.`;
    } else if (shown === 0) {
      status.textContent =
        `No courses match "${input.value.trim()}". Clear the filter to see all courses.`;
    } else {
      status.textContent = `${shown} of ${total} courses match.`;
    }
  });
})();

/* --------------------------------------------------------------------------
   4. MICRO-ENHANCEMENT — footer year
   The static "2025" in the HTML is the no-JS fallback; with JS it always
   shows the current year. One line, but it keeps the copyright honest.
   -------------------------------------------------------------------------- */
(function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = String(new Date().getFullYear());
})();