// Formulaire en forme de phrase : prépare un message WhatsApp ou un e-mail.
// Rien n'est enregistré ni envoyé par le site lui-même.
import { readHandoff, saveHandoff, clearHandoff } from './handoff.js';
import { t } from './i18n.js';

const cfg = () => window.SITE_CONFIG || {};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isPhone = (v) => /^[+()\d\s./-]{7,}$/.test(v) && v.replace(/\D/g, '').length >= 9;

export function initContact() {
  const form = document.querySelector('[data-contact]');
  const { whatsapp, email } = cfg();

  // Lien WhatsApp direct (message générique, formel).
  const generic = t('Bonjour,\n\nJe vous contacte au sujet de la création de mon site web. Pourrions-nous en parler ?\n\nBien cordialement.', 'Hello,\n\nI am contacting you about creating my website. Could we talk about it?\n\nKind regards.');
  const waUrl = (msg) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
  document.querySelectorAll('[data-wa-direct]').forEach((a) => { if (whatsapp) a.href = waUrl(generic); });

  // E-mail : affiché et activé seulement s'il est configuré.
  const emailBtn = form?.querySelector('[data-email-btn]');
  const direct = document.querySelector('[data-email-direct]');
  if (email) {
    if (direct) {
      const a = document.createElement('a');
      a.className = 'link-draw';
      a.href = `mailto:${email}`;
      a.textContent = email;
      direct.replaceChildren(a);
    }
  } else if (emailBtn) {
    emailBtn.hidden = true;
  }

  // Boutons « Choisir … » (page Offres) : l'offre suit le visiteur jusqu'à la page Contact.
  document.querySelectorAll('[data-offer]').forEach((btn) => {
    btn.addEventListener('click', () => saveHandoff({ offer: btn.dataset.offer, extra: btn.dataset.extra || '' }));
  });
  if (!form) return;

  // Arrivée sur la page Contact : on préremplit la phrase avec ce qui a été choisi ailleurs.
  const offerSelect = form.querySelector('[data-offer-select]');
  const more = form.querySelector('#f-more');
  const notice = form.querySelector('[data-contact-recommendation]');
  offerSelect?.addEventListener('change', () => { if (notice) notice.hidden = true; });
  const setOffer = (key) => {
    const opt = key && offerSelect?.querySelector(`option[data-key="${CSS.escape(key)}"]`);
    if (opt) offerSelect.value = opt.value;
  };
  const h = readHandoff();
  const fromUrl = new URLSearchParams(location.search).get('offre');
  setOffer(h.offer || fromUrl);
  if (fromUrl && h.offer && fromUrl !== h.offer) setOffer(fromUrl);
  const goal = form.querySelector('#f-goal');
  if (h.goal && goal) goal.value = h.goal;
  const company = form.querySelector('#f-company');
  if (h.company && company && !company.value.trim()) company.value = h.company;
  const extras = [fromUrl && h.offer && fromUrl !== h.offer ? '' : h.extra, h.logo, h.quiz].filter(Boolean);
  if (more && extras.length && !more.value.trim()) more.value = extras.join('\n\n').slice(0, more.maxLength);
  if (h.quiz) form.dataset.quizSummary = h.quiz;
  if (h.notice && notice) { notice.textContent = h.notice; notice.hidden = false; }

  // Largeur automatique des champs quand « field-sizing » n'est pas pris en charge.
  if (!(window.CSS && CSS.supports && CSS.supports('field-sizing', 'content'))) {
    form.querySelectorAll('input.phrase__field').forEach((inp) => {
      const fit = () => { inp.size = Math.max(4, (inp.value || inp.placeholder).length + 1); };
      inp.addEventListener('input', fit); fit();
    });
  }

  const fields = {
    name: { el: form.querySelector('#f-name'), err: form.querySelector('#err-name'), ok: (v) => v.length >= 2 },
    company: { el: form.querySelector('#f-company'), err: form.querySelector('#err-company'), ok: (v) => v.length >= 2 },
    reply: { el: form.querySelector('#f-reply'), err: form.querySelector('#err-reply'), ok: (v) => EMAIL_RE.test(v) || isPhone(v) }
  };
  const status = form.querySelector('[data-status]');

  const check = (f, show) => {
    const valid = f.ok(f.el.value.trim());
    if (show || valid) {
      f.el.setAttribute('aria-invalid', String(!valid));
      f.err.hidden = valid;
    }
    return valid;
  };
  Object.values(fields).forEach((f) => {
    f.el.addEventListener('input', () => { if (f.el.getAttribute('aria-invalid') === 'true') check(f, false); });
    f.el.addEventListener('blur', () => { if (f.el.value.trim()) check(f, true); });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const invalid = Object.values(fields).filter((f) => !check(f, true));
    if (invalid.length) {
      status.textContent = invalid.length > 1 ? t(`${invalid.length} informations manquent pour compléter la phrase.`, `${invalid.length} details are missing to complete the sentence.`) : t('Une information manque pour compléter la phrase.', 'One detail is missing to complete the sentence.');
      invalid[0].el.focus();
      return;
    }
    const v = (id) => (form.querySelector(id)?.value || '').trim();
    const name = v('#f-name'); const company = v('#f-company'); const city = v('#f-city');
    const phrase = t(`Je m’appelle ${name}, je dirige ${company}${city ? ` à ${city}` : ''}. J’aimerais ${v('#f-goal')} et l’offre qui m’intéresse est ${v('#f-offer')}. Vous pouvez me répondre à ${v('#f-reply')}.`,
      `My name is ${name}, I run ${company}${city ? ` in ${city}` : ''}. I would like to ${v('#f-goal')} and the plan I am interested in is ${v('#f-offer')}. You can reply to me at ${v('#f-reply')}.`);
    const extra = [v('#f-more'), ...(form.dataset.quizSummary && !v('#f-more').includes(form.dataset.quizSummary) ? [form.dataset.quizSummary] : [])].filter(Boolean).join('\n\n');
    const message = [t('Bonjour,', 'Hello,'), '', phrase, ...(extra ? ['', extra] : []), '', t('Bien cordialement,', 'Kind regards,'), name].join('\n');
    const via = e.submitter?.value || 'whatsapp';
    clearHandoff();

    if (via === 'email' && email) {
      const subject = t(`Projet de site — ${company}`, `Website project — ${company}`);
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      status.textContent = t('Votre messagerie s’ouvre avec le message prêt. Il ne part qu’après votre confirmation.', 'Your e-mail app opens with the message ready. It is only sent once you confirm.');
      return;
    }
    const url = waUrl(message);
    window.open(url, '_blank', 'noopener');
    status.replaceChildren(document.createTextNode(t('Votre message est prêt dans WhatsApp. Il ne part qu’après votre confirmation. ', 'Your message is ready in WhatsApp. It is only sent once you confirm. ')));
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = t('Ouvrir WhatsApp', 'Open WhatsApp');
    status.append(a);
  });
}
