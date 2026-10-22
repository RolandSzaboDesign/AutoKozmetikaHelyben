# Autókozmetika helyben — v2

Eleventy 3 alapú statikus oldal. A helyi v2 nem módosítja az élő weboldalt.

## Helyi használat

Node.js 20 vagy újabb verzióval:

```sh
npm ci
npm start
```

A szerver címét az Eleventy kiírja. A helyi előnézet a `.local/preview` mappába épül, így nem írja felül a közzétehető `public` változatot. A helyi előnézetben nincs Ahrefs-mérés. Az űrlap ugyanazt a natív POST-beküldést használja, mint az éles oldal; helyben nincs Netlify Forms-feldolgozás, így a sikeres kézbesítés itt nem tesztelhető. A kötelező mezők ellenőrzése és a kampánymezők kitöltése helyben is működik.

## Felépítés

- `src/index.html`: főoldal és Netlify Forms űrlap.
- `src/_includes/base.html`: közös keret, metaadatok, fejléc, lábléc.
- `src/_data/`: elérhetőségek, GYIK, vélemények, strukturált adatok.
- `src/assets/css/style.css`: reszponzív megjelenés.
- `src/assets/js/main.js`: kampányadatok, GYIK, megjegyzésmező fókusza.
- `public/`: az `npm run build` által előállított, közzétehető oldal.

## Közzététel a meglévő Netlify-oldalon

Buildparancs: `npm run build`. Közzétételi mappa: `public`. Ezeket a projekt `netlify.toml` fájlja is rögzíti. Az egyedi hibaoldal a Netlify által felismert `404.html` néven készül.

Megtartott űrlapazonosító: `visszahivas`; beküldési útvonal: `/koszonom/`; spamcsapda: `bot-field`. Az eredeti mezőnevek, UTM-mezők és `landing_url` változatlanok. A Netlify adminfelületén a formfeldolgozás, értesítések és domainbeállítások külön ellenőrzendők. Éles kézbesítést csak a Netlify-on lehet igazolni.

Az Ahrefs mérőkód a normál buildben megmarad. A SEO title, canonical URL, OG/Twitter adatok, robots.txt, sitemap, Service és FAQPage strukturált adatok továbbra is készülnek. Az adatkezelési, köszönő- és 404-es oldalak megtartják a `noindex` jelölést.

A két Google-vélemény a tulajdonos által megadott képernyőképekből származik. A rövidített, szó szerinti részletek mellett a forrás jelölve van; a teljes átirat az adatfájlban marad. A Google-link a megadott vállalkozásprofilra mutat, nem egyedi értékelésre. Relatív dátumot és összesített értékelésszámot nem jelenítünk meg.

A Manrope és a Fraunces változó betűtípus a Google Fonts hivatalos tárhelyéről származik, saját fájlként töltődik be. A latin-ext karakterkészletet megtartottuk. A főcímek Fraunces, a törzsszöveg Manrope betűtípust használ. A licencek az `src/assets/fonts` mappában vannak.
