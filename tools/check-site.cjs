const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const services = require('../src/_data/servicePages.json');
const site = require('../src/_data/site.json');
const root = path.resolve(__dirname, '../public');
for (const name of fs.readdirSync(path.resolve(__dirname, '../src/assets/js'))) {
  if (name.endsWith('.js'))
    new vm.Script(fs.readFileSync(path.resolve(__dirname, '../src/assets/js', name), 'utf8'), {
      filename: name,
    });
}
const pages = new Map();
const attrs = (html, name) =>
  [...html.matchAll(new RegExp('\\b' + name + '=(["\\\'])(.*?)\\1', 'gs'))].map((match) => match[2]);
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    if (fs.statSync(file).isDirectory()) walk(file);
    else if (file.endsWith('.html')) pages.set(file, fs.readFileSync(file, 'utf8'));
  }
}
walk(root);
let linkCount = 0;
for (const [file, html] of pages) {
  const label = path.relative(root, file);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, label + ': one H1');
  const ids = attrs(html, 'id');
  assert.equal(ids.length, new Set(ids).size, label + ': duplicate IDs');
  assert(!html.includes('—'), label + ': Hungarian em dash');
  assert(!html.includes('{{') && !html.includes('{%'), label + ': unrendered Liquid');
  assert.equal((html.match(/class=['"]eyebrow['"]/g) || []).length, 1, label + ': only H1 eyebrow');
  for (const match of html.matchAll(
    /<script\b[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/g,
  ))
    JSON.parse(match[1]);
  for (const href of [...attrs(html, 'href'), ...attrs(html, 'src')]) {
    if ((!href.startsWith('/') && !href.startsWith('#')) || href.startsWith('//')) continue;
    const url = new URL(
      href.replaceAll('&amp;', '&'),
      'https://local.invalid/' + label.replaceAll(path.sep, '/'),
    );
    let target = path.join(root, decodeURIComponent(url.pathname));
    if (url.pathname.endsWith('/')) target = path.join(target, 'index.html');
    assert(fs.existsSync(target), label + ': missing target ' + href);
    if (url.hash)
      assert(
        attrs(fs.readFileSync(target, 'utf8'), 'id').includes(decodeURIComponent(url.hash.slice(1))),
        label + ': missing anchor ' + href,
      );
    linkCount++;
  }
  if (html.includes('callback-form')) {
    assert(!/<select\b/.test(html));
    assert(!/name=['"]megjegyzes['"]/.test(html));
    assert(!html.includes('>><textarea'));
    const inputs = [...html.matchAll(/<input\b[^>]*>/g)].map((match) => match[0]);
    assert.equal(inputs.filter((input) => /\brequired\b/.test(input)).length, 1);
    assert(inputs.some((input) => /\brequired\b/.test(input) && /name=['"]telefonszam['"]/.test(input)));
    for (const field of [
      'form-name',
      'csomag',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_placement',
      'landing_url',
      'bot-field',
    ])
      assert(attrs(html, 'name').includes(field), label + ': missing form field ' + field);
    assert(html.includes('/assets/js/forms.js') && html.includes('/assets/js/analytics.js'));
  }
}
for (const service of Object.values(services)) {
  const html = pages.get(path.join(root, service.url, 'index.html'));
  assert(html, service.url);
  assert(html.includes('"price":' + service.price));
  const formattedPrice = String(service.price).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  assert(html.match(/<title>([\s\S]*?)<\/title>/)[1].includes(formattedPrice + ' Ft-tól'));
  assert(
    html.match(/<meta name=['"]description['"] content=['"]([^'"]+)/)[1].includes(formattedPrice + ' Ft-tól'),
  );
  assert(html.includes(site.url + service.url));
  assert.equal((html.match(/class=['"]service-card['"]/g) || []).length, 3);
  assert.equal((html.match(/class=['"]price__suffix['"]/g) || []).length, 4);
  const lists = [...html.matchAll(/<ul class=['"]service-details[^'"]*['"]>([\s\S]*?)<\/ul>/g)];
  assert.equal(lists.length, 2);
  assert.equal((lists[0][1].match(/<li>/g) || []).length, service.included.length);
  assert.equal((lists[1][1].match(/<li>/g) || []).length, service.extras.length);
  assert(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').includes(service.url));
}
const home = pages.get(path.join(root, 'index.html'));
assert.equal((home.match(/data-gallery-index=/g) || []).length, 6);
assert(!home.includes('steps__number') && !home.includes('final-cta'));
assert.equal((home.match(/class=['"]service-card['"]/g) || []).length, 4);
assert.equal((home.match(/class=['"]price__suffix['"]/g) || []).length, 8);
assert(home.includes('gallery.js'));
assert(!fs.existsSync(path.resolve(__dirname, '../src/_data/packages.json')));
console.log(
  `PASS: ${pages.size} pages, ${linkCount} local links/assets, schemas, forms, service contents and shared components.`,
);
