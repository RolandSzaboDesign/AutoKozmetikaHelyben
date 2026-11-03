const readData = require('../_lib/read-data.cjs');
const buildLocationPages = require('../_lib/location-pages.cjs');
const buildSiteFaq = require('../_lib/site-faq.cjs');

module.exports = () => {
  const site = readData('site.json');
  return buildLocationPages(readData('locationData.json'), buildSiteFaq(readData('faq.json'), site), site);
};
