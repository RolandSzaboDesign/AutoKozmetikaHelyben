/* Ahrefs custom events: only fixed identifiers, never form values or URLs. */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const live = ['autokozmetikahelyben.hu', 'www.autokozmetikahelyben.hu'].includes(location.hostname);
  const pending = [];
  let timer;
  function flush() {
    if (!live || typeof window.AhrefsAnalytics?.sendEvent !== 'function') return;
    while (pending.length) {
      const event = pending.shift();
      try { window.AhrefsAnalytics.sendEvent(event.name, { props: event.props }); }
      catch (_) { /* Analytics must never interfere with the website. No retry after uncertain delivery. */ }
    }
  }
  function emit(name, props = {}) {
    if (!live) return;
    if (pending.length < 80) pending.push({ name, props });
    flush();
    if (pending.length && !timer) {
      let retries = 0;
      timer = setInterval(() => {
        flush();
        if (!pending.length || ++retries >= 30) {
          clearInterval(timer); timer = null;
          if (retries >= 30) pending.length = 0;
        }
      }, 500);
    }
  }
  const once = new Set();
  const galleryItems = new Map();
  document.querySelectorAll('.work__grid img').forEach((image, index) => galleryItems.set(image, String(index + 1)));
  const sections = new Map();
  for (const [id, name] of Object.entries({ 'hero-title': 'hero', 'process-title': 'process', 'services-title': 'services', 'work-title': 'gallery', 'about-title': 'about', 'contact-title': 'contact', 'faq-title': 'faq' })) {
    const heading = document.getElementById(id);
    if (heading) sections.set(heading, name);
  }
  function emitOnce(key, name, props) {
    if (once.has(key)) return;
    once.add(key); emit(name, props);
  }
  const form = document.querySelector('form[name="visszahivas"]');
  let started = false, sending = false, succeeded = false, abandoned = false;
  const formProps = { form: 'visszahivas' };
  const fields = { nev: 'name', telefonszam: 'phone', 'auto-tipusa': 'car', helyszin: 'location', megjegyzes: 'message' };
  function start() {
    if (!started) { started = true; emit('form_start', formProps); }
  }
  document.addEventListener('click', (event) => {
    const image = event.target.closest('.work__grid img');
    if (galleryItems.has(image)) emit('gallery_click', { item: galleryItems.get(image) });
    const link = event.target.closest('a');
    if (!link) return;
    const area = link.closest('header') ? 'header' : link.closest('footer') ? 'footer' :
      link.closest('.hero') ? 'hero' : link.closest('.process') ? 'process' :
      link.closest('.work') ? 'gallery' : link.closest('.final-cta') ? 'final' : 'contact';
    const href = link.getAttribute('href') || '';
    if (href === '#kapcsolat' || href === '/#kapcsolat') emit('cta_click', { location: area });
    if (href.startsWith('tel:')) emit('phone_click', { location: area });
    // A deliberate in-site departure is observable; tab hiding and browser exit are not reliable abandonment signals.
    if (form && started && !sending && !succeeded && !abandoned && !event.defaultPrevented &&
        event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey &&
        !link.hasAttribute('download') && (!link.target || link.target === '_self') &&
        (href === '/' || href === '/adatkezeles/')) {
      abandoned = true;
      emit('form_abandon', { ...formProps, reason: 'internal_navigation' });
    }
  });
  document.querySelectorAll('details.faq-item').forEach((item, index) => {
    item.addEventListener('toggle', () => {
      if (item.open) emit('faq_open', { item: String(index + 1) });
    });
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || document.visibilityState !== 'visible') return;
        const section = sections.get(entry.target);
        if (section) emitOnce(`section:${section}`, 'section_view', { section });
        else emitOnce(`image:${galleryItems.get(entry.target)}`, 'gallery_view', { item: galleryItems.get(entry.target) });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.25 });
    [...sections.keys(), ...galleryItems.keys()].forEach((item) => observer.observe(item));
  }
  let scheduled = false;
  function depth() {
    scheduled = false;
    if (document.visibilityState !== 'visible') return;
    const height = document.documentElement.scrollHeight - innerHeight;
    if (height <= 0) return;
    const percent = Math.min(100, Math.max(0, scrollY / height * 100));
    [25, 50, 75, 90, 100].forEach((value) => {
      if (percent >= value || (value === 100 && height - scrollY <= 2))
        emitOnce(`scroll:${value}`, 'scroll_depth', { percent: String(value) });
    });
  }
  function scheduleDepth() { if (!scheduled) { scheduled = true; requestAnimationFrame(depth); } }
  window.addEventListener('scroll', scheduleDepth, { passive: true });
  window.addEventListener('resize', scheduleDepth);
  window.addEventListener('pageshow', scheduleDepth);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') scheduleDepth(); });
  scheduleDepth();
  if (!form) return;
  if (['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const status = form.querySelector('[data-form-status]');
      if (status) { status.hidden = false; status.textContent = 'A helyi előnézet nem küld visszahíváskérést. Az űrlapot a Netlify-on közzétett oldal dolgozza fel.'; }
    });
  }
  form.addEventListener('input', (event) => { if (fields[event.target.name]) start(); });
  form.addEventListener('invalid', (event) => {
    const field = fields[event.target.name];
    if (!field) return;
    start();
    const reason = event.target.validity.valueMissing ? 'required' : 'invalid';
    emitOnce(`invalid:${field}:${reason}`, 'form_error', { ...formProps, field, reason });
  }, true);
  // Progressive enhancement: native POST remains available without fetch/JS.
  if (!live || !window.fetch || !window.FormData || !window.URLSearchParams) return;
  form.addEventListener('submit', async (event) => {
    if (event.defaultPrevented) return;
    event.preventDefault();
    if (sending || succeeded) return;
    start();
    if (form.elements.namedItem('bot-field')?.value) return;
    // Construct before disabling the button; keep every attribution and Netlify field.
    let body;
    try { body = new URLSearchParams(new FormData(form)).toString(); }
    catch (_) { HTMLFormElement.prototype.submit.call(form); return; }
    sending = true;
    const button = form.querySelector('[type="submit"]');
    const status = form.querySelector('[data-form-status]');
    if (button) button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    if (status) { status.hidden = false; status.textContent = 'Küldés folyamatban…'; }
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), 20000) : null;
    try {
      const response = await fetch('/', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
        ...(controller ? { signal: controller.signal } : {})
      });
      if (!response.ok) throw new Error('http');
      succeeded = true;
      emit('form_success', formProps);
      if (status) status.textContent = 'Megkaptam a kérésedet. Hamarosan hívlak.';
      // Allow the analytics request a short opportunity to start; never await the tracker.
      setTimeout(() => location.assign(form.getAttribute('action')), 250);
    } catch (error) {
      emit('form_error', { ...formProps, reason: error.message === 'http' ? 'http' : 'network' });
      if (status) {
        status.hidden = false;
        status.textContent = 'Nem sikerült visszaigazolni a beküldést. Hálózati hibánál a kérés már beérkezhetett. Kérlek, hívj telefonon, vagy próbáld újra később.';
      }
    } finally {
      if (timeout) clearTimeout(timeout);
      sending = false;
      form.removeAttribute('aria-busy');
      if (button && !succeeded) button.disabled = false;
    }
  });
});
