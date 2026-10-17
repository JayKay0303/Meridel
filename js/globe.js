// Globe de l'accueil : une sphère de points qui tourne jusqu'à Genève, puis le méridien
// de Méridel se trace d'un pôle à l'autre. Décoratif, léger (canvas 2D, aucune librairie),
// mis en pause hors écran, immobile si le visiteur préfère réduire les animations.
import { motionOK } from './util.js';

const D = Math.PI / 180;
const GENEVA = { lat: 46.2044 * D, lon: 6.1432 * D };
const TILT = 24 * D;            // inclinaison : Genève apparaît au-dessus du centre
const SPIN = 3200;              // durée de la rotation d'arrivée (ms)
const TRACE = 1100;             // durée du tracé du méridien (ms)
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Points répartis régulièrement sur la sphère (spirale de Fibonacci).
function spherePoints(n) {
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    const phi = i * golden;
    pts.push([Math.asin(y), Math.atan2(Math.sin(phi) * r, Math.cos(phi) * r)]);
  }
  return pts;
}

export function initGlobe() {
  const canvas = document.querySelector('[data-globe]');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;
  const figure = canvas.closest('.globe');
  const css = getComputedStyle(document.documentElement);
  const color = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
  const INK = color('--ink', '#111A22');
  const EMBER = color('--ember', '#D9693F');
  const LAKE = color('--lake-soft', '#5E8A90');
  const POINTS = spherePoints(window.innerWidth < 768 ? 560 : 820);
  const animated = motionOK();

  let size = 0; let dpr = 1;
  let start = 0; let visible = true; let raf = 0;

  function resize() {
    const w = canvas.clientWidth;
    if (!w) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    size = w;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(w * dpr);
  }

  // Projection orthographique centrée sur (TILT, lon0).
  function project(lat, lon, lon0, R) {
    const dl = lon - lon0;
    const cosLat = Math.cos(lat);
    const z = Math.sin(TILT) * Math.sin(lat) + Math.cos(TILT) * cosLat * Math.cos(dl);
    const x = R * cosLat * Math.sin(dl);
    const y = -R * (Math.cos(TILT) * Math.sin(lat) - Math.sin(TILT) * cosLat * Math.cos(dl));
    return [x, y, z];
  }

  function line(points, lon0, R, cx, cy) {
    let open = false;
    ctx.beginPath();
    for (const [lat, lon] of points) {
      const [x, y, z] = project(lat, lon, lon0, R);
      if (z < 0) { open = false; continue; }
      if (open) ctx.lineTo(cx + x, cy + y); else { ctx.moveTo(cx + x, cy + y); open = true; }
    }
    ctx.stroke();
  }

  function draw(now) {
    const t = animated ? now - start : SPIN + TRACE + 1;
    const spin = Math.min(1, t / SPIN);
    const lon0 = GENEVA.lon - (1 - easeInOut(spin)) * 220 * D;
    const done = t > SPIN + 2600 * 3;  // trois ondes, puis le globe se pose
    const trace = animated ? easeOut(Math.min(1, Math.max(0, (t - SPIN + 300) / TRACE))) : 1;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const R = size * 0.46; const cx = size / 2; const cy = size / 2;

    // Contour et graticule très discrets
    ctx.lineWidth = 1;
    ctx.strokeStyle = INK; ctx.globalAlpha = 0.16;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.07;
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts = []; for (let lon = -180; lon <= 180; lon += 4) pts.push([lat * D, lon * D]);
      line(pts, lon0, R, cx, cy);
    }
    for (let lon = -180; lon < 180; lon += 30) {
      const pts = []; for (let lat = -90; lat <= 90; lat += 4) pts.push([lat * D, lon * D]);
      line(pts, lon0, R, cx, cy);
    }

    // Nuage de points : plus marqué au premier plan
    ctx.fillStyle = INK;
    for (const [lat, lon] of POINTS) {
      const [x, y, z] = project(lat, lon, lon0, R);
      if (z <= 0.02) continue;
      ctx.globalAlpha = 0.08 + z * 0.32;
      ctx.beginPath(); ctx.arc(cx + x, cy + y, 0.6 + z * 0.9, 0, Math.PI * 2); ctx.fill();
    }

    // Le méridien de Genève, tracé du pôle Nord vers le pôle Sud
    if (trace > 0) {
      const pts = [];
      const end = -90 + 180 * trace;
      for (let lat = 90; lat >= 90 - (end + 90); lat -= 1.5) pts.push([lat * D, GENEVA.lon]);
      ctx.globalAlpha = 1; ctx.strokeStyle = EMBER; ctx.lineWidth = 1.5;
      line(pts, lon0, R, cx, cy);
    }

    // Genève : un point, et une onde lente une fois arrivé
    const [gx, gy, gz] = project(GENEVA.lat, GENEVA.lon, lon0, R);
    if (gz > 0) {
      if (spin >= 1 && animated && !done) {
        const p = ((t - SPIN) % 2600) / 2600;
        ctx.globalAlpha = (1 - p) * 0.55; ctx.strokeStyle = EMBER; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx + gx, cy + gy, 4 + p * 18, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.fillStyle = EMBER;
      ctx.beginPath(); ctx.arc(cx + gx, cy + gy, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = LAKE; ctx.globalAlpha = 0.9; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx + gx, cy + gy, 7, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (t > SPIN + TRACE) figure?.classList.add('is-arrived');
    if (animated && visible && !done) raf = requestAnimationFrame(draw);
  }

  resize();
  if ('ResizeObserver' in window) new ResizeObserver(() => { resize(); cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }).observe(canvas);
  if ('IntersectionObserver' in window && animated) {
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(draw);
    }).observe(canvas);
  }
  start = performance.now();
  raf = requestAnimationFrame(draw);
}
