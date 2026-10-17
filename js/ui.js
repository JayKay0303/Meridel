// Comparateur avant / après de l'accueil, et bouton WhatsApp flottant.
import { motionOK } from './util.js';

function initCompare() {
  const root = document.querySelector('[data-compare]');
  const range = root?.querySelector('[data-compare-range]');
  if (!range) return;
  const set = (v) => root.style.setProperty('--x', `${v}%`);
  // Introduction : la ligne balaie l'ancien site pour révéler le nouveau (CSS), puis la main passe au visiteur.
  if (motionOK()) root.classList.add('is-intro');
  root.addEventListener('animationend', () => { root.classList.remove('is-intro'); set(range.value); }, { once: true });
  range.addEventListener('input', () => { root.classList.remove('is-intro'); root.classList.add('is-touched'); set(range.value); });
  set(range.value);
}

function initFab() {
  const fab = document.querySelector('[data-wa-fab]');
  if (!fab || !('IntersectionObserver' in window)) return;
  // Le bouton se retire quand un autre accès WhatsApp est déjà visible (fin de page, formulaire de contact).
  const targets = [...document.querySelectorAll('.cta-band, [data-contact], .site-footer')];
  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    fab.classList.toggle('is-away', visible.size > 0);
  }, { threshold: 0.15 });
  targets.forEach((t) => io.observe(t));
  requestAnimationFrame(() => fab.classList.add('is-ready'));
}

export function initUi() {
  initCompare();
  initFab();
}
