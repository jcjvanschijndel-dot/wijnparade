# 🔄 Data Migratie Gids

## Probleem
Bij CMS config wijzigingen raak je data kwijt omdat veldnamen of folder namen veranderen.

## Oplossing: Altijd backwards compatible blijven

### Regel 1: Nooit folder namen veranderen
❌ FOUT:
```yaml
# Was: content/pairings
# Nu:  content/dishes-pairing  
```

✅ GOED:
```yaml
# Blijf altijd: content/pairings gebruiken
# Of: maak code die BEIDE locaties checkt (zoals nu in wine-food.js)
```

### Regel 2: Nooit veldnamen veranderen
❌ FOUT:
```yaml
# Was: rating (1-5)
# Nu:  value_score (0-100)
```

✅ GOED:
```yaml
# Voeg NIEUW veld toe, houd oude:
- {label: "Rating (oud)", name: "rating", required: false}
- {label: "Value Score", name: "value_score"}
```

### Regel 3: Test eerst op branch
1. Maak test entry in CMS
2. Check of het werkt
3. Pas daarna echte data aan

### Regel 4: Export data voor grote wijzigingen
Voor GitHub backed CMS:
```bash
# Clone repo
git clone https://github.com/jcjvanschijndel-dot/de-wijnparade
cd de-wijnparade

# Backup maken
cp -r content content-backup-$(date +%Y%m%d)
git add .
git commit -m "Backup before migration"
git push
```

## Huidige Backwards Compatibility

✅ `wine-food.js` checkt BEIDE:
- `content/dishes-pairing/` (nieuw)
- `content/pairings/` (oud - fallback)

✅ Zo raak je geen data kwijt!

## Voor de toekomst

Voordat je config wijzigt, vraag:
1. "Wordt een folder hernoemd?" → Voeg fallback toe in JS
2. "Wordt een veld hernoemd?" → Behoud oude veld als optioneel
3. "Nieuwe required field?" → Maak het eerst optional!
