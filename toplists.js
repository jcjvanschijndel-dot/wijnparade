// This file will load toplists from CMS
// For now, it shows example data

document.addEventListener('DOMContentLoaded', function() {
    // Example data - will be replaced with CMS content
    const toplists = [
        {
            icon: "🇫🇷",
            title: "Bordeaux Toplijst 2025",
            link: "https://docs.google.com/spreadsheets/d/example"
        },
        {
            icon: "🇪🇸",
            title: "Rioja Koopgids",
            link: "/rioja2025.pdf"
        },
        {
            icon: "🇮🇹",
            title: "Piemonte Selectie",
            link: "https://docs.google.com/spreadsheets/d/example2"
        }
    ];

    const container = document.getElementById('toplistsContainer');
    
    if (container) {
        container.innerHTML = toplists.map(item => `
            <a href="${item.link}" target="_blank" class="list-link">
                <span class="link-icon">${item.icon}</span>
                <span class="link-text">${item.title}</span>
                <span class="link-arrow">→</span>
            </a>
        `).join('');
    }
});