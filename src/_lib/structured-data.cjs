function faqSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}
function serviceSchema(service, site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.lead,
    url: site.url + service.url,
    serviceType: service.name,
    areaServed: site.areaServed,
    provider: { '@type': 'Person', name: site.author.name, telephone: site.author.telephone },
    offers: {
      '@type': 'Offer',
      price: service.price,
      priceCurrency: 'HUF',
      description:
        'Alapár személyautókra és személyautó méretű crossoverekre, szokásos szennyezettség mellett. A végleges ár előzetes egyeztetés alapján.',
    },
  };
}
module.exports = { faqSchema, serviceSchema };
