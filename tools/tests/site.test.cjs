const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { faqSchema, serviceSchema } = require('../../src/_lib/structured-data.cjs');
const source = fs.readFileSync('src/assets/js/forms.js', 'utf8');
function setup(hostname, response = { ok: true }) {
  const listeners = new Map();
  const fields = new Map(
    [
      'form-name',
      'telefonszam',
      'csomag',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_placement',
      'landing_url',
      'bot-field',
    ].map((name) => [name, { value: '' }]),
  );
  fields.get('csomag').value = 'belso';
  fields.get('form-name').value = 'visszahivas';
  const status = { hidden: true, textContent: '' };
  const button = { disabled: false };
  const attributes = new Map();
  const signals = [];
  const calls = [];
  const form = {
    elements: { namedItem: (name) => fields.get(name) },
    querySelector: (selector) => (selector === '[data-form-status]' ? status : button),
    addEventListener: (name, fn) => listeners.set(name, fn),
    dispatchEvent: (event) => {
      signals.push(event);
    },
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: (key) => attributes.delete(key),
    getAttribute: () => '/koszonom/',
  };
  class FakeFormData {
    *[Symbol.iterator]() {
      for (const [name, field] of fields) yield [name, field.value];
    }
  }
  const context = {
    document: { addEventListener: (_, fn) => fn(), querySelector: () => form },
    location: {
      hostname,
      search: '?utm_source=qa&utm_campaign=local-test',
      href: 'https://' + hostname + '/szolgaltatasok/',
      assign: () => {},
    },
    URLSearchParams,
    FormData: FakeFormData,
    CustomEvent: class {
      constructor(type, options) {
        this.type = type;
        this.detail = options.detail;
      }
    },
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (response instanceof Error) throw response;
      return response;
    },
    setTimeout: () => 1,
    clearTimeout: () => {},
  };
  context.window = context;
  vm.runInNewContext(source, context);
  const submit = async () => {
    const event = {
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
    };
    await listeners.get('submit')(event);
    return event;
  };
  return { submit, fields, status, button, attributes, signals, calls, listeners };
}
test('local preview populates attribution and never sends a request', async () => {
  const app = setup('localhost');
  assert.equal(app.fields.get('utm_source').value, 'qa');
  assert.equal(app.fields.get('utm_campaign').value, 'local-test');
  assert.match(app.fields.get('landing_url').value, /localhost/);
  await app.submit();
  assert.equal(app.calls.length, 0);
  assert.equal(app.status.hidden, false);
  assert.match(app.status.textContent, /helyi előnézet/);
});
test('production submits once and retains Netlify attribution and service context', async () => {
  const app = setup('autokozmetikahelyben.hu');
  await app.submit();
  await app.submit();
  assert.equal(app.calls.length, 1);
  const body = new URLSearchParams(app.calls[0].options.body);
  assert.equal(body.get('form-name'), 'visszahivas');
  assert.equal(body.get('utm_source'), 'qa');
  assert.equal(body.get('csomag'), 'belso');
  assert.equal(app.signals.find((event) => event.type === 'callback:success').detail.package, 'belso');
  assert.equal(app.attributes.has('aria-busy'), false);
  assert.equal(app.button.disabled, true);
});
test('failed submission restores the form and permits retry', async () => {
  const app = setup('autokozmetikahelyben.hu', { ok: false });
  await app.submit();
  await app.submit();
  assert.equal(app.calls.length, 2);
  assert.equal(app.button.disabled, false);
  assert.equal(app.attributes.has('aria-busy'), false);
  assert.equal(app.signals.find((event) => event.type === 'callback:error').detail.reason, 'http');
  assert.match(app.status.textContent, /Nem sikerült/);
});
test('honeypot prevents enhanced submission', async () => {
  const app = setup('autokozmetikahelyben.hu');
  app.fields.get('bot-field').value = 'bot';
  await app.submit();
  assert.equal(app.calls.length, 0);
});
test('other hosts retain native form submission', () => {
  assert.equal(setup('preview.example').listeners.has('submit'), false);
});
test('structured data uses canonical service prices and exact FAQ answers', () => {
  const site = require('../../src/_data/site.json');
  const services = require('../../src/_data/servicePages.json');
  for (const service of Object.values(services)) {
    const schema = serviceSchema(service, site);
    assert.equal(schema.offers.price, service.price);
    assert.equal(schema.url, site.url + service.url);
    assert.deepEqual(schema.areaServed, site.areaServed);
    assert.deepEqual(
      faqSchema(service.faq).mainEntity.map((item) => item.acceptedAnswer.text),
      service.faq.map((item) => item.answer),
    );
  }
});
