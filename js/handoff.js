// Passage d'informations vers la page Contact (offre choisie, questionnaire, atelier).
// Stocké uniquement dans l'onglet du visiteur (sessionStorage), jamais envoyé.
const KEY = 'meridel-contact';

export function readHandoff() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || 'null') || {}; } catch { return {}; }
}

export function saveHandoff(data) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ ...readHandoff(), ...data })); } catch { /* stockage indisponible : le lien ?offre= suffit */ }
}

export function clearHandoff() {
  try { sessionStorage.removeItem(KEY); } catch { /* rien */ }
}
