const site = require('./site.json');
const catalog = require('./serviceCatalog');

const entries = [
  ...Object.values(catalog.packageCards).map(({ service }) => ({
    name: service.name,
    url: site.url + service.url,
  })),
  ...[...catalog.standaloneTreatments, ...catalog.addonTreatments].map((treatment) => ({
    name: treatment.name,
    url: site.url + (treatment.url || '/szolgaltatasok/#' + treatment.id),
  })),
];

module.exports = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Autókozmetikai szolgáltatások',
  url: site.url + '/szolgaltatasok/',
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: entries.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      ...entry,
    })),
  },
};
