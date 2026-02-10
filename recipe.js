// Load individual recipe from CMS based on URL parameter
document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');
    
    if (!recipeId) {
        showError('Geen recept geselecteerd');
        return;
    }
    
    await loadRecipe(recipeId);
});

async function loadRecipe(recipeId) {
    try {
        const repoPath = 'jcjvanschijndel-dot/wijnparade';
        const fileUrl = `https://api.github.com/repos/${repoPath}/contents/content/recipes/${recipeId}.md`;
        
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
            showError('Recept niet gevonden');
            return;
        }
        
        const file = await response.json();
        const contentResponse = await fetch(file.download_url);
        const content = await contentResponse.text();
        
        const recipe = parseFrontmatter(content);
        
        if (!recipe) {
            showError('Kon recept niet laden');
            return;
        }
        
        renderRecipe(recipe);
        
    } catch (error) {
        console.error('Error loading recipe:', error);
        showError('Fout bij laden van recept');
    }
}

function renderRecipe(recipe) {
    // Update title
    document.title = `${recipe.title} | de_wijnparade`;
    
    // Update hero image
    const heroImg = document.getElementById('recipeImage');
    if (heroImg) {
        heroImg.src = recipe.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&h=600&fit=crop';
        heroImg.alt = recipe.title;
        heroImg.onerror = function() {
            this.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&h=600&fit=crop';
        };
    }
    
    // Render gallery if extra photos exist
    const galleryEl = document.getElementById('recipeGallery');
    if (galleryEl && recipe.gallery && recipe.gallery.length > 0) {
        galleryEl.style.display = 'grid';
        galleryEl.innerHTML = recipe.gallery.map(photo => {
            const photoUrl = typeof photo === 'string' ? photo : photo.photo || photo;
            return `<img src="${photoUrl}" alt="${recipe.title}" onerror="this.style.display='none'">`;
        }).join('');
    }
    
    // Update title
    const titleEl = document.getElementById('recipeTitle');
    if (titleEl) titleEl.textContent = recipe.title;
    
    // Update wine pairing
    const wineEl = document.getElementById('recipeWine');
    if (wineEl) wineEl.textContent = `🍷 Aanbevolen wijn: ${recipe.wine}`;
    
    // Update description
    const descEl = document.getElementById('recipeDescription');
    if (descEl) descEl.textContent = recipe.description;
    
    // Update ingredients
    const ingredientsEl = document.getElementById('ingredientsList');
    if (ingredientsEl && recipe.ingredients) {
        const ingredients = Array.isArray(recipe.ingredients) 
            ? recipe.ingredients 
            : recipe.ingredients.split('\n').filter(i => i.trim());
        
        ingredientsEl.innerHTML = ingredients.map(ingredient => 
            `<li>${ingredient}</li>`
        ).join('');
    }
    
    // Update steps
    const stepsEl = document.getElementById('stepsList');
    if (stepsEl && recipe.steps) {
        const steps = Array.isArray(recipe.steps) 
            ? recipe.steps 
            : recipe.steps.split('\n').filter(s => s.trim());
        
        stepsEl.innerHTML = steps.map(step => 
            `<li>${step}</li>`
        ).join('');
    }
}

function showError(message) {
    const container = document.querySelector('.main .container');
    if (container) {
        container.innerHTML = `
            <div style="padding: 3rem; text-align: center;">
                <h2 style="color: var(--navy); margin-bottom: 1rem;">${message}</h2>
                <a href="pairings.html" style="color: var(--navy);">← Terug naar recepten</a>
            </div>
        `;
    }
}

function parseFrontmatter(content) {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return null;

    const frontmatter = match[1];
    const data = {};
    let currentKey = null;
    let currentValue = [];
    let inList = false;

    frontmatter.split('\n').forEach(line => {
        // Check if this is a list item
        if (line.trim().startsWith('- ')) {
            if (currentKey) {
                currentValue.push(line.trim().substring(2));
                inList = true;
            }
        } else {
            // Save previous key-value if we were in a list
            if (inList && currentKey) {
                data[currentKey] = currentValue;
                currentValue = [];
                inList = false;
            }
            
            const colonIndex = line.indexOf(':');
            if (colonIndex > -1) {
                // Save previous key if exists
                if (currentKey && !inList) {
                    data[currentKey] = currentValue.join('\n') || '';
                }
                
                currentKey = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                
                if (value) {
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
                    
                    data[currentKey] = value;
                    currentKey = null;
                    currentValue = [];
                } else {
                    // Value might be on next lines (list or multiline)
                    currentValue = [];
                }
            }
        }
    });
    
    // Save last key if in list
    if (inList && currentKey) {
        data[currentKey] = currentValue;
    }

    return data;
}