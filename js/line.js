// La ligne-méridien : un seul tracé SVG qui traverse la page et se dessine au défilement.
// Le tracé est construit et échantillonné analytiquement (sans getPointAtLength) au
// redimensionnement uniquement. Coût par frame : une recherche dichotomique + un stroke-dashoffset.
import { clamp, debounce, motionOK, onFrame } from './util.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const f1 = (n) => Math.round(n * 10) / 10;

/** Constructeur de tracé : produit l'attribut « d » et une liste de points échantillonnés. */
function pathBuilder(x, y, step) {
  let d = `M${f1(x)},${f1(y)}`;
  const pts = [[x, y, 0]]; // x, y, longueur cumulée
  let len = 0;
  let cx = x; let cy = y;
  const push = (px, py) => {
    len += Math.hypot(px - cx, py - cy);
    cx = px; cy = py;
    pts.push([px, py, len]);
  };
  return {
    line(px, py) {
      const n = Math.max(1, Math.ceil(Math.hypot(px - cx, py - cy) / step));
      const x0 = cx; const y0 = cy;
      for (let i = 1; i <= n; i++) push(x0 + ((px - x0) * i) / n, y0 + ((py - y0) * i) / n);
      d += ` L${f1(px)},${f1(py)}`;
    },
    quad(qx, qy, px, py) {
      const x0 = cx; const y0 = cy;
      for (let i = 1; i <= 10; i++) {
        const t = i / 10; const u = 1 - t;
        push(u * u * x0 + 2 * u * t * qx + t * t * px, u * u * y0 + 2 * u * t * qy + t * t * py);
      }
      d += ` Q${f1(qx)},${f1(qy)} ${f1(px)},${f1(py)}`;
    },
    cubic(ax, ay, bx, by, px, py) {
      const x0 = cx; const y0 = cy;
      for (let i = 1; i <= 12; i++) {
        const t = i / 12; const u = 1 - t;
        push(u * u * u * x0 + 3 * u * u * t * ax + 3 * u * t * t * bx + t * t * t * px,
          u * u * u * y0 + 3 * u * u * t * ay + 3 * u * t * t * by + t * t * t * py);
      }
      d += ` C${f1(ax)},${f1(ay)} ${f1(bx)},${f1(by)} ${f1(px)},${f1(py)}`;
    },
    /** Polyligne orthogonale avec coins arrondis (le premier sommet est le point courant). */
    rounded(vertices, r) {
      const all = [[cx, cy], ...vertices];
      for (let i = 1; i < all.length; i++) {
        const [x1, y1] = all[i];
        const next = all[i + 1];
        if (!next) { this.line(x1, y1); break; }
        const [x0, y0] = [cx, cy];
        const [x2, y2] = next;
        const l1 = Math.hypot(x1 - x0, y1 - y0); const l2 = Math.hypot(x2 - x1, y2 - y1);
        const rr = Math.min(r, l1 / 2, l2 / 2);
        if (rr < 0.5 || !l1 || !l2) { this.line(x1, y1); continue; }
        this.line(x1 - ((x1 - x0) / l1) * rr, y1 - ((y1 - y0) / l1) * rr);
        this.quad(x1, y1, x1 + ((x2 - x1) / l2) * rr, y1 + ((y2 - y1) / l2) * rr);
      }
    },
    get d() { return d; },
    get pts() { return pts; },
    get length() { return len; },
    get x() { return cx; },
    get y() { return cy; }
  };
}

