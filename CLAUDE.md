# wijnparade: werkafspraken voor Claude

Statische site over wijnadressen in Europa, met Netlify en Decap CMS. Communiceer in het **Nederlands**.

- **wijn-parade.nl:** Nederlands, merk "de_wijnparade", Instagram @de_wijnparade
- **winehotspotter.com:** Engels, merk "WineHotspotter" (aan elkaar), Instagram @winehotspotter

## Werkwijze met de eigenaar

- Werk op de branch die de sessie opgeeft en maak per wijziging een pull request met een Nederlandse beschrijving.
- **Voeg nooit zelf samen.** De eigenaar voegt samen en meldt dat met "pXX doorgevoerd". Zet daarna de werkbranch gelijk met main (fast-forward).
- **Inhoud** (nieuwe locaties, teksten, artikelen): laat eerst de NL- en EN-tekst en screenshots zien, en commit pas na "akkoord".
- Komt er een merge-conflict door een CMS-wijziging op main, dan voeg je main samen en neem je de wijziging van de eigenaar over. Nooit force-pushen.
- Afbeeldingen die midden in een beurt binnenkomen worden niet opgeslagen. Vraag de eigenaar ze opnieuw te sturen als los bericht.

## Inhoudsregels

- Geen prijzen in teksten.
- Geen recensies of externe bronnen noemen ("volgens Gault&Millau"), tenzij het echt bijzonder is: een Michelinster, de Michelin Sommelier Award, World's Best Vineyards.
- Onderscheidingen alleen uit de bron zelf of van de eigen site van de locatie. Zie de skill `onderscheidingen`.
- Verzin niets. Bij tegenstrijdige bronnen laat je het weg en meld je het.
- Foto's: gebruik foto's van de eigenaar of foto's die al op de site staan. Neem geen foto's over van andere websites. Zet ze om met ImageMagick: `convert in -resize '1200x>' -quality 82 uploads/<slug>.webp`.
- Nieuwe locaties: volg de skill `nieuwe-locatie`. De slug is ASCII zonder accenten.

## Techniek

- **Build:** `bash build.sh` draait `geocode-missing.js`, dan `build-indexes.js` (alle NL- en /en/-pagina's) en dan `build-en-site.js` (Engelse site in `dist-en/`).
- **Na een lokale build** wijzigt de build bestanden die in git staan. Zet die terug en ruim op:
  `git checkout -q index.html wijnkaart.html wijnreizen.html content/locations/_index.json content/regions/_index.json && git clean -fdq && rm -rf dist-en`
  Draai nooit twee keer achter elkaar een build zonder eerst terug te zetten. Dan krijg je "EN-versie van index.html: tekst niet gevonden".
- **Front matter:** een eigen parser, dus alleen vlakke velden. `awards` moet het laatste veld zijn.
- **Netlify:** twee sites op dezelfde repository.
  - wijnparade publiceert `.`.
  - winehotspotter publiceert `dist-en`.
  - `netlify.toml` mag geen `publish` bevatten.
- **site-config.json**
  - `en_site`: domein, merk, Instagram, `live`, `analytics_id` (G-T6DRT0Y3PL) en `pinterest_verify`.
  - `nl_site.pinterest_verify`.
- **Engelse site:** foto's en `/content/*` worden via een proxy van wijn-parade.nl gehaald (`dist-en/_redirects`). Alle `/en/`-adressen sturen met een 301 door naar winehotspotter.com.
- **Coördinaten:** bij nieuwe locaties direct lat/lng invullen. Haal ze op via de eigen functie:
  `curl -s -X POST https://wijn-parade.nl/.netlify/functions/geocode -H 'Content-Type: application/json' -d '{"address":"<adres>"}'`
  Daarvoor moet de sessie op de omgeving "wijnparade" draaien, waarin wijn-parade.nl is toegestaan.
  Lukt het niet, dan vult `geocode-missing.js` ze bij de build in en zet ze in `/geocoded.txt`.
- **Artikelen:** `[[overnachten:id]]` en `[[proeverij:id]]` in een artikel worden vervangen door het overnachtings- of proeverijblok van die locatie.
- **Wijn-spijs:** `content/dishes-pairing` en `content/wines-pairing` hebben de velden `dish_en`/`wine_en`, `slug_en` en `intro_en`, plus `name_en`/`dish_en` in de lijsten.
- **Pinterest-pins:** worden lokaal gemaakt met `node build-indexes.js && node build-en-site.js && node make-pins.js`, met uitvoer in `uploads/pins/`. Dat draait niet op Netlify.
- **Netwerk:** veel sites worden geblokkeerd door de proxy. WebSearch werkt, WebFetch vaak niet.

## Nog open (november 2026)

- Affiliate-links instellen in `affiliate.json` (Booking via CJ en Winalist) zodra de eigenaar is goedgekeurd. winehotspotter.com moet daar ook als site worden aangemeld.
