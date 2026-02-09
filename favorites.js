// This file will load favorites from CMS
// For now, it shows example data

document.addEventListener('DOMContentLoaded', function() {
    const favorites = [
        {
            icon: "💎",
            title: "Beste Prijs-Kwaliteit €10-20",
            link: "https://docs.google.com/spreadsheets/d/example"
        },
        {
            icon: "🏆",
            title: "Top Natuurwijnen",
            link: "https://docs.google.com/spreadsheets/d/example2"
        },
        {
            icon: "🍾",
            title: "Feestelijke Wijnen",
            link: "/favorites.pdf"
        }
    ];

    const container = document.getElementById('favoritesContainer');
    
    if (container) {
        container.innerHTML = favorites.map(item => `
            <a href="${item.link}" target="_blank" class="list-link">
                <span class="link-icon">${item.icon}</span>
                <span class="link-text">${item.title}</span>
                <span class="link-arrow">→</span>
            </a>
        `).join('');
    }
});