export function initLine() {
  const svg = document.querySelector('.meridian');
  const path = svg?.querySelector('.meridian__path');
  const dotsLayer = svg?.querySelector('.meridian__dots');
  const start = document.querySelector('[data-line-start]');
  if (!svg || !path || !start) return;

  let samples = null; // { a, l, runs }
  let total = 0;
  let dots = [];
  let introEnd = 0;
  let introStart = 0;
  const animated = motionOK();

  function build() {
    // --- 1. Lectures (une seule mise en page) -----------------------------
    const W = document.documentElement.clientWidth;
    const docH = document.documentElement.scrollHeight;
    const sx = window.scrollX; const sy = window.scrollY;
    const abs = (el) => { const r = el.getBoundingClientRect(); return { left: r.left + sx, right: r.right + sx, top: r.top + sy, bottom: r.bottom + sy }; };
    const wrap = document.querySelector('.hero .wrap');
    const wr = wrap.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(wrap).paddingLeft);
    const mark = abs(start);
    const fsMark = parseFloat(getComputedStyle(start).fontSize);
    const anchors = [...document.querySelectorAll('[data-line-anchor]')]
      .filter((el) => el.offsetParent !== null)
      .map((el) => {
        const next = el.nextElementSibling;
        return { r: abs(el), nextTop: next ? abs(next).top : null };
      })
      .sort((a, b) => a.r.top - b.r.top);
    const endEl = document.querySelector('.site-footer__copy') || document.querySelector('[data-line-end]');
    const end = endEl ? abs(endEl) : null;

    // --- 2. Construction ----------------------------------------------------
    const small = W < 768;
    const contentL = wr.left + pad;
    const contentR = wr.right - pad;
    const railL = Math.round(contentL - Math.min(40, pad / 2)) + 0.5;
    const railR = Math.round(small ? W - 8 : contentR + Math.min(40, pad / 2)) + 0.5;
    const k = small ? 0.9 : 0.5; // défilement consommé par pixel horizontal
    const yu = Math.round(mark.bottom - fsMark * 0.08) + 0.5;

    const pb = pathBuilder(mark.left, yu, 8);
    const runs = [{ y: yu, x0: mark.left, x1: railR, W: Math.abs(railR - mark.left) * k }];
    const dotSpots = [{ x: mark.left, y: yu, run: 0, frac: 0 }];
    let rail = railR;
    const R = small ? 20 : 48;

    if (!small) {
      const verts = [[railR, yu]];
      anchors.forEach(({ r, nextTop }) => {
        const gap = nextTop !== null ? nextTop - r.bottom : 56;
        const y = Math.round(r.bottom + clamp(gap / 2, 12, 28)) + 0.5;
        const next = rail === railR ? railL : railR;
        verts.push([rail, y], [next, y]);
        runs.push({ y, x0: rail, x1: next, W: Math.abs(next - rail) * k });
        dotSpots.push({ x: r.left, y, run: runs.length - 1, frac: Math.abs(r.left - rail) / Math.abs(next - rail) });
        rail = next;
      });
      if (end) {
        const y = Math.round(end.top) + 0.5;
        verts.push([rail, y], [contentL, y]);
        runs.push({ y, x0: rail, x1: contentL, W: Math.abs(contentL - rail) * k });
        dotSpots.push({ x: contentL, y, run: runs.length - 1, frac: 1 });
      }
      pb.rounded(verts, R);
    } else {
      // Mobile : ligne verticale simple, avec de petites inflexions à hauteur des titres.
      const x = railR; const xi = railR - 7;
      let prevY = yu + 60;
      pb.rounded([[x, yu], [x, prevY]], R);
      anchors.forEach(({ r }) => {
        const top = Math.max(r.top - 12, prevY + 24);
        const bot = Math.max(r.bottom + 12, top + 60);
        pb.line(x, top);
        pb.cubic(x, top + 14, xi, top + 10, xi, top + 24);
        pb.line(xi, bot - 24);
        pb.cubic(xi, bot - 10, x, bot - 14, x, bot);
        prevY = bot;
      });
      if (end) {
        const y = Math.round(end.top) + 0.5;
        pb.rounded([[x, y], [contentL, y]], R);
        runs.push({ y, x0: x, x1: contentL, W: Math.abs(contentL - x) * k });
        dotSpots.push({ x: contentL, y, run: runs.length - 1, frac: 1 });
      }
    }

    // --- 3. Activation : y + défilement réservé aux passages horizontaux -----
    const pts = pb.pts;
    const n = pts.length;
    const a = new Float32Array(n); const l = new Float32Array(n);
    let acc = 0; let runIdx = 0; let onRun = false; let prevA = -Infinity;
    for (let i = 0; i < n; i++) {
      const [px, py, len] = pts[i];
      const run = runs[runIdx];
      const inRun = run && Math.abs(py - run.y) < 0.6 &&
        px >= Math.min(run.x0, run.x1) - 1 && px <= Math.max(run.x0, run.x1) + 1;
      let v;
      if (inRun) {
        onRun = true;
        v = run.y + acc + (Math.abs(px - run.x0) / Math.max(1, Math.abs(run.x1 - run.x0))) * run.W;
      } else {
        if (onRun) { acc += run.W; runIdx++; onRun = false; }
        v = py + acc;
      }
      v = Math.max(v, prevA);
      a[i] = v; l[i] = len; prevA = v;
    }
    total = pb.length + 2;
    samples = { a, l, runs };
    let accW = 0;
    const runAcc = runs.map((r) => { const v = accW; accW += r.W; return v; });
    introEnd = runs[0].y + runs[0].W;

    // --- 4. Écritures -------------------------------------------------------
    svg.style.height = `${docH}px`;
    svg.setAttribute('width', W);
    svg.setAttribute('height', docH);
    path.setAttribute('d', pb.d);
    path.style.strokeDasharray = `${total}`;
    dotsLayer.replaceChildren();
    dots = dotSpots.map((s) => {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', f1(s.x)); c.setAttribute('cy', s.y); c.setAttribute('r', 3.5);
      dotsLayer.append(c);
      const run = runs[s.run];
      return { el: c, a: run.y + runAcc[s.run] + s.frac * run.W };
    });
    update();
  }

  function lengthAt(A) {
    const { a, l } = samples;
    if (A <= a[0]) return 0;
    if (A >= a[a.length - 1]) return total;
    let lo = 0; let hi = a.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (a[mid] <= A) lo = mid; else hi = mid; }
    const t = (A - a[lo]) / Math.max(1e-6, a[hi] - a[lo]);
    return l[lo] + t * (l[hi] - l[lo]);
  }

  function update() {
    if (!samples) return;
    let A;
    if (!animated) {
      A = Infinity;
    } else {
      const vh = window.innerHeight;
      const s = window.scrollY;
      const maxS = document.documentElement.scrollHeight - vh;
      const T = s + vh * 0.7;
      A = T;
      for (const r of samples.runs) A += clamp(T - r.y, 0, r.W);
      // En bas de page, la ligne se termine : elle « signe » le pied de page.
      const endP = clamp((s - (maxS - vh * 0.5)) / (vh * 0.5));
      const aEnd = samples.a[samples.a.length - 1];
      if (aEnd > A) A += (aEnd - A) * endP;
      // Introduction : le soulignement du titre se trace au chargement.
      const t = clamp((performance.now() - introStart) / 1100);
      const ease = 1 - Math.pow(1 - t, 3);
      A = Math.max(A, samples.a[0] + (introEnd - samples.a[0]) * ease);
      if (t < 1) requestAnimationFrame(update);
    }
    const L = lengthAt(A);
    path.style.strokeDashoffset = `${(total - L).toFixed(1)}`;
    for (const d of dots) d.el.classList.toggle('is-lit', A >= d.a);
  }

  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1));
  const ready = document.fonts?.ready ?? Promise.resolve();
  Promise.race([ready, new Promise((r) => setTimeout(r, 1500))]).then(() => {
    idle(() => {
      introStart = performance.now();
      build();
      onFrame(update, { resize: false });
      const rebuild = debounce(build, 200);
      let lastW = window.innerWidth; let lastH = document.documentElement.scrollHeight;
      if ('ResizeObserver' in window) {
        new ResizeObserver(() => {
          const w = window.innerWidth; const h = document.documentElement.scrollHeight;
          if (w !== lastW || Math.abs(h - lastH) > 2) { lastW = w; lastH = h; rebuild(); }
        }).observe(document.body);
      } else {
        window.addEventListener('resize', rebuild, { passive: true });
      }
    }, { timeout: 1200 });
  });
}
