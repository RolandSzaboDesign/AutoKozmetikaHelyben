document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[name="visszahivas"]');
  if (!form) return;

  const campaignFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_placement'];
  const params = new URLSearchParams(location.search);
  campaignFields.forEach((name) => {
    const field = form.elements.namedItem(name);
    if (field && params.has(name)) field.value = params.get(name);
  });
  const landing = form.elements.namedItem('landing_url');
  if (landing) landing.value = location.href;

  const status = form.querySelector('[data-form-status]');
  const button = form.querySelector('[type="submit"]');
  const announce = (message) => {
    if (!status) return;
    status.hidden = false;
    status.textContent = message;
  };
  const signal = (name, detail = {}) => form.dispatchEvent(new CustomEvent('callback:' + name, { detail }));
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const live = ['autokozmetikahelyben.hu', 'www.autokozmetikahelyben.hu'].includes(location.hostname);
  if (local) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      announce(
        'A helyi előnézet nem küld visszahíváskérést. Az űrlapot a Netlify-on közzétett oldal dolgozza fel.',
      );
    });
    return;
  }
  // Native Netlify POST remains the fallback on other hosts and without fetch.
  if (!live || !window.fetch || !window.FormData || !window.URLSearchParams) return;
  let sending = false;
  let succeeded = false;
  form.addEventListener('submit', async (event) => {
    if (event.defaultPrevented) return;
    event.preventDefault();
    if (sending || succeeded || form.elements.namedItem('bot-field')?.value) return;
    let body;
    const serviceId = form.elements.namedItem('csomag')?.value;
    try {
      body = new URLSearchParams(new FormData(form)).toString();
    } catch (_) {
      HTMLFormElement.prototype.submit.call(form);
      return;
    }
    sending = true;
    signal('submit');
    if (button) button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    announce('Küldés folyamatban…');
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), 20000) : null;
    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        ...(controller ? { signal: controller.signal } : {}),
      });
      if (!response.ok) throw new Error('http');
      succeeded = true;
      signal('success', { package: serviceId });
      announce('Megkaptam a kérésedet. Hamarosan hívlak.');
      setTimeout(() => location.assign(form.getAttribute('action')), 250);
    } catch (error) {
      signal('error', { reason: error.message === 'http' ? 'http' : 'network' });
      announce(
        'Nem sikerült visszaigazolni a beküldést. Hálózati hibánál a kérés már beérkezhetett. Kérlek, hívj telefonon, vagy próbáld újra később.',
      );
    } finally {
      if (timeout) clearTimeout(timeout);
      sending = false;
      signal('settled');
      form.removeAttribute('aria-busy');
      if (button && !succeeded) button.disabled = false;
    }
  });
});
