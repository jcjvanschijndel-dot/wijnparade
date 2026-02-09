// Load toplists from CMS
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('toplistsContainer');
    
    if (!container) return;

    // Show empty state
    container.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #6b7280;">
            <p>Nog geen toplijsten toegevoegd.</p>
            <p style="font-size: 0.9rem; margin-top: 0.5rem;">Voeg toplijsten toe via het CMS (/admin)</p>
        </div>
    `;
});
