#!/bin/bash
# Build script: generates JSON indexes from CMS markdown files
# Runs during Netlify build so the site loads content locally (no GitHub API needed)

echo "🔨 Generating content indexes..."

# Process each content subfolder
for dir in content/*/; do
    [ -d "$dir" ] || continue
    
    dirname=$(basename "$dir")
    
    # Check if there are any .md files
    shopt -s nullglob
    md_files=($dir*.md)
    shopt -u nullglob
    
    if [ ${#md_files[@]} -eq 0 ]; then
        echo "[]" > "${dir}_index.json"
        echo "  📁 $dirname: 0 entries"
        continue
    fi
    
    # Use node to parse all .md files into a JSON array
    node -e "
        const fs = require('fs');
        const path = require('path');
        const dir = '$dir';
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
        
        const results = [];
        
        for (const file of files) {
            const content = fs.readFileSync(path.join(dir, file), 'utf8');
            const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
            if (!match) continue;
            
            const yaml = match[1];
            const lines = yaml.split('\n');
            const result = { _id: file.replace('.md', '') };
            
            let i = 0;
            while (i < lines.length) {
                const line = lines[i];
                if (line.trim() === '') { i++; continue; }
                
                // List item with key:value (e.g., '  - name: value')
                if (line.match(/^\s+-\s+\w+:/)) {
                    i++;
                    continue; // handled by parent key logic below
                }
                
                // Top-level key
                const colonIdx = line.indexOf(':');
                if (colonIdx > -1 && !line.match(/^\s/)) {
                    const key = line.substring(0, colonIdx).trim();
                    let val = line.substring(colonIdx + 1).trim();
                    
                    // Remove quotes
                    if ((val.startsWith('\"') && val.endsWith('\"')) || (val.startsWith(\"'\") && val.endsWith(\"'\"))) {
                        val = val.slice(1, -1);
                    }
                    
                    if (val === '') {
                        // Could be a list - check next lines
                        const list = [];
                        i++;
                        while (i < lines.length && (lines[i].match(/^\s+-/) || lines[i].match(/^\s{4,}\w+:/))) {
                            const trimmed = lines[i].trim();
                            if (trimmed.startsWith('- ')) {
                                const itemContent = trimmed.substring(2);
                                if (itemContent.includes(':')) {
                                    // Object item
                                    const obj = {};
                                    const ic = itemContent.indexOf(':');
                                    const ik = itemContent.substring(0, ic).trim();
                                    let iv = itemContent.substring(ic + 1).trim();
                                    if ((iv.startsWith('\"') && iv.endsWith('\"')) || (iv.startsWith(\"'\") && iv.endsWith(\"'\"))) iv = iv.slice(1, -1);
                                    obj[ik] = iv;
                                    
                                    // Check for more properties
                                    i++;
                                    while (i < lines.length && lines[i].match(/^\s{4,}\w+:/) && !lines[i].trim().startsWith('-')) {
                                        const pl = lines[i].trim();
                                        const pc = pl.indexOf(':');
                                        const pk = pl.substring(0, pc).trim();
                                        let pv = pl.substring(pc + 1).trim();
                                        if ((pv.startsWith('\"') && pv.endsWith('\"')) || (pv.startsWith(\"'\") && pv.endsWith(\"'\"))) pv = pv.slice(1, -1);
                                        if (!isNaN(pv) && pv !== '') pv = Number(pv);
                                        obj[pk] = pv;
                                        i++;
                                    }
                                    list.push(obj);
                                    continue;
                                } else {
                                    let sv = itemContent;
                                    if ((sv.startsWith('\"') && sv.endsWith('\"')) || (sv.startsWith(\"'\") && sv.endsWith(\"'\"))) sv = sv.slice(1, -1);
                                    list.push(sv);
                                }
                            }
                            i++;
                        }
                        result[key] = list;
                        continue;
                    } else {
                        // Simple value
                        if (!isNaN(val) && val !== '') val = Number(val);
                        result[key] = val;
                    }
                }
                i++;
            }
            
            results.push(result);
        }
        
        fs.writeFileSync(path.join(dir, '_index.json'), JSON.stringify(results, null, 2));
        console.log('  📁 ' + '$dirname' + ': ' + results.length + ' entries');
    "
done

echo "✅ Content indexes generated!"
