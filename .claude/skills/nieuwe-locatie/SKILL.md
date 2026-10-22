---
name: nieuwe-locatie
description: Een nieuwe wijnlocatie (wijnhuis, wijnbar, restaurant of wijnwinkel) toevoegen aan de wijnparade op basis van een naam en adres. Gebruik dit als de gebruiker vraagt om een of meer nieuwe locaties toe te voegen, bijvoorbeeld "nieuwe locatie: Belsit, Via Alba 17, La Morra".
---

# Nieuwe locatie toevoegen

De gebruiker geeft een naam en adres, soms met een foto of extra informatie. Jij zoekt de rest uit, schrijft de teksten en maakt het locatiebestand. **Niets wordt gepubliceerd zonder akkoord van de gebruiker.** Communiceer met de gebruiker in het Nederlands.

Meerdere locaties tegelijk mag: werk ze allemaal af en lever ze samen in één ronde ter controle en in één pull request.

## 1. Controleren of de locatie al bestaat

- Zoek in `content/locations/*.md` op naam (ook zonder accenten en hoofdletters) en op adres.
- Bestaat hij al, meld dat en vraag of de bestaande locatie moet worden aangepast.

## 2. Informatie verzamelen

Zoek op internet (officiële website, Google-vermelding, recensies, gidsen) naar:

- het **type**: precies één van `wijnhuis`, `wijnbar`, `restaurant`, `wijnwinkel`
- de **website** (officiële site; geen Tripadvisor of andere platforms; is er alleen Instagram, gebruik dat)
- het **volledige adres** zoals Google het schrijft, met het land in het Nederlands (bijv. "Italië", "Frankrijk", "Spanje")
- de **coördinaten** (lat/lng, minstens 6 decimalen)
- feiten voor de tekst: wat er bijzonder is, specialiteiten, wijnen of druiven, proeverijen en rondleidingen, keuken, sfeer, ligging, geschiedenis, of reserveren nodig is

**Verzin niets.** Alleen feiten die je in een bron vindt. Twijfel je over iets, laat het weg of meld het aan de gebruiker. Noem geen openingstijden of prijzen; die veranderen te vaak.

## 3. Teksten schrijven

**Nederlandse beschrijving (`description`)**

De stijl en opbouw hieronder zijn afgeleid van alle gepubliceerde teksten in `content/locations/` (541 teksten, oktober 2026). Lees vóór het schrijven ook 3 tot 5 bestaande teksten van hetzelfde type en uit dezelfde streek, bijvoorbeeld `wijngoed-fromberg.md` (wijnhuis), `bottleshop.md` (wijnbar), `schloss-gobelsburg.md` (wijnhuis), `le-verger-des-papes.md` (restaurant) en `wijnkoperij-van-bilsen.md` (wijnwinkel).

*Lengte*
- Minimaal 60 woorden. Gangbaar is 70 tot 140 (mediaan 96).
- Wijnhuizen en restaurants mogen iets langer zijn (rond 100 tot 110 woorden), wijnbars en wijnwinkels iets korter (rond 80).
- Meestal twee alinea's: eerst wat het is en wat het bijzonder maakt, daarna het bezoek en praktische tips. Scheid ze met een witregel.
- Zinnen zijn kort tot middellang (gemiddeld zo'n 16 woorden).

*Opbouw*
1. **Opening: meteen de kern of het verhaal.** Begin met de ligging, de geschiedenis of het opvallendste feit, niet met "[Naam] is een …". Typische openingen in de bestaande teksten: "In het hart van …", "Een van de …", "Dit is …", "Het domein …", "Al meer dan … jaar …", "Opgericht in …", "Verstopt in …", "Op de oevers van …".
2. **Wat het bijzonder maakt:** concrete feiten zoals jaartallen, hectares, druiven, cru's, namen van eigenaar, wijnmaker of chef, onderscheidingen (Michelinster, World's Best Vineyards), de kelder, het uitzicht en de wijnkaart (aantal wijnen, per glas, Coravin, naturel).
3. **Het bezoek:** wat je er kunt doen, zoals een proeverij (hoeveel wijnen, waar), een rondleiding, eten, overnachten of een wandeling. In de helft van de teksten wordt de lezer met "je" aangesproken. Gebruik nooit "u".
4. **Afsluiting:** een praktische tip (reserveren, combineren met …) of een persoonlijk advies, vaak in de vorm "Een aanrader voor … tijdens een wijnreis door …". Hier komen plaats en streek natuurlijk terug, wat helpt bij Google.

