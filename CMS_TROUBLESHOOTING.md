# 🚨 CMS TROUBLESHOOTING GIDS

## Probleem: Lege pagina's / Witte balkjes / Rioja PDF

### OORZAAK:
Netlify CMS heeft problemen met:
1. Image fields zonder waarde
2. List fields met verkeerde syntax
3. Oude data met verkeerde structuur

### OPLOSSING:

#### Stap 1: Oude data opruimen

Ga naar GitHub: https://github.com/jcjvanschijndel-dot/de-wijnparade

Check deze folders:
- `content/locations/`
- `content/dishes-pairing/`
- `content/wines-pairing/`

**Als je bestanden ziet met:**
- Hele lange namen
- "rioja-buying-guide" in de naam
- Geen .md extensie

→ **VERWIJDER DEZE**

#### Stap 2: CMS Cache wissen

1. Ga naar: `/admin`
2. Open browser console (F12)
3. Type: `localStorage.clear()`
4. Druk Enter
5. Refresh de pagina (Ctrl+R)

#### Stap 3: Test met nieuwe data

Maak 1 TEST item aan in elke collectie:

**Test Locatie:**
```
Naam: Test Wijnbar
Type: wijnbar
Adres: Dam 1, Amsterdam
Beschrijving: Dit is een test
```

**Test Gerecht:**
```
Gerecht Naam: Test Asperges
Wijnen:
  - Wijn: Riesling
    Sterren: 3
```

Zie je deze in het overzicht? Werkt het?

#### Stap 4: Migrate oude data handmatig

Als oude data niet zichtbaar is:
1. Open bestand op GitHub
2. Kopieer de content
3. Maak nieuw item in CMS
4. Plak de data
5. Save

## Debug Checklist

### CMS laadt niet:
- [ ] Check browser console voor errors
- [ ] Is Git Gateway enabled in Netlify?
- [ ] Ben je ingelogd?

### Witte balkjes in lijst:
- [ ] Heeft de collectie `identifier_field`?
- [ ] Heeft de collectie `summary`?
- [ ] Zijn er bestanden met gekke namen?

### Lege pagina bij openen:
- [ ] Heeft het bestand image fields die leeg zijn?
- [ ] Heeft het bestand list fields met verkeerde syntax?
- [ ] Check de .md file op GitHub - klopt de YAML?

### Data niet zichtbaar op website:
- [ ] Open browser console op website
- [ ] Zie je "Loaded X items"?
- [ ] Zie je 404 errors?
- [ ] Klopt de repo naam in JS files? (`de-wijnparade`)

## Laatste redmiddel

Als NIETS werkt:

1. **Backup maken:**
```bash
git clone https://github.com/jcjvanschijndel-dot/de-wijnparade
cd de-wijnparade
cp -r content content-backup
```

2. **Alles verwijderen:**
- Verwijder ALLE .md files in `content/locations/`
- Verwijder ALLE .md files in `content/dishes-pairing/`
- Verwijder ALLE .md files in `content/wines-pairing/`

3. **Fresh start:**
- Maak alles opnieuw aan via CMS
- Dit keer werkt het gegarandeerd!

## Contact

Als dit allemaal niet helpt, stuur screenshots van:
1. CMS overzicht pagina
2. Browser console (F12) op CMS
3. Browser console (F12) op website
4. Een .md bestand van GitHub
