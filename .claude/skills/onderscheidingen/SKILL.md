---
name: onderscheidingen
description: Onderscheidingen (Michelin, Gault&Millau, Decanter, Star Wine List, James Suckling, Lekker, Robert Parker, World's 50 Best, Wine Spectator, Gambero Rosso, Falstaff, Guía Peñín, La Revue du Vin de France, Raisin) opzoeken en bijwerken in het veld "awards" van locaties in content/locations. Gebruik dit bij een nieuwe locatie, als de gebruiker vraagt de onderscheidingen te controleren of bij te werken, en bij de automatische update per kwartaal.
---

# Onderscheidingen opzoeken en bijwerken

Elke locatie kan een lijst `awards` hebben. Die verschijnt als vlak "Onderscheidingen" op de locatiepagina (NL en EN) en als `award` in de gestructureerde gegevens voor Google. Communiceer met de gebruiker in het Nederlands.

## Welke onderscheidingen

Alleen deze bronnen (exact zo geschreven in het veld `name`):

| name | Wat telt | Bron |
|---|---|---|
| `Michelin` | ster(ren), Groene Ster, Bib Gourmand, Keys (hotels). Een gewone vermelding in de gids alleen bij restaurants zonder ster. | guide.michelin.com |
| `Gault&Millau` | punten en/of koksmutsen (toques), of een prijs van het jaar | de Gault&Millau-site van het land (gaultmillau.nl, gaultmillau.be, gaultmillau.fr, gaultmillau.de, gaultmillau.at, gaultmillau.it, enz.) |
| `Decanter` | Decanter World Wine Awards: Best in Show of Platinum; of een vermelding als restaurant of wijnbar in een Decanter-lijst | decanter.com, awards.decanter.com |
| `Star Wine List` | vermeld, White Star, Red Star, of een Star Wine List Award (winnaar of finalist) | starwinelist.com |
| `James Suckling` | 97 punten of meer voor een wijn van het huis, of een plek in zijn jaarlijkse top 100 | jamessuckling.com |
| `Lekker` | plaats in de Lekker-lijst (bijv. Lekker 500) of een prijs van Lekker | lekker.nl |
| `Robert Parker` | 97 punten of meer van The Wine Advocate voor een wijn van het huis | robertparker.com |
| `World's 50 Best` | plaats in The World's 50 Best Restaurants (top 100) of World's Best Vineyards (top 100) | theworlds50best.com, worldsbestvineyards.com |
| `Wine Spectator` | Restaurant Award: Award of Excellence, Best of Award of Excellence of Grand Award | winespectator.com/restaurantawards |
| `Gambero Rosso` | Tre Bicchieri voor een wijn van het huis, of een prijs van het jaar | gamberorosso.it |
| `Falstaff` | hoge score of sterren in de Falstaff-wijngids, of punten/vorken in de bar- en restaurantgids | falstaff.com |
| `Guía Peñín` | 95 punten of meer voor een wijn van het huis, of een prijs voor de wijnkaart | guiapenin.wine |
| `La Revue du Vin de France` | sterren in de Guide des meilleurs vins de France, of een prijs van het jaar (bijv. Caviste de l'Année) | larvf.com |
| `Raisin` | vermeld als natuurwijnbar, -restaurant of -winkel | raisin.digital |

## Waar je het mag vinden

- **Alleen bij de bron zelf:** de website van de gids of prijs (zie de tabel), of de **eigen website van de locatie** als die de onderscheiding noemt (bijv. "1 Michelinster" op de homepage).
- **Niet** uit onze eigen teksten in `content/locations`, niet van Tripadvisor, Wikipedia, blogs of nieuwssites.
- Spreken de gids en de website van de locatie elkaar tegen, dan geldt de gids (die is actueler).
- Vind je het niet terug bij de bron: niet invullen. Bij twijfel weglaten.
- Let op naamgenoten: controleer plaats en adres.
- Hoort de onderscheiding bij een ander bedrijf (bijv. het sterrenrestaurant van een buurman of de vorige zaak van de chef), dan telt hij niet. Hoort hij bij een restaurant op het terrein van een wijnhuis of hotel dat bij ons de locatie is, dan wel, met de naam van het restaurant tussen haakjes in `detail`.

## Hoe je het invult

```yaml
awards:
  - name: "Michelin"
    detail: "1 ster + Groene Ster"
    detail_en: "1 star + Green Star"
    year: "2026"
  - name: "Gault&Millau"
    detail: "16 punten"
    detail_en: "16 points"
    year: "2026"
```

- `detail`: kort en in het Nederlands, zoals de gids het noemt: "1 ster", "2 sterren", "Bib Gourmand", "16 punten", "2 koksmutsen", "White Star", "Platinum", "98 punten voor Barolo Cannubi 2019".
- `detail_en`: hetzelfde in het Engels ("1 star", "16 points", "2 toques"). Leeg laten mag als het gelijk is.
- `year`: het jaar van de gids of prijs. Weet je het jaar niet zeker, laat het weg.
- Maximaal één regel per onderscheiding en per bron; hooguit 4 regels per locatie. Kies dan de belangrijkste.
- Zet `awards` als laatste veld in de frontmatter. Alle waarden tussen dubbele aanhalingstekens. Controleer met een YAML-parser.
- Zet onderscheidingen **niet** in de beschrijving (`description`); daar blijft de regel uit de skill nieuwe-locatie gelden.

## Bij een nieuwe locatie

Zoek de bronnen na voor de nieuwe locatie: bij restaurants vooral Michelin, Gault&Millau, Lekker (Nederland), World's 50 Best en Wine Spectator; bij wijnbars Star Wine List en Raisin; bij wijnhuizen Decanter, James Suckling, Robert Parker, World's Best Vineyards en de gids van het land (Gambero Rosso, Falstaff, Guía Peñín, La Revue du Vin de France). Laat wat je vond, met de link naar de bron, zien in de akkoordronde.

## Bronlijst en script: awards.json en apply-awards.js

Onderscheidingen worden niet per locatie opgezocht, maar per bron en per land:

- `awards.json` in de root bevat de officiële lijsten, één regel per onderscheiding:
  `{ "source": "Michelin", "name": "Azurite", "aliases": ["…"], "city": "Delft", "detail": "2 sterren", "detail_en": "2 stars", "year": "2026", "url": "<bronlink>" }`.
  `source` is precies een naam uit de tabel hierboven; `url` is de link naar de bron (verplicht). `aliases` alleen als de locatie op de site een andere naam of schrijfwijze heeft.
- `node apply-awards.js` is een droogloop: het koppelt elke regel op naam en plaats aan precies één locatie en laat zien wat er zou veranderen. `--write` schrijft het veld `awards` in de locatiebestanden.
- Per locatie vervangt het script alleen de onderscheidingen van dezelfde bron. Het verwijdert zelf nooit iets: onderscheidingen die op de site staan maar niet (meer) in `awards.json`, staan in het rapport `apply-awards-report.json` onder `nietInBronlijst`.
- Het rapport (`apply-awards-report.json`) is een werkbestand: niet committen.

Hoe je de bronnen leest:
- **Michelin:** de volledige lijsten per land op guide.michelin.com (sterren en Bib Gourmand) zijn gewone pagina's.
- **Lekker500:** lekker.nl laadt de lijst met JavaScript; de volledige Top 100 staat ook op derestaurantkrant.nl.
- **Star Wine List:** blokkeert bots; gebruik zoekresultaten of de eigen pagina van de locatie.
- **Robert Parker, James Suckling, Wine Spectator:** grotendeels achter een betaalmuur. Alleen invullen als de bron het zonder betaalmuur toont; anders overslaan.

## Update van alle locaties (elk kwartaal)

1. Werk vanaf de nieuwste `main` op een nieuwe branch `claude/onderscheidingen-<jaar>-q<kwartaal>`.
2. **Ververs per bron de lijst in `awards.json`.** Haal per bron en per land één keer de actuele officiële lijst op en zet die in `awards.json` (met bronlink en jaar). Houd alleen regels voor locaties die op de site staan, plus de regels die nog niet gekoppeld konden worden.
3. **Droogloop:** `node apply-awards.js`. Bekijk:
   - *Geen match*: staat de locatie wel op de site onder een andere naam of schrijfwijze, voeg `aliases` toe. Staat hij er niet op, laat de regel staan en meld hem.
   - *Meerdere matches*: maak de regel scherper (plaats, aliases).
   - *Niet in de bronlijst*: onderscheidingen die op de site staan maar niet meer in de nieuwe lijst. **Niet zelf verwijderen**; zet ze in de pull request ter beoordeling.
4. `node apply-awards.js --write`, daarna `node build-indexes.js`. Controleer dat de build slaagt en zet de gegenereerde bestanden terug: `git checkout index.html wijnkaart.html wijnreizen.html content/locations/_index.json content/regions/_index.json` en `git clean -fd` (na `git add` van wat je wilt houden). Commit alleen de gewijzigde `.md`-bestanden en `awards.json`.
5. Maak **één** pull request in het Nederlands met:
   - een tabel per gewijzigde locatie: oud → nieuw, met de bronlink;
   - de regels zonder match (en waarom);
   - de onderscheidingen uit *Niet in de bronlijst*, zodat de gebruiker beslist of ze weg moeten.
6. **Voeg nooit zelf samen.** De gebruiker controleert en publiceert. Pas alleen het veld `awards` en `awards.json` aan, geen teksten of andere velden.
