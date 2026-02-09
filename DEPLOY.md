# 🚀 DEPLOYMENT INSTRUCTIES

## ⚡ Snelle Deploy (2 minuten)

### Optie 1: Via GitHub (Aanbevolen - met CMS)

1. **GitHub Repository maken**
   - Ga naar [github.com](https://github.com)
   - Klik "New repository"
   - Naam: `de-wijnparade`
   - Klik "Create repository"

2. **Code uploaden**
   - Pak de ZIP uit
   - Ga naar je repository
   - Klik "uploading an existing file"
   - Sleep ALLE bestanden (ook netlify.toml!)
   - Commit changes

3. **Koppel aan Netlify**
   - Ga naar [netlify.com](https://app.netlify.com)
   - "Add new site" → "Import an existing project"
   - Kies GitHub
   - Selecteer je repository
   - **BELANGRIJK**: Build settings:
     - Build command: (laat leeg)
     - Publish directory: `.` (een punt!)
   - Deploy!

4. **CMS Activeren**
   - In Netlify → Identity → Enable Identity
   - Settings → Registration → Invite only
   - Invite users → Voeg je email toe
   - Services → Git Gateway → Enable
   - Ga naar `jouw-site.netlify.app/admin`
   - Accepteer uitnodiging & maak wachtwoord

### Optie 2: Drag & Drop (Zonder CMS)

1. Pak ZIP uit
2. Ga naar [netlify.com/drop](https://app.netlify.com/drop)
3. Sleep de HELE uitgepakte folder
4. Klaar!

⚠️ **Let op**: Deze methode heeft GEEN CMS. Je moet handmatig code aanpassen.

## 🌐 Eigen Domein (de-wijnparade.nl)

1. Netlify → Domain settings
2. Add custom domain → `de-wijnparade.nl`
3. Bij je domein provider (Transip/Mijn Domein/etc):
   ```
   A Record:
   @ → 75.2.60.5
   
   CNAME:
   www → jouw-site.netlify.app
   ```

## ✅ Checklist

- [ ] Alle bestanden geüpload (inclusief netlify.toml!)
- [ ] Publish directory = `.` (punt)
- [ ] Site deployt zonder errors
- [ ] Identity enabled (voor CMS)
- [ ] Git Gateway enabled (voor CMS)
- [ ] Admin werkt op /admin

## 🆘 Problemen?

**"Site not found"**
→ Publish directory moet `.` zijn, niet `public`

**"CMS werkt niet"**
→ Zorg dat Identity én Git Gateway enabled zijn

**"Kaart laadt niet"**
→ Werkt alleen online, niet lokaal. Wacht tot deploy klaar is.

**"Formulier werkt niet"**
→ Netlify Forms werkt automatisch na deploy

Succes! 🍷