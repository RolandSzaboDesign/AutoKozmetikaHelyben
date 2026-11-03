const { forint } = require('./format.cjs');

module.exports = (items, site) => items.map((item) => item.id === 'coverage'
  ? {
    ...item,
    answer: `A vállalt területeket a Kiszállási területek oldalon találod. A XXII. kerületben ingyenes a kiszállás, a vállalt közeli helyszíneken ${forint(site.travelFees.nearby)} Ft a csomag alapárán felül. Az esetleg felmerülő parkolási költséget külön egyeztetjük. Más címnél a vállalást és a díjat előre megbeszéljük. Saját kocsibeálló vagy más alkalmas magánterület a legjobb.`,
  }
  : item);
