/* Ahrefs custom events: only fixed identifiers (including package IDs), never personal data or URLs. */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const live = ['autokozmetikahelyben.hu', 'www.autokozmetikahelyben.hu'].includes(location.hostname);
  const packageIds = new Set([
    'kulso-mosas',
    'kulso-vedelem',
    'belso',
    'teljes',
    'felni-melytisztitas',
    'ozonos-kezeles',
    'nem-tudom',
  ]);
  const form = document.querySelector('form[name="visszahivas"]');
  const serviceId = form?.querySelector('[name="csomag"]')?.value;
  const areaId = document.querySelector('[data-area-page]')?.dataset.areaPage;
  const areaIds = new Set(['area-22', 'area-diosd', 'area-erd', 'area-torokbalint', 'area-szigetszentmiklos', 'areas']);
  const pageContext = areaIds.has(areaId)
    ? areaId
    : document.querySelector('.homepage')
    ? 'home'
    : document.querySelector('.service-hub')
      ? 'services'
      : packageIds.has(serviceId) && serviceId !== 'nem-tudom'
        ? serviceId
        : 'other';
  const pending = [];
  let timer;
  function flush() {
    if (!live || typeof window.AhrefsAnalytics?.sendEvent !== 'function') return;
    while (pending.length) {
      const event = pending.shift();
      try {
        window.AhrefsAnalytics.sendEvent(event.name, { props: event.props });
      } catch (_) {
        /* Analytics must never interfere with the website. No retry after uncertain delivery. */
      }
    }
  }
  function emit(name, props = {}) {
    if (!live) return;
    if (pending.length < 80) pending.push({ name, props: { page: pageContext, ...props } });
    flush();
    if (pending.length && !timer) {
      let retries = 0;
      timer = setInterval(() => {
        flush();
        if (!pending.length || ++retries >= 30) {
          clearInterval(timer);
          timer = null;
          if (retries >= 30) pending.length = 0;
        }
      }, 500);
    }
  }
  const once = new Set();
  const galleryItems = new Map();
  document
    .querySelectorAll('.work__grid img')
    .forEach((image, index) => galleryItems.set(image, String(index + 1)));
  const sections = new Map();
  for (const [id, name] of Object.entries({
    'hero-title': 'hero',
    'hub-title': 'services',
    'service-title': 'hero',
    'hero-pricing-title': 'pricing',
    'process-title': 'process',
    'services-title': 'services',
    'work-title': 'gallery',
    'about-title': 'about',
    'contact-title': 'contact',
    'faq-title': 'faq',
    'location-title': 'area',
    'service-included': 'included',
    'service-extras': 'extras',
    'service-related': 'related',
  })) {
    const heading = document.getElementById(id);
    if (heading) sections.set(heading, name);
  }
  function emitOnce(key, name, props) {
    if (once.has(key)) return;
    once.add(key);
    emit(name, props);
  }

  let started = false,
    sending = false,
    succeeded = false,
    abandoned = false;
  const formProps = { form: 'visszahivas' };
  const fields = {
    nev: 'name',
    telefonszam: 'phone',
    'auto-tipusa': 'car',
    helyszin: 'location',
    csomag: 'package',
  };
  function start() {
    if (!started) {
      started = true;
      emit('form_start', formProps);
    }
  }
  document.addEventListener('click', (event) => {
    const image = event.target.closest('.work__grid img');
    if (galleryItems.has(image)) emit('gallery_click', { item: galleryItems.get(image) });
    const link = event.target.closest('a');
    if (!link) return;
    const area = link.closest('.mobile-contact')
      ? 'mobile-sticky'
      : link.closest('header')
        ? 'header'
        : link.closest('footer')
          ? 'footer'
          : link.closest('.hero, .service-page__hero, .service-hub__hero')
            ? 'hero'
            : link.closest('.process')
              ? 'process'
              : link.closest('.pricing')
                ? 'pricing'
                : link.closest('.work')
                  ? 'gallery'
                  : link.closest('.final-cta')
                    ? 'final'
                    : 'contact';
    const href = link.getAttribute('href') || '';
    if (href === '#kapcsolat' || href === '/#kapcsolat') emit('cta_click', { location: area });
    const serviceArea = link.closest('.service-hub')
      ? 'hub'
      : link.closest('.service-cards--related')
        ? 'related'
        : link.closest('.home-services')
          ? 'services'
          : area;
    if (packageIds.has(link.dataset.service))
      emit('service_click', { package: link.dataset.service, location: serviceArea });
    if (href === '/szolgaltatasok/') emit('service_hub_click', { location: area });
    if (['#csomagarak', '/#csomagarak', '#szolgaltatasok', '/#szolgaltatasok'].includes(href))
      emit('pricing_click', { location: area, target: href.includes('csomagarak') ? 'prices' : 'details' });
    if (href.startsWith('tel:')) emit('phone_click', { location: area });
    const channel = href.startsWith('mailto:')
      ? 'email'
      : href.startsWith('https://wa.me/')
        ? 'whatsapp'
        : href.startsWith('https://m.me/')
          ? 'messenger'
          : null;
    if (channel) emit('contact_click', { channel, location: area });
    if (link.matches('.reviews__source')) emit('review_click', { location: area });
    // A deliberate in-site departure is observable; tab hiding and browser exit are not reliable abandonment signals.
    if (
      form &&
      started &&
      !sending &&
      !succeeded &&
      !abandoned &&
      !event.defaultPrevented &&
      event.button === 0 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.altKey &&
      !link.hasAttribute('download') &&
      (!link.target || link.target === '_self') &&
      href.startsWith('/') &&
      !href.startsWith('//') &&
      !href.startsWith('/#')
    ) {
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
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || document.visibilityState !== 'visible') return;
          const section = sections.get(entry.target);
          if (section) emitOnce(`section:${section}`, 'section_view', { section });
          else
            emitOnce(`image:${galleryItems.get(entry.target)}`, 'gallery_view', {
              item: galleryItems.get(entry.target),
            });
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.25 },
    );
    [...sections.keys(), ...galleryItems.keys()].forEach((item) => observer.observe(item));
  }
  let scheduled = false;
  function depth() {
    scheduled = false;
    if (document.visibilityState !== 'visible') return;
    const height = document.documentElement.scrollHeight - innerHeight;
    if (height <= 0) return;
    const percent = Math.min(100, Math.max(0, (scrollY / height) * 100));
    [25, 50, 75, 90, 100].forEach((value) => {
      if (percent >= value || (value === 100 && height - scrollY <= 2))
        emitOnce(`scroll:${value}`, 'scroll_depth', { percent: String(value) });
    });
  }
  function scheduleDepth() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(depth);
    }
  }
  window.addEventListener('scroll', scheduleDepth, { passive: true });
  window.addEventListener('resize', scheduleDepth);
  window.addEventListener('pageshow', scheduleDepth);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleDepth();
  });
  scheduleDepth();
  if (!form) return;
  form.querySelector('.form-extra')?.addEventListener('toggle', (event) => {
    if (event.currentTarget.open) emitOnce('form:details', 'form_details_open', formProps);
  });
  form.addEventListener('input', (event) => {
    if (fields[event.target.name]) start();
  });
  form.addEventListener(
    'invalid',
    (event) => {
      const field = fields[event.target.name];
      if (!field) return;
      start();
      const reason = event.target.validity.valueMissing ? 'required' : 'invalid';
      emitOnce(`invalid:${field}:${reason}`, 'form_error', { ...formProps, field, reason });
    },
    true,
  );
  form.addEventListener('callback:submit', () => {
    sending = true;
    start();
  });
  form.addEventListener('callback:success', (event) => {
    succeeded = true;
    const serviceId = event.detail?.package;
    emit('form_success', { ...formProps, ...(packageIds.has(serviceId) ? { package: serviceId } : {}) });
  });
  form.addEventListener('callback:error', (event) => {
    const reason = event.detail?.reason === 'http' ? 'http' : 'network';
    emit('form_error', { ...formProps, reason });
  });
  form.addEventListener('callback:settled', () => {
    sending = false;
  });
});
