# ⚠️ BELANGRIJK: Netlify Environment Variables instellen

Na het uploaden van deze bestanden naar GitHub, moet je de Geocoding API key instellen in Netlify.

## 📝 Stappen:

1. **Ga naar je Netlify dashboard:**
   https://app.netlify.com/

2. **Selecteer je site** (wijn-parade)

3. **Ga naar: Site configuration → Environment variables**
   Of direct: https://app.netlify.com/sites/[jouw-site-naam]/configuration/env

4. **Klik: "Add a variable"**

5. **Voeg toe:**
   ```
   Key:   GOOGLE_GEOCODING_API_KEY
   Value: AIzaSyD0hE8QQ9BC2vLml6dv90NOcbqbRWYqJNg
   Scopes: All scopes (Builds, Functions, Post processing)
   ```

6. **Klik: "Create variable"**

7. **Trigger een nieuwe deploy:**
   - Ga naar: Deploys tab
   - Klik: "Trigger deploy" → "Deploy site"

## ✅ Wat is nu veilig:

- ✅ **Maps API key** (in map.html): Publiek zichtbaar maar beschermd met HTTP referrer restrictions
- ✅ **Geocoding API key**: Server-side in Netlify Function, NIET in GitHub code

## 🗺️ API Keys overzicht:

### Maps JavaScript (publiek, restricted):
```
AIzaSyB7XhwbjOwiUGzJ_qpCFhhWHdNRogD1Vgo
```
- Gebruikt in: map.html
- Veilig omdat: HTTP referrer restrictions (alleen wijn-parade.nl werkt)

### Geocoding (geheim, server-side):
```
AIzaSyD0hE8QQ9BC2vLml6dv90NOcbqbRWYqJNg
```
- Gebruikt in: Netlify Function (server-side)
- Veilig omdat: Niet in code, alleen als environment variable

## 🧪 Test:

Na deploy:
1. Ga naar /admin
2. Maak nieuwe locatie
3. Vul adres in: "Dam 1, Amsterdam"
4. Publish
5. Lat/Lng worden automatisch ingevuld via Netlify Function!
