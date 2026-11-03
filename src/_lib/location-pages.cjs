const { forint } = require('./format.cjs');

const nearbyAssessment = 'Sok munkát telefonon, szükség esetén néhány fotó alapján is meg tudunk beszélni. Ha az autó állapota vagy a helyszín miatt személyes megtekintés szükséges, annak részleteit és az esetleges költségeket előre egyeztetjük. Az érdeklődés nem kötelez megrendelésre.';

function unique(items, field) {
  const values = items.map((item) => item[field]);
  if (values.some((value) => !value) || new Set(values).size !== values.length) {
    throw new Error(`Missing or duplicate location ${field}`);
  }
}

module.exports = function buildLocationPages(locations, faq, site) {
  for (const field of ['key', 'url', 'analyticsId']) unique(locations, field);
  const sharedFaqIds = faq.filter((item) => item.id !== 'coverage').map((item) => item.id);

  return locations.map((location) => {
    if (!/^\/kiszallasi-teruletek\/[a-z0-9-]+\/$/.test(location.url)) {
      throw new Error(`Invalid location URL: ${location.url}`);
    }
    const deliveryFee = site.travelFees[location.deliveryZone];
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
      throw new Error(`Invalid delivery zone or fee: ${location.deliveryZone}`);
    }
    const isLocal = location.deliveryZone === 'budapest22';
    const deliveryDescription = deliveryFee === 0
      ? isLocal ? 'A XXII. kerületben ingyenes a kiszállás.' : 'A kiszállás ingyenes.'
      : `A csomag alapárán felül ${forint(deliveryFee)} Ft kiszállási díjjal számolj. Az esetleg felmerülő parkolási költséget külön, előre egyeztetjük.`;
    const pricingFaq = {
      id: 'pricing',
      question: 'Mennyibe kerül a tisztítás és a kiszállás?',
      answer: `A csomagoknál feltüntetett alapárak szokásos szennyezettségű személyautókra és kisebb crossoverekre érvényesek. ${deliveryDescription} Nagyobb autóra vagy többletmunkára egyedi ajánlatot adok. A választott csomagot, az esetleges felárakat és a végleges összeget kezdés előtt megbeszéljük.`,
    };
    const localFaq = [pricingFaq, ...(location.localFaq || []).filter((item) => item.id !== 'pricing')];
    unique(localFaq, 'id');
    const overrides = {
      ...(!isLocal ? { assessment: nearbyAssessment } : {}),
      ...location.sharedFaqOverrides,
    };
    const facts = location.intro.facts || [
      { label: 'Kiszállási terület', text: `${location.name}, egyeztetett címen` },
      { label: 'Kiszállási díj', type: 'deliveryFee' },
      { label: 'Munkavégzés helye', text: 'Előre egyeztetett, alkalmas helyszín az autódnál' },
    ];
    return {
      ...location,
      deliveryFee,
      deliveryDescription,
      deliveryLabel: deliveryFee === 0
        ? isLocal ? 'Ingyenes XXII. kerületi kiszállás' : 'Ingyenes kiszállás'
        : `Kiszállás: ${forint(deliveryFee)} Ft`,
      pricingNote: `Az alapárak személyautókra és személyautó méretű crossoverekre, szokásos szennyezettség mellett érvényesek. ${deliveryDescription} A végleges árat előre megbeszéljük.`,
      intro: {
        ...location.intro,
        facts: facts.map((fact) => fact.type === 'deliveryFee'
          ? { ...fact, text: deliveryFee === 0 ? isLocal ? 'A kerületen belül ingyenes' : 'Ingyenes' : `${forint(deliveryFee)} Ft, az alapáron felül` }
          : fact),
      },
      process: { heading: 'Így egyeztetünk a helyszíni autóápolásról', ...location.process },
      faq: [
        ...localFaq,
        ...(location.sharedFaqIds || sharedFaqIds)
          .filter((id) => !localFaq.some((item) => item.id === id))
          .map((id) => {
            const item = faq.find((entry) => entry.id === id);
            if (!item) throw new Error(`Unknown location FAQ: ${id}`);
            return overrides[id] ? { ...item, answer: overrides[id] } : item;
          }),
      ],
    };
  });
};
