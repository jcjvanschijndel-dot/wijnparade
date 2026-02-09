// Load recipes from CMS
document.addEventListener('DOMContentLoaded', async function() {
    const container = document.getElementById('pairingsContainer');
    
    if (!container) return;

    try {
        const repoPath = 'jcjvanschijndel-dot/wijnparade';
        const apiUrl = `https://api.github.com/repos/${repoPath}/contents/content/recipes`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('Could not fetch recipes');
        }
        
        const files = await response.json();
        
        if (!files || files.length === 0) {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #6b7280; grid-column: 1/-1;">
                    <p>Nog geen recepten toegevoegd.</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Voeg recepten toe via het CMS (/admin)</p>
                </div>
            `;
            return;
        }

        const recipes = [];
        
        for (const file of files) {
            if (file.name.endsWith('.md')) {
                const contentResponse = await fetch(file.download_url);
                const content = await contentResponse.text();
                const parsed = parseFrontmatter(content);
                if (parsed) {
                    // Add filename as ID for linking
                    parsed.id = file.name.replace('.md', '');
                    recipes.push(parsed);
                }
            }
        }

        if (recipes.length > 0) {
            container.innerHTML = recipes.map(recipe => `
                <a href="recipe.html?id=${recipe.id}" class="pairing-card">
                    <img src="${recipe.image || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=300&fit=crop'}" 
                         alt="${recipe.title}" 
                         class="pairing-image"
                         onerror="this.src='https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=300&fit=crop'">
                    <div class="pairing-content">
                        <h3 class="pairing-title">${recipe.title}</h3>
                        <p class="pairing-wine">🍷 ${recipe.wine}</p>
                        <p class="pairing-description">${recipe.description}</p>
                        <span class="read-more">Ga naar recept →</span>
                    </div>
                </a>
            `).join('');
        } else {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #6b7280; grid-column: 1/-1;">
                    <p>Nog geen recepten toegevoegd.</p>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error loading recipes:', error);
        container.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #6b7280; grid-column: 1/-1;">
                <p>Kon recepten niet laden.</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">Probeer de pagina te verversen.</p>
            </div>
        `;
    }
});

function parseFrontmatter(content) {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return null;

    const frontmatter = match[1];
    const data = {};

    frontmatter.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > -1) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();
            
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
                value = value.slice(1, -1);
            }
            
            // Handle arrays (ingredients, steps)
            if (value.startsWith('[') && value.endsWith(']')) {
                // This is simplified - real YAML arrays would need better parsing
                value = value.slice(1, -1).split(',').map(v => v.trim());
            }
            
            if (!isNaN(value) && value !== '' && !Array.isArray(value)) {
                value = Number(value);
            }
            
            data[key] = value;
        }
    });

    return data;
}