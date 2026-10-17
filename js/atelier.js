import { saveHandoff } from './handoff.js';

// Atelier d'identité : typographie, couleur et signe distinctif dessiné à partir du nom saisi.
// Le texte saisi est toujours inséré via textContent. Rien n'est envoyé ni enregistré.
const NS = 'http://www.w3.org/2000/svg';
const FONTS = {
  classique: ['Fraunces, Georgia, serif', 440, 'Classique'],
  contemporain: ['Inter Tight, Arial, sans-serif', 500, 'Contemporain'],
  audacieux: ['Inter Tight, Arial, sans-serif', 600, 'Audacieux'],
  naturel: ['Fraunces Soft, Georgia, serif', 450, 'Naturel']
};
const COLORS = {
  encre: ['#111A22', 'Encre'], leman: ['#1F4E5A', 'Léman'], terre: ['#9B4327', 'Terre cuite'],
  foret: ['#365743', 'Forêt'], prune: ['#67415C', 'Prune'], cobalt: ['#304F9B', 'Cobalt']
};
const SYMBOLS = {
  none: 'Aucun', monogram: 'Initiales', sceau: 'Sceau', taille: 'Taille',
  entrelacs: 'Entrelacs', rythme: 'Rythme', trace: 'Tracé', ecusson: 'Écusson'
};

const node = (tag, attrs = {}, text) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text) el.textContent = text;
  return el;
};

