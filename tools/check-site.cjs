const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const services = require('../src/_data/servicePages.json');
const site = require('../src/_data/site.json');
const treatments = require('../src/_data/treatments.json');
const catalog = require('../src/_data/serviceCatalog');
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
  const responsiveImages = attrs(html, 'srcset').flatMap((value) =>
    value.split(',').map((candidate) => candidate.trim().split(/\s+/)[0]),
  );
  for (const href of [...attrs(html, 'href'), ...attrs(html, 'src'), ...responsiveImages]) {
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
  for (const match of html.matchAll(/<strong class=['"]gallery-title['"]>([\s\S]*?)<\/strong>/g))
    assert(match[1].trim(), label + ': image viewer title must not be empty');
  assert(!/TODO|FIXME|szerkesztendő példaszövegek|Saját fotó helye/i.test(html), label + ': unfinished copy');
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

const serviceIds = [...Object.values(services), ...Object.values(treatments)].map((item) => item.id);
assert.equal(serviceIds.length, new Set(serviceIds).size, 'Service and treatment IDs must be unique');
const analyticsSource = fs.readFileSync(path.resolve(__dirname, '../src/assets/js/analytics.js'), 'utf8');
for (const [serviceKey, service] of Object.entries(services)) {
  for (const extra of service.extras) {
    const treatment = treatments[extra.treatmentKey];
    assert(treatment, serviceKey + ': unknown treatment reference');
    assert(treatment.packages.includes(serviceKey), serviceKey + ': incompatible treatment');
  }
}
for (const [key, treatment] of Object.entries(treatments)) {
  assert(['standalone', 'addon'].includes(treatment.group), key + ': invalid treatment group');
  assert(treatment.name && treatment.text, key + ': treatment content missing');
  for (const packageKey of treatment.packages) {
    assert(services[packageKey]?.extras.some((extra) => extra.treatmentKey === key), key + ': package reference missing');
  }
  const heroSource = treatment.photos?.[0]?.src;
  for (const comparison of treatment.comparisons || []) {
    assert(comparison.before.src !== heroSource && comparison.after.src !== heroSource, key + ': gallery shares hero file');
    assert.notEqual(comparison.before.src, comparison.after.src, key + ': comparison reuses one file');
  }
  const photos = [
    ...(treatment.photos || []),
    ...(treatment.workPhotos || []),
    ...(treatment.comparisons || []).flatMap((pair) => [pair.before, pair.after]),
  ];
  for (const photo of photos) {
    assert(photo.alt?.trim(), key + ': image description missing');
    assert(photo.width > 0 && photo.height > 0, key + ': image dimensions missing');
    assert(fs.existsSync(path.resolve(__dirname, '../src' + photo.src)), key + ': image file missing');
  }
  if (!treatment.url) continue;
  const html = pages.get(path.join(root, treatment.url, 'index.html'));
  assert(html, key + ': detail page missing');
  assert(html.includes(site.url + treatment.url), key + ': canonical URL missing');
  assert(html.includes('"price":' + treatment.price), key + ': schema price differs');
  assert(html.includes(treatment.offerDescription), key + ': schema conditions differ');
  const expectedPrice = String(treatment.price).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' Ft' + (treatment.from ? '-tól' : '');
  assert(html.match(/<title>([\s\S]*?)<\/title>/)[1].includes(expectedPrice), key + ': title price differs');
  assert(html.match(/<meta name=['"]description['"] content=['"]([^'"]+)/)[1].includes(expectedPrice), key + ': meta price differs');
  assert(analyticsSource.includes("'" + treatment.id + "'"), key + ': analytics allowlist missing');
  const panel = html.match(/<div class=['"]service-page__price-panel['"]>([\s\S]*?)<\/div>/)[1];
  assert.equal((panel.match(/class=['"]price__suffix['"]/g) || []).length, treatment.from ? 1 : 0, key + ': fixed/starting price mismatch');
  const fields = [...html.matchAll(/<input\b[^>]*>/g)].map((match) => match[0]);
  assert(fields.some((field) => /name=['"]csomag['"]/.test(field) && attrs(field, 'value')[0] === treatment.id), key + ': form context missing');
  assert.equal((html.match(/data-gallery-index=/g) || []).length, (treatment.comparisons?.length || 0) * 2 + (treatment.workPhotos?.length || 0), key + ': gallery incomplete');
  assert.equal((html.match(/class=['"]faq-item['"]/g) || []).length, treatment.faq.length, key + ': FAQ incomplete');
  assert(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').includes(treatment.url), key + ': sitemap entry missing');
}

const home = pages.get(path.join(root, 'index.html'));
const siteFaq = require('../src/_data/siteFaq')();
const homeSchemas = [...home.matchAll(/<script\b[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/g)]
  .flatMap((match) => JSON.parse(match[1]));
const homeFaqSchema = homeSchemas.find((schema) => schema['@type'] === 'FAQPage');
assert.deepEqual(homeFaqSchema.mainEntity.map((item) => item.acceptedAnswer.text), siteFaq.map((item) => item.answer));
for (const item of siteFaq) assert(home.includes(item.answer), 'Home FAQ differs: ' + item.id);
assert.equal((home.match(/data-gallery-index=/g) || []).length, 6);
assert(!home.includes('steps__number') && !home.includes('final-cta'));
assert.equal((home.match(/class=['"]service-card['"]/g) || []).length, 4);
assert.equal((home.match(/class=['"]price__suffix['"]/g) || []).length, 4);
assert(home.includes('gallery.js'));
for (const treatment of catalog.standalonePages)
  assert(home.includes("href='" + treatment.url + "'"), 'Home link missing: ' + treatment.name);
assert(!fs.existsSync(path.resolve(__dirname, '../src/_data/packages.json')));
const locationPages = require('../src/_data/locationPages')();
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
for (const location of locationPages) {
  const html = pages.get(path.join(root, location.url, 'index.html'));
  assert(html, location.key + ': local page missing');
  assert(html.includes("rel='canonical' href='" + site.url + location.url + "'"));
  assert(sitemap.includes('<loc>' + site.url + location.url + '</loc>'));
  assert(html.includes("data-area-page='" + location.analyticsId + "'"));
  assert(analyticsSource.includes("'" + location.analyticsId + "'"), location.key + ': analytics allowlist missing');
  assert(html.includes(location.deliveryLabel));
  assert.equal(location.deliveryFee, site.travelFees[location.deliveryZone]);
  assert.equal((html.match(/Mennyibe kerül a tisztítás és a kiszállás\?/g) || []).length, 1);
  if (location.deliveryFee > 0) assert(!html.includes('Ingyenes XXII. kerületi kiszállás'));
  assert(html.includes('callback-form') && html.includes('mobile-contact'));
  const schemas = [...html.matchAll(/<script\b[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/g)]
    .flatMap((match) => JSON.parse(match[1]));
  const service = schemas.find((schema) => schema['@type'] === 'Service');
  assert.deepEqual(service.areaServed, location.areaServed);
  assert.equal(service.url, site.url + location.url);
  for (const item of Object.values(services)) {
    const offer = service.offers.find((offer) => offer.url === site.url + item.url);
    assert.equal(offer.price, item.price);
    assert.equal(offer.priceCurrency, 'HUF');
    assert(offer.description.includes(location.deliveryDescription));
    assert(html.includes("href='" + item.url + "'"));
  }
  const breadcrumb = schemas.find((schema) => schema['@type'] === 'BreadcrumbList');
  assert.equal(breadcrumb.itemListElement.at(-1).item, service.url);
  for (const item of location.faq) {
    assert(html.includes(item.question) && html.includes(item.answer));
  }
}
const areas = pages.get(path.join(root, 'kiszallasi-teruletek/index.html'));
assert(areas && areas.includes('callback-form'));
assert(sitemap.includes('<loc>' + site.url + '/kiszallasi-teruletek/</loc>'));
console.log(
  `PASS: ${pages.size} pages, ${linkCount} local links/assets, schemas, forms, service contents and shared components.`,
);
