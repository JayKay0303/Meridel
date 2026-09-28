// Formulaire en forme de phrase : prépare un message WhatsApp ou un e-mail.
// Rien n'est enregistré ni envoyé par le site lui-même.
const cfg = () => window.SITE_CONFIG || {};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isPhone = (v) => /^[+()\d\s./-]{7,}$/.test(v) && v.replace(/\D/g, '').length >= 9;

export function initContact() {
  const form = document.querySelector('[data-contact]');
  const { whatsapp, email } = cfg();

  // Lien WhatsApp direct (message générique, formel).
  const generic = 'Bonjour,\n\nJe vous contacte au sujet de la création de mon site web. Pourrions-nous en parler ?\n\nBien cordialement.';
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

  // Boutons « Choisir … » : présélection de l'offre dans la phrase.
  const offerSelect = form?.querySelector('[data-offer-select]');
  const more = form?.querySelector('#f-more');
  offerSelect?.addEventListener('change', () => {
    const notice = form.querySelector('[data-contact-recommendation]');
    if (notice) notice.hidden = true;
  });
  document.querySelectorAll('[data-offer]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const opt = offerSelect?.querySelector(`option[data-key="${btn.dataset.offer}"]`);
      if (opt) { offerSelect.value = opt.value; offerSelect.dispatchEvent(new Event('input')); }
      if (btn.dataset.extra && more && !more.value.trim()) more.value = btn.dataset.extra;
      setTimeout(() => form?.querySelector('#f-name')?.focus({ preventScroll: true }), 700);
    });
  });
  if (!form) return;

  // Largeur automatique des champs quand « field-sizing » n'est pas pris en charge.
  if (!(window.CSS && CSS.supports && CSS.supports('field-sizing', 'content'))) {
    form.querySelectorAll('input.phrase__field').forEach((inp) => {
      const fit = () => { inp.size = Math.max(4, (inp.value || inp.placeholder).length + 1); };
      inp.addEventListener('input', fit); fit();
    });
  }

  const fields = {
    name: { el: form.querySelector('#f-name'), err: form.querySelector('#err-name'), ok: (v) => (form.dataset.quizContact === 'true' && !v) || v.length >= 2 },
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
      status.textContent = invalid.length > 1 ? `${invalid.length} informations manquent pour compléter la phrase.` : 'Une information manque pour compléter la phrase.';
      invalid[0].el.focus();
      return;
    }
    const v = (id) => (form.querySelector(id)?.value || '').trim();
    const name = v('#f-name'); const company = v('#f-company'); const city = v('#f-city');
    const phrase = `${name ? `Je m’appelle ${name}, je dirige` : 'Je représente'} ${company}${city ? ` à ${city}` : ''}. J’aimerais ${v('#f-goal')} et l’offre qui m’intéresse est ${v('#f-offer')}. Vous pouvez me répondre à ${v('#f-reply')}.`;
    const extra = [v('#f-more'), ...(form.dataset.quizSummary && !v('#f-more').includes(form.dataset.quizSummary) ? [form.dataset.quizSummary] : [])].filter(Boolean).join('\n\n');
    const message = ['Bonjour,', '', phrase, ...(extra ? ['', extra] : []), '', 'Bien cordialement,', name].join('\n');
    const via = e.submitter?.value || 'whatsapp';

    if (via === 'email' && email) {
      const subject = `Projet de site — ${company}`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      status.textContent = 'Votre messagerie s’ouvre avec le message prêt. Il ne part qu’après votre confirmation.';
      return;
    }
    const url = waUrl(message);
    window.open(url, '_blank', 'noopener');
    status.replaceChildren(document.createTextNode('Votre message est prêt dans WhatsApp. Il ne part qu’après votre confirmation. '));
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Ouvrir WhatsApp';
    status.append(a);
  });
}
