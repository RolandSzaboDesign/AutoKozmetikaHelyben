const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('src/assets/js/analytics.js', 'utf8');
function setup(hostname = 'autokozmetikahelyben.hu') {
  const documentListeners = new Map();
  const formListeners = new Map();
  const sent = [];
  let onDetails;
  const details = {
    addEventListener: (_, fn) => {
      onDetails = fn;
    },
  };
  const form = {
    querySelector: (selector) =>
      selector === '[name="csomag"]' ? { value: 'belso' } : selector === '.form-extra' ? details : null,
    addEventListener: (name, fn) => formListeners.set(name, fn),
  };
  const context = {
    location: { hostname },
    document: {
      querySelector: (selector) => (selector.startsWith('form[') ? form : null),
      querySelectorAll: () => [],
      getElementById: () => null,
      addEventListener: (name, fn) => (name === 'DOMContentLoaded' ? fn() : documentListeners.set(name, fn)),
      visibilityState: 'visible',
      documentElement: { scrollHeight: 2000 },
    },
    innerHeight: 800,
    scrollY: 0,
    requestAnimationFrame: (fn) => fn(),
    setInterval: () => 1,
    clearInterval: () => {},
    addEventListener: () => {},
    AhrefsAnalytics: {
      sendEvent: (name, payload) => sent.push({ name, props: JSON.parse(JSON.stringify(payload.props)) }),
    },
  };
  context.window = context;
  vm.runInNewContext(source, context);
  const click = (href, service, area = '.mobile-contact') => {
    const link = {
      dataset: { service },
      target: '',
      getAttribute: () => href,
      hasAttribute: () => false,
      matches: () => false,
      closest: (selector) => (selector === area ? {} : null),
    };
    documentListeners.get('click')({
      target: { closest: (selector) => (selector === 'a' ? link : null) },
      button: 0,
      defaultPrevented: false,
    });
  };
  return { sent, click, formListeners, openDetails: () => onDetails({ currentTarget: { open: true } }) };
}
test('Ahrefs sends fixed page/location/channel/service properties via the documented API', () => {
  const app = setup();
  app.click('tel:+36000000000');
  app.click('https://wa.me/36000000000', undefined, '.contact-section');
  app.click('/szolgaltatasok/gyors-mosas/', 'kulso-mosas', '.service-cards--related');
  assert.deepEqual(app.sent.find((event) => event.name === 'phone_click').props, {
    page: 'belso',
    location: 'mobile-sticky',
  });
  assert.deepEqual(app.sent.find((event) => event.name === 'contact_click').props, {
    page: 'belso',
    channel: 'whatsapp',
    location: 'contact',
  });
  assert.deepEqual(app.sent.find((event) => event.name === 'service_click').props, {
    page: 'belso',
    package: 'kulso-mosas',
    location: 'related',
  });
});
test('form details are counted once and personal field values never enter custom properties', () => {
  const app = setup();
  app.openDetails();
  app.openDetails();
  app.formListeners.get('input')({ target: { name: 'telefonszam', value: 'private-value' } });
  app.formListeners.get('callback:success')({
    detail: { package: 'untrusted-private-value', phone: 'private-value' },
  });
  assert.equal(app.sent.filter((event) => event.name === 'form_details_open').length, 1);
  assert(!JSON.stringify(app.sent).includes('private-value'));
  assert(!('package' in app.sent.find((event) => event.name === 'form_success').props));
});
test('the confirmed form success event retains the allowlisted service ID', () => {
  const app = setup();
  app.formListeners.get('callback:success')({ detail: { package: 'teljes' } });
  assert.deepEqual(app.sent.find((event) => event.name === 'form_success').props, {
    page: 'belso',
    form: 'visszahivas',
    package: 'teljes',
  });
});
test('localhost never forwards custom analytics events', () => {
  const app = setup('localhost');
  app.click('tel:+36000000000');
  app.openDetails();
  app.formListeners.get('callback:success')({ detail: { package: 'belso' } });
  assert.equal(app.sent.length, 0);
});