// Empreinte stable du nom : même nom + même variante = même dessin.
function hash(str) {
  let h = 2166136261;
  for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const plain = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const words = (s) => s.split(/[\s'’\-]+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
const firstLetter = (w) => Array.from(w).find((c) => /[\p{L}\p{N}]/u.test(c)) || '';

// Chaque signe se dessine dans un carré de 64 × 64.
function drawMark(kind, ctx) {
  const { name, color, font, weight, soft, seed, uid } = ctx;
  const ws = words(name);
  const initials = (ws.length > 1 ? ws.slice(0, 2).map(firstLetter) : [firstLetter(ws[0] || 'M')]).join('').toLocaleUpperCase('fr');
  const first = initials[0] || 'M';
  const second = ws.length > 1 ? firstLetter(ws[1]).toLocaleUpperCase('fr') : (Array.from(plain(name)).pop() || first).toLocaleUpperCase('fr');
  const letters = Array.from(plain(name) || 'meridel');
  const h = hash(plain(name) + '|' + seed);
  const pick = (n, shift = 0) => ((h >>> shift) % n + n) % n;
  const letter = (text, size, attrs = {}) => {
    const t = node('text', { x: 32, y: 32, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': size, fill: color, ...attrs }, text);
    t.style.fontFamily = font;
    t.style.fontVariationSettings = `"wght" ${weight}, "opsz" 72, "SOFT" ${soft}`;
    return t;
  };
  const stroke = { fill: 'none', stroke: color, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  const out = [];

  if (kind === 'monogram') {
    out.push(node('circle', { cx: 32, cy: 32, r: 29, ...stroke, 'stroke-width': 1.6 }));
    out.push(letter(initials, initials.length > 1 ? 24 : 32));
  }

  if (kind === 'sceau') {
    // Le nom fait le tour du sceau ; l'initiale au centre.
    const r = 24.5, circ = 2 * Math.PI * r;
    const base = name.toLocaleUpperCase('fr');
    let ring = base + ' · ';
    while (ring.length < 26) ring += base + ' · ';
    const size = Math.min(6.4, circ / (ring.length * 0.78));
    const start = pick(360);
    out.push(node('circle', { cx: 32, cy: 32, r: 30.5, ...stroke, 'stroke-width': 1.4 }));
    out.push(node('circle', { cx: 32, cy: 32, r: 18, ...stroke, 'stroke-width': 0.8 }));
    const pathId = `ring-${uid}`;
    const defs = node('defs');
    defs.append(node('path', { id: pathId, d: `M32 ${32 - r}a${r} ${r} 0 1 1 -0.01 0` }));
    out.push(defs);
    const t = node('text', { 'font-size': size, fill: color, 'letter-spacing': 0.4, transform: `rotate(${start} 32 32)` });
    t.style.fontFamily = 'Inter Tight, Arial, sans-serif';
    t.style.fontVariationSettings = '"wght" 560';
    const tp = node('textPath', { href: `#${pathId}`, textLength: (circ * 0.985).toFixed(1), lengthAdjust: 'spacing', 'dominant-baseline': 'central' }, ring);
    t.append(tp);
    out.push(t);
    out.push(letter(first, 20));
  }

  if (kind === 'taille') {
    // L'initiale tranchée par une ligne, les deux moitiés légèrement décalées.
    const angles = [0, 14, -14, 28, -28, 90];
    const a = angles[pick(angles.length)] * Math.PI / 180;
    const dx = Math.sin(a), dy = -Math.cos(a);
    const nx = Math.cos(a), ny = Math.sin(a);
    const far = 120;
    const p1 = [32 - dx * far, 32 - dy * far], p2 = [32 + dx * far, 32 + dy * far];
    const side = (s) => [p1, p2, [p2[0] + s * nx * far, p2[1] + s * ny * far], [p1[0] + s * nx * far, p1[1] + s * ny * far]].map((p) => p.map((v) => v.toFixed(2)).join(',')).join(' ');
    const defs = node('defs');
    const cA = node('clipPath', { id: `ca-${uid}` }); cA.append(node('polygon', { points: side(-1) }));
    const cB = node('clipPath', { id: `cb-${uid}` }); cB.append(node('polygon', { points: side(1) }));
    defs.append(cA, cB);
    out.push(defs);
    const shift = 3.2;
    const gA = node('g', { 'clip-path': `url(#ca-${uid})` }); gA.append(letter(first, 60));
    const gB = node('g', { 'clip-path': `url(#cb-${uid})`, transform: `translate(${(dx * shift).toFixed(2)} ${(dy * shift).toFixed(2)})` }); gB.append(letter(first, 60));
    out.push(gA, gB);
    const len = 30;
    out.push(node('line', { x1: 32 - dx * len, y1: 32 - dy * len, x2: 32 + dx * len, y2: 32 + dy * len, ...stroke, 'stroke-width': 0.9 }));
    out.push(node('circle', { cx: 32 + dx * len, cy: 32 + dy * len, r: 2.2, fill: color }));
  }

  if (kind === 'entrelacs') {
    // Deux lettres qui se croisent : l'une pleine, l'autre en contour.
    const t1 = letter(first, 46, { x: 24 });
    const t2 = letter(second, 46, { x: 40, fill: 'none', stroke: color, 'stroke-width': 1.3 });
    out.push(t1, t2);
  }

  if (kind === 'rythme') {
    // Une barre par lettre : la hauteur vient de la lettre elle-même.
    const src = letters.slice(0, 7);
    while (src.length < 4) src.push(...letters);
    const bars = src.slice(0, 7);
    const n = bars.length, gap = 3, w = (58 - gap * (n - 1)) / n;
    bars.forEach((c, i) => {
      const code = c.charCodeAt(0) * (seed + 3) + i * 7;
      const hgt = 16 + (code % 11) * 4;
      out.push(node('rect', { x: (3 + i * (w + gap)).toFixed(2), y: (60 - hgt).toFixed(2), width: w.toFixed(2), height: hgt, rx: (w / 2).toFixed(2), fill: color, opacity: i === pick(n, 3) ? 1 : 0.88 }));
    });
    const hi = pick(n, 3);
    out.push(node('circle', { cx: (3 + hi * (w + gap) + w / 2).toFixed(2), cy: 4.5, r: Math.min(w / 2, 3.2).toFixed(2), fill: color }));
  }

  if (kind === 'trace') {
    // Chaque lettre devient un point ; la ligne les relie et finit sur un point.
    const src = letters.slice(0, 6);
    while (src.length < 4) src.push(...letters);
    const pts = src.slice(0, 6).map((c, i, arr) => [6 + i * (52 / (arr.length - 1)), 8 + ((c.charCodeAt(0) * (seed * 2 + 7) + i * 13) % 48)]);
    out.push(node('polyline', { points: pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' '), ...stroke, 'stroke-width': 2 }));
    const [sx, sy] = pts[0], [ex, ey] = pts[pts.length - 1];
    out.push(node('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 1.8, fill: color }));
    out.push(node('circle', { cx: ex.toFixed(1), cy: ey.toFixed(1), r: 3.6, fill: color }));
  }

  if (kind === 'ecusson') {
    // Une forme architecturale, choisie d'après le nom, qui abrite l'initiale.
    const shapes = [
      'M10 60V30a22 22 0 0 1 44 0v30Z',
      'M32 3L61 32L32 61L3 32Z',
      'M32 3L57 17.5V46.5L32 61L7 46.5V17.5Z',
      'M8 4H56V40Q56 56 32 61Q8 56 8 40Z',
      'M14 4H50A10 10 0 0 1 60 14V50A10 10 0 0 1 50 60H14A10 10 0 0 1 4 50V14A10 10 0 0 1 14 4Z'
    ];
    const s = pick(shapes.length);
    out.push(node('path', { d: shapes[s], ...stroke, 'stroke-width': 1.6 }));
    out.push(letter(first, s === 1 ? 26 : 30, { y: s === 0 ? 40 : s === 3 ? 30 : 32 }));
  }
  return out;
}

export function initNameplay() {
  const root = document.querySelector('[data-nameplay]');
  if (!root) return;
  const input = root.querySelector('[data-np-input]');
  const defaults = { font: 'classique', color: 'encre', symbol: 'none', layout: 'inline', view: 'logo', spacing: 0, seed: 1 };
  const state = { ...defaults };
  const clean = (v) => v.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').slice(0, 40).trim();
  const name = () => clean(input.value) || 'Votre entreprise';
  const thumbs = [...root.querySelectorAll('[data-mark]')];
  let frame = 0;

  function ctxFor(uid) {
    const [font, weight] = FONTS[state.font];
    return { name: name(), color: COLORS[state.color][0], font, weight, soft: state.font === 'naturel' ? 100 : 0, seed: state.seed, uid };
  }

  function render() {
    const shown = name();
    const [font, weight, fontLabel] = FONTS[state.font];
    const [color, colorLabel] = COLORS[state.color];
    root.style.setProperty('--brand', color);
    root.querySelector('[data-color-name]').textContent = colorLabel;
    root.querySelector('[data-logo-status]').textContent = `${fontLabel} · ${colorLabel} · ${SYMBOLS[state.symbol]}`;
    root.querySelector('[data-card-name]').textContent = shown;
    root.querySelector('[data-phone-name]').textContent = shown;
    root.querySelectorAll('[data-scene]').forEach((el) => { el.hidden = el.dataset.scene !== state.view; });

    // Vignettes du choix de signe : chaque proposition est dessinée pour ce nom.
    thumbs.forEach((svg, i) => svg.replaceChildren(...drawMark(svg.dataset.mark, ctxFor(`t${i}`))));

    root.querySelectorAll('.atelier__logo').forEach((svg, i) => {
      svg.setAttribute('aria-label', `Logo ${shown}, ${fontLabel}, ${colorLabel}, ${SYMBOLS[state.symbol]}`);
      const text = svg.querySelector('[data-logo-text]');
      const group = svg.querySelector('[data-logo-symbol]');
      const has = state.symbol !== 'none';
      const stack = has && state.layout === 'stack';
      text.textContent = state.font === 'audacieux' ? shown.toLocaleUpperCase('fr') : shown;
      text.style.fontFamily = font;
      text.style.fontWeight = weight;
      text.style.fontVariationSettings = `"wght" ${weight}, "opsz" 72, "SOFT" ${state.font === 'naturel' ? 100 : 0}`;
      text.style.letterSpacing = state.spacing + 'px';
      text.style.fontSize = (stack ? 48 : 60) + 'px';
      text.setAttribute('y', stack ? '155' : '112');
      text.setAttribute('fill', color);
      text.setAttribute('x', '300');
      text.setAttribute('text-anchor', 'middle');
      group.replaceChildren();
      const base = stack ? 48 : 60;
      const available = has && !stack ? 440 : 548;
      const measured = text.getComputedTextLength();
      const size = measured > available ? base * available / measured : base;
      text.style.fontSize = size + 'px';
      if (has) {
        group.append(...drawMark(state.symbol, ctxFor(`l${i}`)));
        if (stack) {
          group.setAttribute('transform', 'translate(264.8 12) scale(1.1)');
        } else {
          // Signe et nom forment un seul bloc centré.
          const mark = 76, gap = 22, width = Math.min(measured, available);
          const startX = 300 - (mark + gap + width) / 2;
          group.setAttribute('transform', `translate(${startX.toFixed(1)} ${(92 - mark / 2).toFixed(1)}) scale(${(mark / 64).toFixed(3)})`);
          text.setAttribute('text-anchor', 'start');
          text.setAttribute('x', (startX + mark + gap).toFixed(1));
          text.setAttribute('y', '112');
        }
      }
    });
  }

  const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(render); };
  input.addEventListener('input', schedule);
  root.addEventListener('change', (e) => {
    if (e.target.type === 'radio' && e.target.name.startsWith('logo-')) {
      state[e.target.name.slice(5)] = e.target.value;
      if (e.target.name === 'logo-view') resetFlip();
      render();
    }
  });
  root.querySelector('#logo-spacing').addEventListener('input', (e) => { state.spacing = Number(e.target.value); render(); });

  // « Autres variantes » : redessine les signes avec une autre graine.
  const variants = root.querySelector('[data-variants]');
  variants?.addEventListener('click', () => {
    state.seed = state.seed % 97 + 1;
    if (state.symbol === 'none') { state.symbol = 'trace'; sync(); } else render();
  });

  const flip = root.querySelector('[data-flip]');
  function resetFlip() {
    flip.classList.remove('is-flipped');
    flip.setAttribute('aria-pressed', 'false');
    flip.querySelector('.atelier__card-front').setAttribute('aria-hidden', 'false');
    flip.querySelector('.atelier__card-back').setAttribute('aria-hidden', 'true');
  }
  flip.addEventListener('click', () => {
    const on = flip.classList.toggle('is-flipped');
    flip.setAttribute('aria-pressed', String(on));
    flip.querySelector('.atelier__card-front').setAttribute('aria-hidden', String(on));
    flip.querySelector('.atelier__card-back').setAttribute('aria-hidden', String(!on));
  });

  function sync() {
    for (const [k, v] of Object.entries(state)) {
      const el = root.querySelector(`input[name="logo-${k}"][value="${v}"]`);
      if (el) el.checked = true;
    }
    root.querySelector('#logo-spacing').value = state.spacing;
    resetFlip();
    render();
  }

  const presets = [
    ['naturel', 'foret', 'trace', 'inline'], ['contemporain', 'leman', 'sceau', 'stack'],
    ['audacieux', 'terre', 'taille', 'inline'], ['classique', 'prune', 'entrelacs', 'stack'],
    ['contemporain', 'cobalt', 'rythme', 'inline'], ['classique', 'encre', 'ecusson', 'stack']
  ];
  let preset = 0;
  root.querySelector('[data-inspire]').addEventListener('click', () => {
    [state.font, state.color, state.symbol, state.layout] = presets[preset++ % presets.length];
    state.spacing = 0;
    state.seed = 1 + Math.floor(Math.random() * 97);
    sync();
  });
  root.querySelector('[data-logo-reset]').addEventListener('click', () => { Object.assign(state, defaults); sync(); });

  // « Partir de cette idée » : la piste choisie suit le visiteur jusqu'à la page Contact.
  document.querySelector('[data-logo-contact]')?.addEventListener('click', () => {
    const sign = state.symbol === 'none' ? 'sans signe' : `signe ${SYMBOLS[state.symbol]} (variante ${state.seed})`;
    const summary = `Piste d’identité : ${name()} · ${FONTS[state.font][2]} · ${COLORS[state.color][1]} · ${sign} · ${state.layout === 'stack' ? 'empilée' : 'en ligne'}.`;
    saveHandoff({ logo: summary, ...(clean(input.value) ? { company: clean(input.value) } : {}) });
  });

  render();
  document.fonts?.ready.then(schedule);
  document.fonts?.addEventListener('loadingdone', schedule);
}
