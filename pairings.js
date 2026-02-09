// This file will load pairings from CMS
// For now, it shows example data

document.addEventListener('DOMContentLoaded', function() {
    const pairings = [
        {
            id: 1,
            title: "Ossobuco",
            wine: "Barolo of Barbaresco",
            description: "Langzaam gestoofd kalfsvlees met saffraanrisotto. De kracht van een Nebbiolo past perfect bij dit rijke gerecht.",
            image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop"
        },
        {
            id: 2,
            title: "Coq au Vin",
            wine: "Bourgogne Pinot Noir",
            description: "Klassiek Franse kip gestoofdin rode wijn. Drink een elegante Pinot Noir uit de Côte de Beaune.",
            image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop"
        },
        {
            id: 3,
            title: "Pasta Carbonara",
            wine: "Verdicchio of Frascati",
            description: "Romige pasta met guanciale. Een frisse Italiaanse witte wijn snijdt door de rijkdom.",
            image: "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=400&h=300&fit=crop"
        }
    ];

    const container = document.getElementById('pairingsContainer');
    
    if (container) {
        container.innerHTML = pairings.map(item => `
            <a href="recipe.html?id=${item.id}" class="pairing-card">
                <img src="${item.image}" alt="${item.title}" class="pairing-image">
                <div class="pairing-content">
                    <h3 class="pairing-title">${item.title}</h3>
                    <p class="pairing-wine">🍷 ${item.wine}</p>
                    <p class="pairing-description">${item.description}</p>
                    <span class="read-more">Ga naar recept →</span>
                </div>
            </a>
        `).join('');
    }
});