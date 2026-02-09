# de_wijnparade Website

Moderne, minimalistische website voor de_wijnparade met Netlify CMS integratie.

## 🎨 Design
- **Kleurenschema**: Wit basis + Navy (#1e3a8a)
- **Stijl**: Modern & minimalistisch
- **Mobiel**: Volledig geoptimaliseerd (mobile-first)

## 📦 Wat zit erin?

### Pagina's:
1. **Homepage** (`index.html`) - Overzicht met 4 secties
2. **Toplijsten** (`toplists.html`) - Links naar Google Sheets/PDFs per regio
3. **Favorieten** (`favorites.html`) - Persoonlijke aanraders
4. **Gerechten & Wijn** (`pairings.html`) - Eten en wijn combinaties
5. **Recepten** (`recipe.html`) - Individuele receptpagina's
6. **Wijnkaart** (`map.html`) - Interactieve kaart met OpenStreetMap

### Features:
- ✅ Netlify CMS voor content beheer
- ✅ Netlify Forms ("Geef je tips door!")
- ✅ OpenStreetMap wijnlocaties
- ✅ Mobiel geoptimaliseerd
- ✅ Moderne, strakke vormgeving

## 🚀 Deployment naar Netlify

### Stap 1: Maak GitHub Repository
1. Ga naar [github.com](https://github.com) en maak een account
2. Klik op "New repository"
3. Naam: `de-wijnparade-website`
4. Maak repository aan (public of private)

### Stap 2: Upload Code naar GitHub
1. Download deze hele folder
2. Ga naar je repository op GitHub
3. Klik "Add file" → "Upload files"
4. Sleep alle bestanden en mappen erin
5. Klik "Commit changes"

### Stap 3: Deploy naar Netlify
1. Ga naar [netlify.com](https://netlify.com) en maak account
2. Klik "Add new site" → "Import an existing project"
3. Kies "GitHub"
4. Selecteer je repository `de-wijnparade-website`
5. Build settings:
   - Build command: (laat leeg)
   - Publish directory: `public`
6. Klik "Deploy site"
7. Klaar! Je site is live binnen 1-2 minuten

### Stap 4: Eigen domein koppelen (www.de-wijnparade.nl)
1. In Netlify dashboard → "Domain settings"
2. Klik "Add custom domain"
3. Voer `de-wijnparade.nl` in
4. Netlify geeft DNS instructies
5. Ga naar je domein provider en update DNS:
   ```
   Type: A
   Name: @
   Value: 75.2.60.5

   Type: CNAME
   Name: www
   Value: [jouw-site].netlify.app
   ```

## ⚙️ Netlify CMS Instellen

### Stap 1: Enable Identity
1. In Netlify dashboard → "Identity"
2. Klik "Enable Identity"
3. Settings → Registration → "Invite only"
4. Klik "Invite users" en voeg je eigen email toe

### Stap 2: Enable Git Gateway
1. Nog steeds in Identity settings
2. Scroll naar "Services" → "Git Gateway"
3. Klik "Enable Git Gateway"

### Stap 3: Toegang tot CMS
1. Ga naar `jouw-site.netlify.app/admin`
2. Accepteer de uitnodiging in je email
3. Maak een wachtwoord aan
4. Log in!

## 📝 Content Beheren via CMS

### Na inloggen op `/admin`:

#### Toplijsten Toevoegen:
1. Klik "Toplijsten" in sidebar
2. Klik "New Toplijsten"
3. Vul in:
   - Titel: "Bordeaux Toplijst 2025"
   - Emoji: 🇫🇷
   - Link: je Google Sheets URL of PDF link
   - Volgorde: 1 (bepaalt volgorde op pagina)
4. Klik "Publish"

#### Favorieten Toevoegen:
1. Klik "Favorieten"
2. Zelfde proces als Toplijsten

#### Recepten Toevoegen:
1. Klik "Recepten"
2. Klik "New Recepten"
3. Vul alle velden in
4. Upload foto
5. Voeg ingrediënten toe (elk op nieuwe regel)
6. Voeg bereidingsstappen toe
7. "Publish"

#### Wijnlocaties Toevoegen:
1. Klik "Wijnlocaties"
2. Vul naam, type, adres in
3. **Latitude & Longitude vinden:**
   - Ga naar Google Maps
   - Zoek de locatie
   - Rechtsklik op marker
   - Klik op coördinaten (worden gekopieerd)
   - Eerste getal = Latitude
   - Tweede getal = Longitude
4. Upload foto
5. Voeg website toe
6. "Publish"

## 🗺️ Wijnkaart Werking

De kaart gebruikt OpenStreetMap (volledig gratis, geen API key nodig).

Locaties worden gefilterd op:
- 🍾 Wijnbars
- 🏪 Wijnwinkels  
- 🏰 Wijnhuizen

Klik op marker voor popup met foto, info en website link.

## 📧 Formulier ("Geef je tips door!")

- Automatisch via Netlify Forms
- Gratis: 100 submissions/maand
- Submissions bekijken in Netlify dashboard → "Forms"
- Email notificaties instellen in Forms settings

## 🔄 Website Updaten

### Via CMS (aanbevolen):
1. Ga naar `/admin`
2. Log in
3. Pas content aan
4. Klik "Publish"
5. Netlify deploy automatisch binnen 1 minuut

### Via GitHub (voor code wijzigingen):
1. Ga naar je GitHub repository
2. Navigeer naar bestand
3. Klik potlood icoon (edit)
4. Pas aan en "Commit changes"
5. Netlify deploy automatisch

## 📱 Mobiel Testen

Website is geoptimaliseerd voor:
- iPhone (alle maten)
- Android phones
- Tablets
- Desktop

Test op echte devices of gebruik browser developer tools (F12 → device toolbar).

## 🎨 Kleuren Aanpassen

In `public/styles.css`, regel 9-16:
```css
:root {
    --navy: #1e3a8a;           /* Hoofdkleur */
    --navy-dark: #1e40af;      /* Donkerder */
    --navy-light: #3b82f6;     /* Lichter */
    --white: #ffffff;          /* Basis */
    --gray-50: #f9fafb;        /* Achtergrond */
}
```

## ❓ Veelgestelde Vragen

**Q: Kan ik PDFs uploaden via CMS?**
A: Ja! Bij een link-veld kun je ook een geüploade PDF kiezen.

**Q: Hoe voeg ik een Rioja PDF toe?**
A: Upload `rioja2025.pdf` naar `/public` folder via GitHub. Link: `/rioja2025.pdf`

**Q: Werkt de kaart lokaal niet?**
A: Correct, Leaflet heeft problemen met lokale bestanden. Werkt perfect zodra op Netlify!

**Q: Hoe krijg ik email notificaties van formulier?**
A: Netlify dashboard → Forms → Form notifications → Add notification

**Q: Kan ik de volgorde van items wijzigen?**
A: Ja! Elk item heeft een "Volgorde" veld. Lagere nummers verschijnen eerst.

## 📞 Hulp Nodig?

- Netlify docs: https://docs.netlify.com
- Netlify CMS docs: https://decapcms.org/docs
- Leaflet docs: https://leafletjs.com

## 🎉 Klaar!

Je website is nu live, heeft een CMS voor eenvoudig beheer, en is volledig mobiel geoptimaliseerd!

Veel succes! 🍷