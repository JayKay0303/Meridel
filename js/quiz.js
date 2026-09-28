// « Votre projet en 30 secondes » : 4 questions → une formule recommandée,
// puis le formulaire de contact est prérempli. Rien n'est envoyé ni enregistré.
import { motionOK } from './util.js';

const PLANS = [
  { key: 'landing', name: 'Landing Page', price: 'dès CHF 490', delay: '5–7 jours ouvrés',
    why: 'Une page claire suffit pour présenter l’essentiel et être joignable rapidement.' },
  { key: 'business', name: 'Site Business', price: 'CHF 790–990', delay: '10–15 jours ouvrés',
    why: 'Plusieurs pages pour détailler vos services et inspirer confiance.' },
  { key: 'signature', name: 'Signature', price: 'CHF 1’490–1’990', delay: '15–25 jours ouvrés',
    why: 'Une direction artistique approfondie, pour une image qui vous distingue.' }
];

export function initQuiz() {
  const form = document.querySelector('[data-quiz]');
  if (!form) return;
  const steps = [...form.querySelectorAll('.quiz__step')];
  const bars = [...form.querySelectorAll('.quiz__progress span')];
  const prev = form.querySelector('[data-quiz-prev]');
  const next = form.querySelector('[data-quiz-next]');
  const nav = form.querySelector('[data-quiz-nav]');
  const status = form.querySelector('[data-quiz-status]');
  const result = form.querySelector('[data-quiz-result]');
  let current = 0;

  const answered = (i) => !!steps[i].querySelector('input:checked');

  function show(i) {
    current = i;
    steps.forEach((st, k) => {
      st.classList.toggle('is-active', k === i);
      st.hidden = k !== i;
    });
    bars.forEach((b, k) => b.classList.toggle('is-on', k <= i));
    prev.disabled = i === 0;
    next.disabled = !answered(i);
    next.firstChild.textContent = i === steps.length - 1 ? 'Voir ma recommandation ' : 'Continuer ';
    status.textContent = `Étape ${i + 1} sur ${steps.length}`;
    const legend = steps[i].querySelector('legend');
    if (document.activeElement && form.contains(document.activeElement)) legend?.focus({ preventScroll: true });
  }

  function answers() {
    const get = (name) => form.querySelector(`input[name="${name}"]:checked`);
    return ['activite', 'objectif', 'contenu', 'calendrier'].reduce((o, n) => {
      const el = get(n);
      o[n] = el ? { value: el.value, label: el.dataset.label } : null;
      return o;
    }, {});
  }

  function recommend(a) {
    let level = a.contenu && a.contenu.value !== '' ? Number(a.contenu.value) : 1;
    if (a.objectif?.value === 'image') level = 2;
    const plan = PLANS[level];
    const reasons = [plan.why];
    if (a.objectif?.value === 'reservation') {
      reasons.push(level === 2 ? 'L’intégration d’un outil de réservation est incluse.' : 'Option conseillée : intégration d’un outil de réservation (dès CHF 150).');
    }
    if (a.objectif?.value === 'local') reasons.push('Option conseillée : optimisation de votre fiche Google Business Profile (dès CHF 190).');
    if (a.contenu?.value === '') reasons.push('Le nombre de pages se précise ensemble, au devis.');
    const when = a.calendrier?.value;
    reasons.push(when === 'plus' || when === 'libre'
      ? `Délai indicatif : ${plan.delay}, à votre rythme.`
      : `Délai indicatif : ${plan.delay} dès réception de vos contenus.`);
    return { plan, reasons };
  }

  function finish() {
    const a = answers();
    const { plan, reasons } = recommend(a);
    form.querySelector('[data-quiz-plan]').textContent = plan.name;
    form.querySelector('[data-quiz-price]').textContent = plan.price;
    const ul = form.querySelector('[data-quiz-why]');
    ul.replaceChildren(...reasons.map((r) => { const li = document.createElement('li'); li.textContent = r; return li; }));
    steps.forEach((st) => { st.hidden = true; st.classList.remove('is-active'); });
    bars.forEach((b) => b.classList.add('is-on'));
    nav.hidden = true;
    result.hidden = false;
    result.dataset.plan = plan.key;
    result.dataset.summary = `Questionnaire : ${a.activite?.label} · ${a.objectif?.label} · ${a.contenu?.label} · ${a.calendrier?.label}.`;
    result.focus({ preventScroll: true });
    if (motionOK()) result.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.2,.7,0,1)' });
  }

  form.addEventListener('change', (e) => {
    if (e.target.matches('input[type="radio"]')) next.disabled = false;
  });
  // Double-clic ou Entrée sur une option : on avance directement.
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input[type="radio"]') && answered(current)) { e.preventDefault(); next.click(); }
  });
  next.addEventListener('click', () => {
    if (!answered(current)) return;
    if (current < steps.length - 1) show(current + 1); else finish();
  });
  prev.addEventListener('click', () => { if (current > 0) show(current - 1); });
  form.querySelector('[data-quiz-restart]').addEventListener('click', () => {
    form.reset();
    result.hidden = true;
    nav.hidden = false;
    show(0);
    steps[0].querySelector('legend').focus({ preventScroll: true });
  });

  // « Parlons de cette formule » : préremplit la phrase de contact.
  form.querySelector('[data-quiz-cta]').addEventListener('click', () => {
    const contact = document.querySelector('[data-contact]');
    const select = contact?.querySelector('[data-offer-select]');
    const opt = select?.querySelector(`option[data-key="${result.dataset.plan}"]`);
    if (opt) select.value = opt.value;
    const goal = contact?.querySelector('#f-goal');
    const obj = answers().objectif?.value;
    if (goal && obj === 'local') goal.value = 'être mieux trouvé localement';
    const more = contact?.querySelector('#f-more');
    if (more && !more.value.trim()) more.value = result.dataset.summary;
    setTimeout(() => contact?.querySelector('#f-name')?.focus({ preventScroll: true }), 700);
  });

  // « Voir le détail des offres » : met en évidence la formule recommandée.
  form.querySelector('[data-quiz-see]').addEventListener('click', () => {
    const btn = document.querySelector(`.plan [data-offer="${result.dataset.plan}"]`);
    const card = btn?.closest('.plan');
    if (!card) return;
    document.querySelectorAll('.plan.is-recommended').forEach((c) => c.classList.remove('is-recommended'));
    card.classList.add('is-recommended');
  });

  show(0);
}
