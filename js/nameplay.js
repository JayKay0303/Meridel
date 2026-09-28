// « Votre nom, mis en scène » : le nom saisi est composé dans plusieurs styles,
// puis mis en situation (carte de visite, enseigne, site mobile).
// Rien n'est envoyé ni enregistré ; le texte n'est jamais injecté comme HTML.
import { motionOK } from './util.js';

const CAPTIONS = {
  classique: 'Classique — sobre et intemporel',
  contemporain: 'Contemporain — net et actuel',
  audacieux: 'Audacieux — impossible à manquer',
  naturel: 'Naturel — doux et chaleureux',
  carte: 'Carte de visite — touchez-la pour la retourner',
  enseigne: 'Enseigne — votre nom en façade',
  mobile: 'Site mobile — là où vos clients vous cherchent'
};
const FALLBACK = 'Votre entreprise';

const slugify = (v) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/&/g, '-et-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'votre-entreprise';

export function initNameplay() {
  const root = document.querySelector('[data-nameplay]');
  if (!root) return;
  const input = root.querySelector('[data-np-input]');
  const stage = root.querySelector('[data-np-stage]');
  const text = root.querySelector('[data-np-text]');
  const name = text.parentElement;
  const caption = root.querySelector('[data-np-caption]');
  const card = root.querySelector('[data-np-card]');

  const clean = (v) => v.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').slice(0, 40);

  const render = () => {
    const shown = clean(input.value).trim() || FALLBACK;
    text.textContent = shown;
    name.style.setProperty('--chars', String(Math.max(6, shown.length)));
    stage.style.setProperty('--chars', String(Math.max(6, shown.length)));
    root.querySelectorAll('[data-np-name]').forEach((el) => { el.textContent = shown; });
    root.querySelectorAll('[data-np-slug]').forEach((el) => { el.textContent = slugify(shown); });
    root.querySelectorAll('[data-np-initial]').forEach((el) => { el.textContent = shown.charAt(0).toUpperCase(); });
  };
  input.addEventListener('input', () => {
    const cleaned = clean(input.value);
    if (cleaned !== input.value) input.value = cleaned;
    render();
  });

  // Carte de visite : retournement au clic / toucher (en plus du survol).
  card?.addEventListener('click', () => card.classList.toggle('is-flipped'));

  let timer; let flipTimer; let backTimer;
  root.querySelectorAll('input[name="np-dir"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      const dir = radio.value;
      const apply = () => {
        stage.dataset.dir = dir;
        caption.textContent = CAPTIONS[dir];
        card?.classList.remove('is-flipped');
        clearTimeout(flipTimer); clearTimeout(backTimer);
        // Démonstration : la carte se retourne une fois toute seule.
        if (dir === 'carte' && motionOK()) {
          flipTimer = setTimeout(() => card?.classList.add('is-flipped'), 1200);
          backTimer = setTimeout(() => card?.classList.remove('is-flipped'), 3400);
        }
      };
      if (!motionOK()) { apply(); return; }
      clearTimeout(timer);
      stage.classList.add('is-morphing');
      timer = setTimeout(() => { apply(); requestAnimationFrame(() => stage.classList.remove('is-morphing')); }, 170);
    });
  });
  render();
}
