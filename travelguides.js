// Load reisgidsen from local content index
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('/content/travelguides/_index.json');

        if (!response.ok) {
            showEmptyState();
            return;
        }

        const guides = await response.json();

        if (!guides || guides.length === 0) {
            showEmptyState();
            return;
        }

        // Sort by order, then name
        guides.sort((a, b) => (a.order || 0) - (b.order || 0) || (a.name || '').localeCompare(b.name || '', 'nl'));

        renderCards(guides);
        renderTable(guides);

    } catch (error) {
        console.error('Error loading reisgidsen:', error);
        showEmptyState();
    }
});

function getFileType(filepath) {
    if (!filepath) return '';
    const ext = filepath.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'PDF';
    if (['xls', 'xlsx'].includes(ext)) return 'Excel';
    return ext.toUpperCase();
}

function renderCards(guides) {
    const container = document.getElementById('guidesCards');

    container.innerHTML = guides.map(guide => {
        const fileType = getFileType(guide.file);
        const typeLabel = fileType ? `<span class="guide-file-type">${fileType}</span>` : '';

        return `
            <div class="guide-card">
                <div class="guide-card-name">${guide.name}</div>
                ${guide.file
                    ? `<a href="${guide.file}" target="_blank" download class="guide-download-btn">Download ${typeLabel}</a>`
                    : '<span style="color: var(--gray-600); font-size: 0.85rem;">Geen bestand</span>'
                }
            </div>
        `;
    }).join('');
}

function renderTable(guides) {
    const tbody = document.getElementById('guidesTableBody');

    tbody.innerHTML = guides.map(guide => {
        const fileType = getFileType(guide.file);
        const typeLabel = fileType ? `<span class="guide-file-type">${fileType}</span>` : '';

        return `
            <tr>
                <td>${guide.name}</td>
                <td>
                    ${guide.file
                        ? `<a href="${guide.file}" target="_blank" download class="guide-download-btn">Download ${typeLabel}</a>`
                        : '<span style="color: var(--gray-600);">—</span>'
                    }
                </td>
            </tr>
        `;
    }).join('');
}

function showEmptyState() {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('guidesCards').style.display = 'none';
    const tableWrapper = document.querySelector('.guides-table-wrapper');
    if (tableWrapper) tableWrapper.style.display = 'none';
}
