// Load pairings from local content indexes
document.addEventListener('DOMContentLoaded', async function() {
    const container = document.getElementById('pairingsContainer');
    
    if (!container) return;

    try {
        const [dishesResponse, winesResponse] = await Promise.all([
            fetch('/content/dishes-pairing/_index.json').catch(() => null),
            fetch('/content/wines-pairing/_index.json').catch(() => null)
        ]);

        const dishesData = dishesResponse && dishesResponse.ok ? await dishesResponse.json() : [];
        const winesData = winesResponse && winesResponse.ok ? await winesResponse.json() : [];

        const allItems = [];

        for (const item of dishesData) {
            const wines = Array.isArray(item.wines) ? item.wines : [];
            allItems.push({ id: item._id, title: item.dish, type: 'dish', wines: wines });
        }

        for (const item of winesData) {
            const dishes = Array.isArray(item.dishes) ? item.dishes : [];
            allItems.push({ id: item._id, title: item.wine, type: 'wine', dishes: dishes });
        }

        if (allItems.length > 0) {
            container.innerHTML = allItems.map(item => {
                const icon = item.type === 'dish' ? '🍽️' : '🍷';
                const label = item.type === 'dish' ? 'Gerecht' : 'Wijn';
                const pairingIcon = item.type === 'dish' ? '🍷' : '🍽️';
                
                let pairingHtml = '';
                if (item.type === 'dish' && item.wines.length > 0) {
                    pairingHtml = item.wines.map(w => {
                        const name = typeof w === 'string' ? w : (w.name || '');
                        const stars = w.stars ? '⭐'.repeat(parseInt(w.stars)) : '';
                        return `<span style="display: block; font-size: 0.85rem; color: #4b5563; margin-top: 0.25rem;">${pairingIcon} ${name} ${stars}</span>`;
                    }).join('');
                } else if (item.type === 'wine' && item.dishes.length > 0) {
                    pairingHtml = item.dishes.map(d => {
                        const name = typeof d === 'string' ? d : (d.dish || '');
                        return `<span style="display: block; font-size: 0.85rem; color: #4b5563; margin-top: 0.25rem;">${pairingIcon} ${name}</span>`;
                    }).join('');
                }

                return `
                    <div class="pairing-card">
                        <div class="pairing-content">
                            <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 500;">${icon} ${label}</span>
                            <h3 class="pairing-title">${item.title}</h3>
                            ${pairingHtml}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #6b7280; grid-column: 1/-1;">
                    <p>Nog geen pairings toegevoegd.</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Voeg gerechten of wijnen toe via het CMS (/admin)</p>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error loading pairings:', error);
        container.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #6b7280; grid-column: 1/-1;">
                <p>Kon pairings niet laden.</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">Probeer de pagina te verversen.</p>
            </div>
        `;
    }
});
