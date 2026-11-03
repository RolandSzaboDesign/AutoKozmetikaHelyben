const { faqSchema } = require('../_lib/structured-data.cjs');
const readData = require('../_lib/read-data.cjs');
const buildSiteFaq = require('../_lib/site-faq.cjs');

module.exports = () => {
  const site = readData('site.json');
  const faq = buildSiteFaq(readData('faq.json'), site);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Mobil autókozmetika Budapest XXII. kerületében és környékén',
      serviceType: 'Mobil autókozmetika',
      url: site.url,
      description: site.description_short,
      provider: {
        '@type': 'Person',
        name: site.author.name,
        telephone: site.author.telephone,
        email: site.author.email,
        url: site.url,
      },
      areaServed: site.areaServed,
    },
    faqSchema(faq),
  ];
};
