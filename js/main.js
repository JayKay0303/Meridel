// Point d'entrée : chaque module est indépendant et se désactive proprement s'il manque sa cible.
import { initNav } from './nav.js';
import { initLine } from './line.js';
import { initNameplay } from './nameplay.js';
import { initQuiz } from './quiz.js';
import { initContact } from './contact.js';
import { initFx } from './fx.js';
import { motionOK } from './util.js';

if (motionOK()) document.documentElement.classList.add('motion-ok');

// Un module défaillant ne doit pas bloquer les autres.
const run = (fn) => { try { fn(); } catch (err) { console.error(err); } };

run(initNav);
run(initFx);
run(initNameplay);
run(initQuiz);
run(initContact);
// La ligne se calcule une fois la mise en page stabilisée (polices chargées).
run(initLine);
