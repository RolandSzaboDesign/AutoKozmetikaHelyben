const readData = require('../_lib/read-data.cjs');
const buildSiteFaq = require('../_lib/site-faq.cjs');

module.exports = () => buildSiteFaq(readData('faq.json'), readData('site.json'));
