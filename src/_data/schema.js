const { faqSchema } = require('../_lib/structured-data.cjs');
const faq = require('./faq.json');
const site = require('./site.json');

module.exports = [
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
