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

## Update van alle locaties (elk kwartaal)

1. Werk vanaf de nieuwste `main` op een nieuwe branch `claude/onderscheidingen-<jaar>-q<kwartaal>`.
2. Loop alle `content/locations/*.md` langs (sla `_index.json` over). Doe het per regio of per type in porties, zodat je het overzicht houdt.
3. Per locatie:
   - controleer bestaande onderscheidingen: staan ze nog bij de bron, klopt het detail en het jaar? Pas aan of verwijder;
   - zoek nieuwe onderscheidingen bij de bronnen uit de tabel.
4. Draai `node build-indexes.js`, controleer dat er geen fouten zijn, en zet de gegenereerde bestanden terug: `git checkout index.html wijnkaart.html wijnreizen.html content/locations/_index.json content/regions/_index.json`. Commit alleen de gewijzigde `.md`-bestanden.
5. Maak een pull request met een Nederlandse beschrijving. Neem een tabel op met per gewijzigde locatie: oud → nieuw en de link naar de bron. Noem apart wat je verwijderd hebt en waarom.
6. **Voeg nooit zelf samen.** De gebruiker controleert en publiceert.
