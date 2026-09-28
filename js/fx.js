// Finitions : titres qui s'allument mot à mot, boutons magnétiques, services,
// méthode horizontale, et transition de fond clair ↔ nuit.
import { clamp, debounce, finePointer, motionOK, onFrame } from './util.js';

function splitWords(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  let i = 0;
  nodes.forEach((node) => {
    const parts = node.textContent.split(/(\s+)/);
    const frag = document.createDocumentFragment();
    parts.forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.append(document.createTextNode(part)); return; }
      const span = document.createElement('span');
      span.className = 'w';
      span.style.setProperty('--i', i++);
      span.textContent = part;
      frag.append(span);
    });
    node.replaceWith(frag);
  });
}

function initWords() {
  const heads = document.querySelectorAll('[data-words]');
  if (!heads.length || !motionOK() || !('IntersectionObserver' in window)) return;
  heads.forEach(splitWords);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-lit'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -18% 0px', threshold: 0.2 });
  heads.forEach((h) => io.observe(h));
}

function initMagnetic() {
  if (!motionOK() || !finePointer()) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    let raf = 0;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const dx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1);
      const dy = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1, 1);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', `${(dx * 6).toFixed(2)}px`);
        el.style.setProperty('--my', `${(dy * 4).toFixed(2)}px`);
      });
    };
    const leave = () => { cancelAnimationFrame(raf); el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
  });
}

function initServices() {
  const root = document.querySelector('[data-services]');
  if (!root) return;
  const btns = [...root.querySelectorAll('.svc__btn')];
  const desktop = window.matchMedia('(min-width: 1024px)');
  const panelOf = (b) => document.getElementById(b.getAttribute('aria-controls'));
  const setOpen = (b, open) => { b.setAttribute('aria-expanded', String(open)); panelOf(b).hidden = !open; };
  const activate = (b) => btns.forEach((x) => setOpen(x, x === b));

  btns.forEach((b) => {
    b.addEventListener('click', () => {
      if (desktop.matches) activate(b);
      else setOpen(b, b.getAttribute('aria-expanded') !== 'true');
    });
    b.addEventListener('mouseenter', () => { if (desktop.matches && finePointer()) activate(b); });
  });
  const normalize = () => {
    if (!desktop.matches) return;
    const open = btns.filter((b) => b.getAttribute('aria-expanded') === 'true');
    activate(open[0] || btns[0]);
  };
  desktop.addEventListener?.('change', normalize);
  normalize();
}

function initMethodeAndTone() {
  const section = document.querySelector('[data-methode]');
  const track = section?.querySelector('[data-methode-track]');
  const steps = section ? [...section.querySelectorAll('.step')] : [];
  const backdrop = document.querySelector('.backdrop');
  const footer = document.querySelector('.site-footer');
  const root = document.documentElement;
  const wide = window.matchMedia('(min-width: 1024px)');
  let extra = 0;

  const horizontal = () => section && wide.matches && motionOK();

  const measure = () => {
    if (!section) return;
    if (horizontal()) {
      track.style.transform = 'none';
      extra = Math.max(0, track.scrollWidth - window.innerWidth);
      track.style.transform = '';
      section.style.setProperty('--methode-extra', `${Math.round(extra)}px`);
    } else {
      extra = 0;
      section.style.removeProperty('--methode-extra');
    }
  };
  measure();
  window.addEventListener('resize', debounce(measure, 150), { passive: true });

  let lastTone = '';
  onFrame(() => {
    const vh = window.innerHeight;
    let o = 0;
    if (section) {
      const r = section.getBoundingClientRect();
      o = clamp((vh * 0.85 - r.top) / (vh * 0.35)) * clamp((r.bottom - vh * 0.15) / (vh * 0.35));
      section.style.setProperty('--np', o.toFixed(3));
      if (horizontal() && extra > 0) {
        const p = clamp(-r.top / extra);
        section.style.setProperty('--mp', p.toFixed(4));
        const active = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999 + 0.35));
        steps.forEach((s, i) => s.classList.toggle('is-active', i <= active && r.top < vh * 0.5));
      } else {
        steps.forEach((s) => {
          const sr = s.getBoundingClientRect();
          s.classList.toggle('is-active', sr.top < vh * 0.7);
        });
      }
    }
    backdrop?.style.setProperty('--night-o', o.toFixed(3));
    let tone = o > 0.5 ? 'night' : '';
    if (footer && footer.getBoundingClientRect().top + 140 < 72) tone = 'night';
    if (tone !== lastTone) { lastTone = tone; if (tone) root.dataset.tone = tone; else delete root.dataset.tone; }
  });
}

export function initFx() {
  initWords();
  initMagnetic();
  initServices();
  initMethodeAndTone();
}
