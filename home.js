// Load homepage section texts from CMS
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('/content/homepage.json');
        if (response.ok) {
            const data = await response.json();
            
            // Update section texts
            if (data.section1) document.getElementById('section1Text').textContent = data.section1;
            if (data.section2) document.getElementById('section2Text').textContent = data.section2;
            if (data.section3) document.getElementById('section3Text').textContent = data.section3;
            if (data.section4) document.getElementById('section4Text').textContent = data.section4;
            
            // Update icons if needed
            const links = document.querySelectorAll('.link-icon');
            if (data.section1_icon && links[0]) links[0].textContent = data.section1_icon;
            if (data.section2_icon && links[1]) links[1].textContent = data.section2_icon;
            if (data.section3_icon && links[2]) links[2].textContent = data.section3_icon;
            if (data.section4_icon && links[3]) links[3].textContent = data.section4_icon;
        }
    } catch (error) {
        console.log('Using default homepage texts');
    }
});