*Toon en vormgeving*
- Persoonlijk en enthousiast, maar eerlijk. Bestaande teksten noemen ook nadelen ("Enige nadeel is dat het lastig te reserveren is", "een beetje een rommelige zaak, maar dat maakt het ook weer leuk"). Doe dat alleen als een bron het onderbouwt.
- Gedachtestreepjes (" — ") voor tussenzinnen en toelichtingen komen in driekwart van de teksten voor. Een dubbele punt wordt veel gebruikt om iets aan te kondigen ("Bijzonderheid: …", "Ook bijzonder: …", "Het absolute hoogtepunt: …").
- Spaarzaam met uitroeptekens (hooguit één, en niet in elke tekst).
- Wijn- en vaktermen gewoon gebruiken (cru, cuvée, naturelwijn, barrique, Riesling, Nebbiolo), namen van wijnen en producenten exact overnemen.
- Geen holle superlatieven ("de allerbeste", "een absolute must") tenzij het om iets aantoonbaars gaat (een prijs, een ster, een ranking). Geen marketingtaal van de website overnemen; herschrijf in eigen woorden.
- Openingstijden en prijzen alleen als ze op de officiële website staan en niet snel veranderen (bijv. "huisverkoop op zaterdag"); bij twijfel weglaten.
- Gericht op vindbaarheid in Google: noem het type, de plaats, de streek en relevante termen (bijv. "wijnproeverij", "wijnbar in Málaga") op een natuurlijke manier, vooral in de eerste en de laatste zin.
- Geen aanhalingstekens rond de hele tekst en geen markdown.

**Engelse beschrijving (`description_en`)**
- Een getrouwe vertaling van de Nederlandse tekst, in natuurlijk Brits Engels. Niets toevoegen of weglaten.

## 4. Foto

- Foto's van andere websites mag je niet overnemen (auteursrecht). Vraag de gebruiker om een eigen foto als die er niet bij zit.
- Sla de foto op als `uploads/<slug>.webp` (liefst webp, breedte rond 1200px; installeer zo nodig een hulpmiddel zoals Pillow of sharp). Lukt omzetten niet, gebruik dan het originele jpg- of png-bestand.
- Geen foto beschikbaar? Laat het veld `image` weg; de gebruiker kan de foto later via het CMS toevoegen.

## 5. Het locatiebestand maken

Bestandsnaam: `content/locations/<slug>.md`, waarbij de slug is wat het CMS ervan zou maken: de naam in kleine letters, spaties en leestekens vervangen door `-` (accenten blijven staan, bijv. `château-pape-clement`). Gebruik NFC-tekens in de bestandsnaam.

Formaat (velden in deze volgorde, lange teksten als `>-`-blok):

```yaml
---
name: Naam van de locatie
type: wijnhuis
address: Straat 1, 12345 Plaats, Land
lat: 44.6412038
lng: 7.9353245
description: >-
  Nederlandse tekst…
description_en: >-
  English text…
image: /uploads/<slug>.webp
website: https://www.voorbeeld.nl/
---
```

Zet een naam met een apostrof aan het begin, een dubbele punt of een `#` tussen aanhalingstekens. Controleer met een YAML-parser dat de frontmatter geldig is.

Vond je geen betrouwbare coördinaten? Laat `lat` en `lng` weg en meld het: de gebruiker opent de locatie dan na het samenvoegen één keer in het CMS (wijn-parade.nl/admin) en klikt op Publiceren. Het CMS vult de coördinaten dan automatisch in.

## 6. Regio controleren

