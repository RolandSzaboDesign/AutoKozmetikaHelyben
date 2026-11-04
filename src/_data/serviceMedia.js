module.exports = () => {
  const folders = {
    quick: 'gyors-mosas',
    exterior: 'alapos-kulso-mosas-es-vedelem',
    interior: 'belso-tisztitas-es-apolas',
    complete: 'kulso-belso-tisztitas-es-apolas',
  };
  const descriptions = {
    quick: [
      {
        before: 'Narancssárga Kia XCeed poros karosszériával és szennyezett kerekekkel, külső mosás előtt.',
        after: 'Narancssárga Kia XCeed tiszta karosszériával és ápolt kerekekkel, külső mosás után.',
      },
      {
        before: 'Szürke autó poros fekete alufelnije és szennyezett gumioldalfala tisztítás előtt.',
        after: 'Fekete alufelni megtisztított külső felülettel és ápolt gumioldalfallal.',
      },
    ],
    exterior: [
      {
        before: 'Narancssárga Kia XCeed poros karosszériája és kerekei az alapos külső tisztítás előtt.',
        after: 'Narancssárga Kia XCeed tiszta, fényes karosszériával és ápolt kerekekkel a külső tisztítás után.',
      },
      {
        before: 'Sötétkék Ford Transit poros karosszériával és szennyezett külső műanyagokkal, mosás előtt.',
        after: 'Sötétkék Ford Transit megtisztított karosszériával, kerekekkel és ápolt külső műanyagokkal.',
      },
    ],
    interior: [
      {
        before: 'Ford Transit vezetőtere poros műszerfallal és szennyezett gumiszőnyegekkel, belső tisztítás előtt.',
        after: 'Ford Transit vezetőtere megtisztított műszerfallal, kezelőszervekkel és gumiszőnyegekkel.',
      },
      {
        before: 'Lexus vezetőtere szennyezett lábtérrel és használati nyomokat mutató bőrüléssel, tisztítás előtt.',
        after: 'Lexus vezetőtere tiszta lábtérrel, megtisztított középkonzollal és ápolt bőrüléssel.',
      },
    ],
    complete: [
      {
        before: 'Sötétkék Ford Transit poros karosszériája és kerekei külső tisztítás előtt.',
        after: 'Sötétkék Ford Transit tiszta karosszériával, ápolt kerekekkel és külső műanyagokkal.',
      },
      {
        before: 'Honda nyitott motortere poros motorburkolattal és szennyezett környező felületekkel, tisztítás előtt.',
        after: 'Honda motortere megtisztított motorburkolattal és ápolt műanyag felületekkel, motortérkezelés után.',
        caption: 'Motortér tisztítása és ápolása – külön kérhető kezelés, a külső-belső alapcsomag nem tartalmazza.',
      },
    ],
  };

  return Object.fromEntries(Object.entries(folders).map(([key, folder]) => [key, {
    mediaTitle: 'Eredmények képekben',
    mediaIntro: 'Előtte–utána képpárok. Kattints a képekre a nagyításhoz.',
    comparisons: descriptions[key].map((description, index) => ({
      ...Object.fromEntries([
        ['before', 'elotte'],
        ['after', 'utana'],
      ].map(([side, suffix]) => [side, {
        src: `/assets/images/szolgaltatasok/${folder}/0${index + 1}-${suffix}.webp`,
        alt: description[side],
        width: 1200,
        height: 900,
      }])),
      caption: description.caption,
    })),
    workPhotos: [],
  }]));
};
