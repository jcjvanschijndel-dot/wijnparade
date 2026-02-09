// This file loads favorites from CMS
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('favoritesContainer');
    
    if (!container) return;

    // Show empty state
    container.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #6b7280;">
            <p>Nog geen favorieten toegevoegd.</p>
            <p style="font-size: 0.9rem; margin-top: 0.5rem;">Voeg favorieten toe via het CMS (/admin)</p>
        </div>
    `;
});