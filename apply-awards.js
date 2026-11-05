#!/usr/bin/env node
/**
 * apply-awards.js
 *
 * Zet onderscheidingen uit awards.json in het veld "awards" van de locatiebestanden
 * in content/locations/*.md.
 *
 * Standaard is dit een DROOGLOOP: er wordt niets geschreven, je ziet alleen wat er zou veranderen.
 *
 * Gebruik (vanuit de root van de repo, Node 18 of nieuwer):
 *   node apply-awards.js                    (droogloop, toont verschillen)
 *   node apply-awards.js --write            (schrijft de wijzigingen)
 *   node apply-awards.js --data=awards.json (ander databestand)
 *
 * Koppelen gebeurt op NAAM + PLAATS. Een regel wordt alleen toegepast als er precies
 * één locatie past. Bij twijfel (geen of meerdere matches) komt de regel in het rapport.
 *
 * Per locatie worden bestaande onderscheidingen van dezelfde bron (bijvoorbeeld Michelin)
 * vervangen door de nieuwe. Onderscheidingen van andere bronnen blijven staan.
 * Er wordt nooit iets verwijderd dat niet in awards.json voorkomt. Zulke onderscheidingen staan
 * in het rapport onder "nietInBronlijst", zodat de gebruiker ze kan beoordelen.
 *
 * Uitvoer: apply-awards-report.json (en de verschillen in de terminal)
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, 'content', 'locations');
const REPORT = path.join(__dirname, 'apply-awards-report.json');

// Dezelfde volgorde als de keuzelijst in config.yml
const SOURCES = ['Michelin', 'Gault&Millau', 'Decanter', 'Star Wine List', 'James Suckling', 'Lekker',
    'Robert Parker', "World's 50 Best", 'Wine Spectator', 'Gambero Rosso', 'Falstaff', 'Guía Peñín',
    'La Revue du Vin de France', 'Raisin'];

const args = {};
process.argv.slice(2).forEach(a => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) args[m[1]] = m[2] === undefined ? true : m[2];
});
const WRITE = !!args.write;
const DATA = path.join(__dirname, args.data || 'awards.json');

// ---------------------------------------------------------------
// Hulpfuncties
// ---------------------------------------------------------------
function norm(s) {
    return String(s || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

const STOP = new Set(['restaurant', 'cafe', 'the', 'de', 'het', 't', 'van', 'la', 'le', 'wijnbar', 'wijnrestaurant']);
function nameKey(s) {
    return norm(s).split(' ').filter(w => w && !STOP.has(w)).join(' ');
}

function stripQuotes(v) {
    v = String(v || '').trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
    return v;
}

function yamlValue(v, forceQuote) {
    const s = String(v);
    if (forceQuote) return JSON.stringify(s);
    return /^[A-Za-z0-9][\w .,'()\/+&-]*$/.test(s) && !/:\s/.test(s) ? s : JSON.stringify(s);
}

// ---------------------------------------------------------------
// Frontmatter lezen en schrijven (alleen het blok "awards")
// ---------------------------------------------------------------
function splitFile(raw) {
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n[\s\S]*)?$/);
    if (!m) return null;
    return { front: m[1], rest: m[2] || '', eol: raw.includes('\r\n') ? '\r\n' : '\n' };
}

function readField(frontLines, key) {
    for (const line of frontLines) {
        const m = line.match(new RegExp('^' + key + ':\\s*(.*)$'));
        if (m) return stripQuotes(m[1]);
    }
    return '';
}

function findAwardsBlock(lines) {
    const start = lines.findIndex(l => /^awards:\s*(\[\])?\s*$/.test(l));
    if (start === -1) return null;
    let end = start + 1;
    while (end < lines.length && !/^[A-Za-z_][\w-]*:/.test(lines[end])) end++;
    return { start, end };
}

function parseAwards(blockLines) {
    const items = [];
    let cur = null;
    for (const line of blockLines) {
        const first = line.match(/^\s*-\s+([A-Za-z_]+):\s*(.*)$/);
        if (first) {
            cur = {};
            items.push(cur);
            cur[first[1]] = stripQuotes(first[2]);
            continue;
        }
        const more = line.match(/^\s+([A-Za-z_]+):\s*(.*)$/);
        if (more && cur) cur[more[1]] = stripQuotes(more[2]);
    }
    return items;
}

function renderAwards(items) {
    const out = ['awards:'];
    for (const a of items) {
        out.push(`  - name: ${yamlValue(a.name)}`);
        if (a.detail) out.push(`    detail: ${yamlValue(a.detail)}`);
        if (a.detail_en) out.push(`    detail_en: ${yamlValue(a.detail_en)}`);
        if (a.year) out.push(`    year: ${yamlValue(a.year, true)}`);
    }
    return out;
}

function label(a) {
    return [a.name, a.detail, a.year].filter(Boolean).join(' ');
}

// ---------------------------------------------------------------
// Hoofdprogramma
// ---------------------------------------------------------------
function main() {
    if (!fs.existsSync(CONTENT_DIR)) {
        console.error(`Map niet gevonden: ${CONTENT_DIR}\nRun dit script vanuit de root van de repo.`);
        process.exit(1);
    }
    if (!fs.existsSync(DATA)) {
        console.error(`Databestand niet gevonden: ${DATA}`);
        process.exit(1);
    }

    const entries = JSON.parse(fs.readFileSync(DATA, 'utf8'));

    // Locaties inlezen
    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md') && !f.startsWith('_'));
    const locs = [];
    for (const f of files) {
        const full = path.join(CONTENT_DIR, f);
        const raw = fs.readFileSync(full, 'utf8');
        const parts = splitFile(raw);
        if (!parts) {
            console.warn(`Overgeslagen (geen frontmatter): ${f}`);
            continue;
        }
        const lines = parts.front.split(/\r?\n/);
        locs.push({
            file: f, full, raw, parts, lines,
            name: readField(lines, 'name') || readField(lines, 'title'),
            address: readField(lines, 'address'),
            region: readField(lines, 'region')
        });
    }

    // Koppelen
    const matched = new Map();   // file -> { loc, items: [] }
    const report = { toegepast: [], geenMatch: [], meerdereMatches: [], ongeldig: [], ongewijzigd: [], nietInBronlijst: [] };

    for (const e of entries) {
        if (!SOURCES.includes(e.source)) {
            report.ongeldig.push({ ...e, reden: `Onbekende bron "${e.source}"` });
            continue;
        }
        const keys = [e.name].concat(e.aliases || []).map(nameKey);
        const city = norm(e.city);
        const hits = locs.filter(l =>
            keys.includes(nameKey(l.name)) &&
            (norm(l.address).includes(city) || norm(l.region).includes(city)));

        if (hits.length === 0) { report.geenMatch.push(e); continue; }
        if (hits.length > 1) { report.meerdereMatches.push({ ...e, kandidaten: hits.map(h => h.file) }); continue; }

        const loc = hits[0];
        if (!matched.has(loc.file)) matched.set(loc.file, { loc, items: [] });
        matched.get(loc.file).items.push({
            name: e.source, detail: e.detail || '', detail_en: e.detail_en || '', year: e.year ? String(e.year) : ''
        });
    }

    // Wijzigingen bepalen
    let changed = 0;
    for (const { loc, items } of matched.values()) {
        const block = findAwardsBlock(loc.lines);
        const existing = block ? parseAwards(loc.lines.slice(block.start + 1, block.end)) : [];
        const newSources = new Set(items.map(i => i.name));
        const kept = existing.filter(a => !newSources.has(a.name));
        const merged = kept.concat(items).sort((a, b) => SOURCES.indexOf(a.name) - SOURCES.indexOf(b.name));

        const before = existing.map(label).join(' | ') || '(leeg)';
        const after = merged.map(label).join(' | ');
        if (before === after && JSON.stringify(existing) === JSON.stringify(merged)) {
            report.ongewijzigd.push({ locatie: loc.name, bestand: loc.file });
            continue;
        }

        changed++;
        console.log(`${loc.name} (${loc.file})\n   oud:   ${before}\n   nieuw: ${after}\n`);
        report.toegepast.push({ locatie: loc.name, bestand: loc.file, oud: before, nieuw: after });

        if (WRITE) {
            const newBlock = renderAwards(merged);
            let lines = loc.lines.slice();
            if (block) lines.splice(block.start, block.end - block.start, ...newBlock);
            else lines = lines.concat(newBlock);
            const out = '---' + loc.parts.eol + lines.join(loc.parts.eol) + loc.parts.eol + '---' + loc.parts.rest;
            fs.writeFileSync(loc.full, out, 'utf8');
        }
    }

    // Onderscheidingen die op de site staan, maar waarvoor awards.json (voor die locatie en bron)
    // geen regel heeft. Die worden NIET verwijderd; ze staan alleen in het rapport ter beoordeling.
    for (const loc of locs) {
        const block = findAwardsBlock(loc.lines);
        if (!block) continue;
        const covered = new Set((matched.get(loc.file) || { items: [] }).items.map(i => i.name));
        for (const a of parseAwards(loc.lines.slice(block.start + 1, block.end))) {
            if (!covered.has(a.name)) report.nietInBronlijst.push({ locatie: loc.name, bestand: loc.file, onderscheiding: label(a) });
        }
    }

    fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), 'utf8');

    console.log('----------------------------------------');
    console.log(WRITE ? 'GESCHREVEN.' : 'DROOGLOOP (er is niets geschreven; gebruik --write om toe te passen).');
    console.log(`Locaties met wijziging:   ${changed}`);
    console.log(`Locaties ongewijzigd:     ${report.ongewijzigd.length}`);
    console.log(`Regels zonder match:      ${report.geenMatch.length}`);
    console.log(`Regels met >1 match:      ${report.meerdereMatches.length}`);
    console.log(`Ongeldige regels:         ${report.ongeldig.length}`);
    console.log(`Niet in de bronlijst:     ${report.nietInBronlijst.length} (staan op de site; ter beoordeling, niet verwijderd)`);
    if (report.geenMatch.length) {
        console.log('\nGeen match (staat de locatie niet op de site, of wijkt de naam of plaats af?):');
        report.geenMatch.forEach(e => console.log(`  - ${e.name} (${e.city}): ${e.source} ${e.detail || ''}`));
    }
    if (report.meerdereMatches.length) {
        console.log('\nMeerdere matches (handmatig oplossen of "aliases" aanscherpen):');
        report.meerdereMatches.forEach(e => console.log(`  - ${e.name} (${e.city}): ${e.kandidaten.join(', ')}`));
    }
    if (report.nietInBronlijst.length) {
        console.log('\nOp de site, maar niet (meer) in awards.json (niet verwijderd; beoordelen):');
        report.nietInBronlijst.forEach(e => console.log(`  - ${e.locatie} (${e.bestand}): ${e.onderscheiding}`));
    }
    console.log(`\nRapport: ${REPORT}`);
}

main();
