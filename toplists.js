// Load toplists from local content index
document.addEventListener('DOMContentLoaded', async function() {
    const container = document.getElementById('toplistsContainer');
    
    if (!container) return;

    try {
        const response = await fetch('/content/toplists/_index.json');
        
        if (!response.ok) {
            throw new Error('Could not fetch toplists');
        }
        
        const toplists = await response.json();
        
        if (!toplists || toplists.length === 0) {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #6b7280;">
                    <p>Nog geen koopgidsen toegevoegd.</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Voeg koopgidsen toe via het CMS (/admin)</p>
                </div>
            `;
            return;
        }

        // Sort by order if available
        toplists.sort((a, b) => (a.order || 0) - (b.order || 0));

        // Render toplists
        container.innerHTML = toplists.map(item => {
            // Support both old format (title/icon/url) and new format (region/wines)
            if (item.region) {
                // New format: region with wines
                const wineCount = Array.isArray(item.wines) ? item.wines.length : 0;
                return `
                    <a href="#" class="list-link" onclick="toggleToplist(this, event)">
                        <span class="link-icon">🍷</span>
                        <span class="link-text">${item.region} (${wineCount} wijnen)</span>
                        <span class="link-arrow">→</span>
                    </a>
                    <div class="toplist-wines" style="display: none; padding: 0 1rem 1rem 1rem;">
                        ${Array.isArray(item.wines) ? item.wines.map(w => `
                            <div style="padding: 0.75rem; margin-top: 0.5rem; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                                <div style="font-weight: 600; color: #1e3a8a;">${w.name || ''}</div>
                                <div style="font-size: 0.85rem; color: #6b7280;">${w.producer || ''}</div>
                                <div style="font-size: 0.85rem; color: #4b5563; margin-top: 0.25rem;">${w.description || ''}</div>
                                <div style="display: flex; justify-content: space-between; margin-top: 0.25rem; font-size: 0.85rem;">
                                    <span style="color: #059669; font-weight: 500;">€${parseFloat(w.price || 0).toFixed(2)}</span>
                                    <span style="color: #6b7280;">${w.store || ''}</span>
                                </div>
                            </div>
                        `).join('') : '<p style="color: #6b7280; font-size: 0.9rem;">Geen wijnen toegevoegd.</p>'}
                    </div>
                `;
            } else {
                // Old format: title/icon/url
                const link = item.file || item.url || item.link || '#';
                return `
                    <a href="${link}" target="_blank" class="list-link">
                        <span class="link-icon">${item.icon || '🍷'}</span>
                        <span class="link-text">${item.title}</span>
                        <span class="link-arrow">→</span>
                    </a>
                `;
            }
        }).join('');

    } catch (error) {
        console.error('Error loading toplists:', error);
        container.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #6b7280;">
                <p>Kon koopgidsen niet laden.</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">Probeer de pagina te verversen.</p>
            </div>
        `;
    }
});

function toggleToplist(element, event) {
    event.preventDefault();
    const winesDiv = element.nextElementSibling;
    if (winesDiv && winesDiv.classList.contains('toplist-wines')) {
        const isVisible = winesDiv.style.display !== 'none';
        winesDiv.style.display = isVisible ? 'none' : 'block';
        element.querySelector('.link-arrow').textContent = isVisible ? '→' : '↓';
    }
}
