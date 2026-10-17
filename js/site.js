// Point d'entrée commun à toutes les pages : chaque module se désactive proprement
// s'il ne trouve pas sa cible sur la page courante.
import { initNav } from './nav.js';
import { initLine } from './line.js';
import { initNameplay } from './atelier.js?v=20261017';
import { initQuiz } from './quiz-atelier.js?v=20261017';
import { initContact } from './contact-atelier.js?v=20261017';
import { initGlobe } from './globe.js?v=20261017';
import { initFx } from './fx.js';
import { motionOK } from './util.js';

if (motionOK()) document.documentElement.classList.add('motion-ok');

// Un module défaillant ne doit pas bloquer les autres.
const run = (fn) => { try { fn(); } catch (err) { console.error(err); } };

run(initNav);
run(initFx);
run(initGlobe);
run(initNameplay);
run(initQuiz);
run(initContact);
// La ligne se calcule une fois la mise en page stabilisée (polices chargées).
run(initLine);
