const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('src/assets/js/gallery.js', 'utf8');

function setup(items, supported = true) {
  const handlers = new Map();
  const controls = new Map();
  const output = {
    '[data-gallery-image]': {},
    '#gallery-caption': {},
    '[data-gallery-counter]': {},
    '#gallery-description': {},
  };
  for (const selector of ['[data-gallery-close]', '[data-gallery-prev]', '[data-gallery-next]']) {
    output[selector] = { addEventListener: (_, fn) => controls.set(selector, fn) };
  }
  const viewer = {
    open: false,
    querySelector: (selector) => output[selector],
    addEventListener: (name, fn) => handlers.set(name, fn),
    close() { this.open = false; handlers.get('close')(); },
  };
  if (supported) viewer.showModal = function () { this.open = true; };
  const links = items.map((item, index) => ({
    href: 'https://example.test/photo-' + index + '.webp',
    listeners: new Map(),
    addEventListener(name, fn) { this.listeners.set(name, fn); },
    querySelector: () => ({ alt: item.alt || '' }),
    closest: () => ({ querySelector: (selector) => selector === '.gallery-title'
      ? { textContent: item.title || '' }
      : { textContent: item.description || '' } }),
    focus() { this.focused = true; },
  }));
  const document = {
    body: { style: { overflow: 'auto' } },
    querySelector: () => viewer,
    querySelectorAll: () => links,
    addEventListener: (_, fn) => fn(),
  };
  vm.runInNewContext(source, { document });
  function open(index = 0, modifiers = {}) {
    const event = { button: 0, preventDefault() { this.prevented = true; }, ...modifiers };
    links[index].listeners.get('click')?.(event);
    return event;
  }
  return { viewer, links, output, document, open, controls, handlers };
}

test('plain photos get a useful lightbox title even without a visible caption', () => {
  const app = setup([{ alt: 'Ózongenerátor az utastérben' }]);
  app.open();
  assert.equal(app.viewer.open, true);
  assert.equal(app.output['#gallery-caption'].textContent, 'Ózongenerátor az utastérben');
  assert.equal(app.output['#gallery-description'].hidden, true);
  assert.equal(app.output['[data-gallery-image]'].alt, 'Ózongenerátor az utastérben');
});

test('multiple comparison pairs wrap correctly and restore focus after closing', () => {
  const app = setup([{ title: 'Előtte' }, { title: 'Utána' }, { title: 'Előtte' }, { title: 'Utána' }]);
  app.open(3);
  assert.equal(app.output['[data-gallery-counter]'].textContent, '4 / 4');
  app.controls.get('[data-gallery-next]')();
  assert.equal(app.output['[data-gallery-counter]'].textContent, '1 / 4');
  app.handlers.get('keydown')({ key: 'ArrowLeft', preventDefault() {} });
  assert.equal(app.output['#gallery-caption'].textContent, 'Utána');
  assert.equal(app.output['[data-gallery-counter]'].textContent, '4 / 4');
  app.controls.get('[data-gallery-close]')();
  assert.equal(app.viewer.open, false);
  assert.equal(app.document.body.style.overflow, 'auto');
  assert.equal(app.links[3].focused, true);
});

test('modified image clicks preserve browser navigation', () => {
  const app = setup([{ title: 'Fotó' }]);
  assert.equal(app.open(0, { ctrlKey: true }).prevented, undefined);
  assert.equal(app.viewer.open, false);
});

test('unsupported dialogs keep the normal image links working', () => {
  const app = setup([{ title: 'Fotó' }], false);
  assert.equal(app.links[0].listeners.size, 0);
});
