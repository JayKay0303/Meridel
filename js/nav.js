// En-tête : menu mobile plein écran (focus piégé, Échap), masquage au défilement, lien actif.
import { onFrame } from './util.js';

export function initNav() {
  const header = document.querySelector('[data-header]');
  if (!header) return;
  const toggle = header.querySelector('[data-menu-toggle]');
  const nav = header.querySelector('#nav');
  const root = document.documentElement;
  const desktop = window.matchMedia('(min-width: 1024px)');

  // --- Menu mobile -------------------------------------------------------
  const focusables = () => [toggle, ...nav.querySelectorAll('a[href], button:not([disabled])')];
  const isOpen = () => toggle && toggle.getAttribute('aria-expanded') === 'true';

  function setOpen(open, { restoreFocus = true } = {}) {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.menu-toggle__label').textContent = open ? 'Fermer' : 'Menu';
    nav.classList.toggle('is-open', open);
    root.classList.toggle('menu-open', open);
    header.classList.remove('is-hidden');
    if (open) {
      requestAnimationFrame(() => nav.querySelector('a[href]')?.focus());
    } else if (restoreFocus) {
      toggle.focus();
    }
  }

  toggle?.addEventListener('click', () => setOpen(!isOpen()));
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a[href]') && isOpen()) setOpen(false, { restoreFocus: false });
  });
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
    if (e.key === 'Tab') {
      const items = focusables().filter((el) => el.offsetParent !== null || el === toggle);
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  desktop.addEventListener?.('change', (e) => { if (e.matches && isOpen()) setOpen(false, { restoreFocus: false }); });

  // --- Masquage au défilement -------------------------------------------
  let lastY = window.scrollY;
  onFrame(() => {
    const y = window.scrollY;
    const dy = y - lastY;
    header.classList.toggle('is-scrolled', y > 8);
    const focusInside = header.contains(document.activeElement) && document.activeElement !== document.body;
    if (isOpen() || focusInside || y < 120) header.classList.remove('is-hidden');
    else if (dy > 6) header.classList.add('is-hidden');
    else if (dy < -6) header.classList.remove('is-hidden');
    lastY = y;
  }, { resize: false });

  // --- Lien de section actif --------------------------------------------
  const links = [...header.querySelectorAll('.nav__link[href^="#"]')];
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const sections = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = byId.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach((l) => l.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'true');
        } else if (link.getAttribute('aria-current')) {
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));
  }
}
