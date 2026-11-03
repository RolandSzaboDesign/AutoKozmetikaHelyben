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
        service.offerDescription ||
        'Alapár személyautókra és személyautó méretű crossoverekre, szokásos szennyezettség mellett. A végleges ár előzetes egyeztetés alapján.',
    },
  };
}
function locationSchema(location, site, services) {
  const url = site.url + location.url;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: location.heading,
      serviceType: 'Mobil autókozmetika',
      description: location.description,
      url,
      areaServed: location.areaServed,
      provider: {
        '@type': 'Person',
        name: site.author.name,
        telephone: site.author.telephone,
        url: site.url,
      },
      offers: Object.values(services).map((service) => {
        const offer = serviceSchema(service, site).offers;
        return {
          ...offer,
          description: `${offer.description} ${location.deliveryDescription}`,
          url: site.url + service.url,
          itemOffered: { '@type': 'Service', name: service.name, url: site.url + service.url },
        };
      }),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { name: 'Főoldal', item: site.url + '/' },
        { name: 'Kiszállási területek', item: site.url + '/kiszallasi-teruletek/' },
        { name: location.name, item: url },
      ].map((item, index) => ({ '@type': 'ListItem', position: index + 1, ...item })),
    },
  ];
}
module.exports = { faqSchema, serviceSchema, locationSchema };
