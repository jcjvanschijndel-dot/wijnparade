// This file loads pairings from CMS
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('pairingsContainer');
    
    if (!container) return;

    // Show empty state
    container.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #6b7280; grid-column: 1/-1;">
            <p>Nog geen gerechten & wijn combi's toegevoegd.</p>
            <p style="font-size: 0.9rem; margin-top: 0.5rem;">Voeg recepten toe via het CMS (/admin)</p>
        </div>
    `;
});