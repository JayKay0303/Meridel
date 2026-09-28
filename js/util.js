// Petits utilitaires partagés.
export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
export const motionOK = () => !reduceQuery.matches;
export const onMotionChange = (fn) => reduceQuery.addEventListener?.('change', fn);

export const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Exécute fn au plus une fois par frame lors du scroll/resize (écouteurs passifs). */
export function onFrame(fn, { scroll = true, resize = true } = {}) {
  let queued = false;
  const tick = () => { queued = false; fn(); };
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(tick); } };
  if (scroll) window.addEventListener('scroll', request, { passive: true });
  if (resize) window.addEventListener('resize', request, { passive: true });
  request();
  return request;
}

export function debounce(fn, ms = 150) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
