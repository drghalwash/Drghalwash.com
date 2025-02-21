/***********************************************************************
 * File: /js/categoryManager.js
 * Description: Dynamically generates category navigation and handles 
 * responsive grid layout for categories based on Supabase data.
 ***********************************************************************/

/**
 * Generates the category navigation dynamically based on zones and categories.
 * @param {Array} zones - Array of zones with nested categories.
 */
function generateCategoryNav(zones) {
    const navContainer = document.querySelector('.categories-container .categories');
    if (!navContainer) return;

    // Apply grid layout styles
    navContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(4, minmax(200px, 1fr));
        gap: 15px;
    `;

    // Loop through zones to create category groups
    zones.forEach(zone => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'category-group';
        groupDiv.style.cssText = `
            background-color: #ffffff;
            border: 2px solid #ffa500;
            border-radius: 8px;
            padding: 15px;
            break-inside: avoid;
        `;

        // Create zone header
        const header = document.createElement('h3');
        header.textContent = zone.name; // Zone name
        header.style.cssText = `
            background-color: #394464;
            color: white;
            font-family: Verdana, sans-serif;
            font-weight: bold;
            font-size: 1.1em;
            padding: 8px 15px;
            margin-bottom: 15px;
            border-radius: 0 20px 20px 0;
        `;
        groupDiv.appendChild(header);

        // Create category links within each zone
        zone.categories.forEach(category => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'category-item';
            itemDiv.style.cssText = `
                padding: 5px 0;
            `;

            const link = document.createElement('a');
            link.href = `#${category.technical_id}`; // Use category technical ID as anchor
            link.textContent = category.display_name; // Category display name
            link.style.cssText = `
                color: #495057;
                text-decoration: none;
                font-family: Verdana, sans-serif;
                font-size: 0.95em;
                transition: color 0.3s ease;
            `;
            
            link.addEventListener('mouseenter', () => {
                link.style.color = '#007bff';
                link.style.fontWeight = 'bold';
            });
            
            link.addEventListener('mouseleave', () => {
                link.style.color = '#495057';
                link.style.fontWeight = 'normal';
            });

            itemDiv.appendChild(link);
            groupDiv.appendChild(itemDiv);
        });

        navContainer.appendChild(groupDiv);
    });
}

/**
 * Handles responsive design for the category navigation grid.
 */
function handleResponsiveDesign() {
    const categories = document.querySelector('.categories-container .categories');
    if (!categories) return;

    const updateGrid = () => {
        const width = window.innerWidth;
        categories.style.gridTemplateColumns =
            width < 576 ? 'repeat(1, minmax(200px, auto))' :
            width < 768 ? 'repeat(2, minmax(200px, auto))' :
            width < 1200 ? 'repeat(3, minmax(200px, auto))' :
            'repeat(4, minmax(200px, auto))';
    };

    updateGrid();
    window.addEventListener('resize', updateGrid);
}

/**
 * Adds smooth scrolling functionality when clicking on a category.
 */
function enableAutoScroll() {
    document.querySelectorAll('.category-item a').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = event.target.getAttribute('href').substring(1); // Remove the '#' from href
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

/**
 * Initializes the category navigation and related functionalities.
 */
document.addEventListener('DOMContentLoaded', () => {
    if (window.zonesData) {
        generateCategoryNav(window.zonesData); // Generate navigation dynamically
        handleResponsiveDesign(); // Handle responsiveness
        enableAutoScroll(); // Enable smooth scrolling
    }
});
