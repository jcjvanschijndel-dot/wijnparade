// Load toplists from CMS content folder
document.addEventListener('DOMContentLoaded', async function() {
    const container = document.getElementById('toplistsContainer');
    
    if (!container) return;

    try {
        // Fetch the list of files from GitHub API
        const repoPath = 'jcjvanschijndel-dot/wijnparade';
        const apiUrl = `https://api.github.com/repos/${repoPath}/contents/content/toplists`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('Could not fetch toplists');
        }
        
        const files = await response.json();
        
        if (!files || files.length === 0) {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #6b7280;">
                    <p>Nog geen toplijsten toegevoegd.</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Voeg toplijsten toe via het CMS (/admin)</p>
                </div>
            `;
            return;
        }

        // Fetch and parse each file
        const toplists = [];
        
        for (const file of files) {
            if (file.name.endsWith('.md')) {
                const contentResponse = await fetch(file.download_url);
                const content = await contentResponse.text();
                
                // Parse frontmatter
                const parsed = parseFrontmatter(content);
                if (parsed) {
                    toplists.push(parsed);
                }
            }
        }

        // Sort by order
        toplists.sort((a, b) => (a.order || 0) - (b.order || 0));

        // Render toplists
        if (toplists.length > 0) {
            container.innerHTML = toplists.map(item => {
                // Prefer file over url, fallback to link
                const link = item.file || item.url || item.link || '#';
                
                return `
                    <a href="${link}" target="_blank" class="list-link">
                        <span class="link-icon">${item.icon || '🍷'}</span>
                        <span class="link-text">${item.title}</span>
                        <span class="link-arrow">→</span>
                    </a>
                `;
            }).join('');
        } else {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #6b7280;">
                    <p>Nog geen toplijsten toegevoegd.</p>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error loading toplists:', error);
        container.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #6b7280;">
                <p>Kon toplijsten niet laden.</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">Probeer de pagina te verversen.</p>
            </div>
        `;
    }
});

function parseFrontmatter(content) {
    // Parse YAML frontmatter from markdown
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return null;

    const frontmatter = match[1];
    const data = {};

    // Simple YAML parser
    frontmatter.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > -1) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();
            
            // Remove quotes
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
                value = value.slice(1, -1);
            }
            
            // Convert numbers
            if (!isNaN(value) && value !== '') {
                value = Number(value);
            }
            
            data[key] = value;
        }
    });

    return data;
}