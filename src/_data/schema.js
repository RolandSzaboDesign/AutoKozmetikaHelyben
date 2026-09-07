const faq = require('./faq.json');
const site = require('./site.json');

module.exports = [
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Mobil autókozmetika Dél-Budán és környékén',
    serviceType: 'Mobil autókozmetika',
    url: site.url,
    description: site.description_short,
    provider: {
      '@type': 'Person',
      name: site.author.name,
      telephone: site.author.telephone,
      email: site.author.email,
      url: site.url
    },
    areaServed: [
      { '@type': 'Place', name: 'Budapest XI. kerület' },
      { '@type': 'Place', name: 'Budapest XX. kerület' },
      { '@type': 'Place', name: 'Budapest XXI. kerület' },
      { '@type': 'Place', name: 'Budapest XXII. kerület' },
      { '@type': 'Place', name: 'Szigetszentmiklós' }
    ]
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  }
];
