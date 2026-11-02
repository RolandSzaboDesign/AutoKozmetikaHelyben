const site = require('./site.json');
const hub = require('./serviceHub.json');
const services = require('./servicePages.json');

module.exports = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Autókozmetikai szolgáltatások',
  url: `${site.url}/szolgaltatasok/`,
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: hub.groups
      .flatMap((group) => group.items)
      .map((card, index) => {
        const service = services[card.serviceKey];
        return {
          '@type': 'ListItem',
          position: index + 1,
          name: service.name,
          url: `${site.url}${service.url}`,
        };
      }),
  },
};
