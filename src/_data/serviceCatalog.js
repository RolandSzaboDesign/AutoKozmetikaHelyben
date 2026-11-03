const services = require('./servicePages.json');
const hub = require('./serviceHub.json');
const treatments = Object.values(require('./treatments.json'));

const standaloneTreatments = treatments.filter((item) => item.group === 'standalone');

module.exports = {
  packageCards: Object.fromEntries(
    hub.groups.flatMap((group) => group.items).map((card) => [
      card.serviceKey,
      { service: services[card.serviceKey], description: card.benefit },
    ]),
  ),
  standaloneTreatments,
  addonTreatments: treatments.filter((item) => item.group === 'addon'),
  standalonePages: standaloneTreatments.filter((item) => item.url),
};