- Kijk in `content/regions/*.md` (velden `minLat`/`maxLat`/`minLng`/`maxLng`) in welke regiogids de locatie valt, en meld dat ("komt in de gids Toscane").
- Valt hij in geen enkele regio: tel hoeveel locaties er in dezelfde streek liggen. Zijn dat er 9 of meer, stel dan voor om een regiogids te maken (niet zelf doen zonder akkoord).

## 7. Bouwen en controleren

1. Draai `node build-indexes.js` en controleer dat er geen fouten zijn en dat zowel `locations/<slug>.html` als `en/locations/<slug>.html` zijn gemaakt.
2. Maak met Playwright (Chromium staat klaar) een screenshot van de Nederlandse locatiepagina op desktop- en mobielformaat.
3. De build wijzigt ook bestanden die in git staan. Zet die terug voordat je iets commit: `git checkout index.html wijnkaart.html wijnreizen.html content/locations/_index.json content/regions/_index.json`. Gegenereerde, ongevolgde bestanden (o.a. `locations/`, `en/`, `wijnreis/`, `sitemap.xml`) horen niet in de commit.

## 8. Akkoord vragen (verplicht)

Laat de gebruiker in de chat zien, **vóórdat je commit of een pull request maakt**:
- de screenshots;
- de Nederlandse en Engelse tekst, het type, het adres, de website en de regio;
- wat je niet kon vinden of waarover je twijfelt, met je bronnen.

Verwerk feedback en laat het opnieuw zien. Ga pas verder als de gebruiker akkoord geeft.

## 9. Pull request

- Commit alleen het locatiebestand (en de foto), push naar de werkbranch en maak een pull request met een Nederlandse beschrijving.
- Vermeld dat de locatie pas live gaat na "Merge pull request", en dat Netlify (als Deploy Previews aanstaan) in de pull request een voorbeeldlink toont.
- **Voeg nooit zelf samen.** Publiceren doet de gebruiker.

## Regiogidsen: stijl van de intro en de korte tekst

Bij een nieuwe regiogids (`content/regions/<id>.md`) of het herschrijven van een intro. Voorbeeld van de gewenste stijl: `barcelona-penedes.md` en `bourgogne.md`.

*Intro (`description`, `description_en`)*
- 50 tot 80 woorden, drie of vier zinnen, geen witregels.
- Opbouw: (1) waar de streek ligt en wat de uitvalsbasis is, met de regionaam in de eerste zin; (2) wat er gemaakt wordt: druiven, wijnen, appellations, eventueel een of twee bekende producenten; (3) wat je er doet: een wijnroute, proeverijen, een wandeling; (4) waarmee je het combineert: steden, dorpen, eten.
- Concreet en zakelijk: plaatsnamen, druiven en wijnnamen in plaats van sfeerbeelden. Geen superlatieven of clichés ("legendarisch", "Mekka", "bedevaart", "perfect", "ideaal", "verborgen parels", "de beste ter wereld").
- Jaartallen en getallen alleen als ze vaststaan; bij tegenstrijdige bronnen weglaten.

*Korte tekst (`short_description`, `short_description_en`)*
- Eén zin van 12 tot 22 woorden voor het overzicht op /wijnreizen: wat je er vindt en waar, bijvoorbeeld "Pinot noir en chardonnay van Chablis tot de Mâconnais, met Beaune en de Route des Grands Crus als middelpunt."
- Herhaal de regionaam niet; die staat er al boven.

*SEO*
- Titel en h1 van de gids worden automatisch gemaakt ("Wijnreis X: tips voor wijnhuizen, wijnbars en restaurants"); daar hoeft de intro niet voor te zorgen.
- De meta description (de tekst onder de link in Google) is de korte tekst plus "Tips voor wijnhuizen, wijnbars en restaurants." Houd de korte tekst daarom onder de 115 tekens; is hij langer, dan blijft alleen de korte tekst over (maximaal 160 tekens).
- De intro helpt vooral met concrete zoektermen (plaatsen, druiven, appellations, routes) die mensen naast de regionaam zoeken.

Laat de nieuwe of herschreven teksten (NL en EN) eerst aan de gebruiker zien en wacht op akkoord.
