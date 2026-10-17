// Langue de la page (fr par défaut, en pour les pages /en/). t('texte FR', 'English text').
export const LANG = (document.documentElement.lang || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';
export const t = (fr, en) => (LANG === 'en' ? en : fr);
