const test = require('node:test');
const assert = require('node:assert/strict');
const buildLocationPages = require('../../src/_lib/location-pages.cjs');
const buildSiteFaq = require('../../src/_lib/site-faq.cjs');
const { locationSchema } = require('../../src/_lib/structured-data.cjs');
const locations = require('../../src/_data/locationData.json');
const rawFaq = require('../../src/_data/faq.json');
const site = require('../../src/_data/site.json');
const services = require('../../src/_data/servicePages.json');

test('a fee change reaches every nearby page, its pricing FAQ, and its offers without changing XXII', () => {
  const changedSite = { ...site, travelFees: { ...site.travelFees, nearby: 2500 } };
  const faq = buildSiteFaq(rawFaq, changedSite);
  const pages = buildLocationPages(locations, faq, changedSite);
  assert(faq.find((item) => item.id === 'coverage').answer.includes('2.500 Ft'));
  for (const page of pages) {
    const pricing = page.faq.filter((item) => item.id === 'pricing');
    assert.equal(pricing.length, 1);
    if (page.deliveryZone === 'budapest22') {
      assert.equal(page.deliveryFee, 0);
      assert(!page.pricingNote.includes('2.500'));
    } else {
      assert.equal(page.deliveryFee, 2500);
      assert(page.deliveryLabel.includes('2.500 Ft'));
      assert(page.intro.facts.some((fact) => fact.text.includes('2.500 Ft')));
      assert(pricing[0].answer.includes('2.500 Ft'));
      assert(locationSchema(page, changedSite, services)[0].offers.every((offer) => offer.description.includes('2.500 Ft')));
    }
  }
});

test('conflicting URLs and analytics IDs fail before pages can overwrite each other', () => {
  for (const field of ['key', 'url', 'analyticsId']) {
    const invalid = structuredClone(locations);
    invalid[1][field] = invalid[0][field];
    assert.throws(() => buildLocationPages(invalid, rawFaq, site), /Missing or duplicate/);
  }
  const invalid = structuredClone(locations);
  invalid[1].sharedFaqIds = ['missing-question'];
  assert.throws(() => buildLocationPages(invalid, rawFaq, site), /Unknown location FAQ/);
});

test('invalid delivery fees fail and a free nearby zone never inherits a XXII label', () => {
  for (const fee of [-1, '2000', undefined]) {
    const changedSite = { ...site, travelFees: { ...site.travelFees, nearby: fee } };
    assert.throws(() => buildLocationPages(locations, rawFaq, changedSite), /Invalid delivery/);
  }
  const changedSite = { ...site, travelFees: { ...site.travelFees, nearby: 0 } };
  const pages = buildLocationPages(locations, rawFaq, changedSite);
  assert(pages.filter((page) => page.deliveryZone === 'nearby').every((page) => !page.deliveryLabel.includes('XXII')));
});
