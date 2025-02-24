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
        grid-template-columns: repeat(1, minmax(200px, 1fr));
        gap: 15px;
        border: 2px solid #ffa500;
        border-radius: 8px;
        padding: 15px;
        margin: 2cm auto;
    `;

    // Loop through zones to create category groups
    zones.forEach(zone => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'category-group';
        groupDiv.style.cssText = `
            background-color: #ffffff;
            break-inside: avoid;
            margin-bottom: 10px;
            position: relative;
        `;

        // Create collapsible zone header
        const header = document.createElement('h3');
        header.textContent = zone.name + ' ▼'; // Zone name with dropdown indicator
        header.style.cssText = `
            background-color: #394464;
            color: white;
            font-family: Verdana, sans-serif;
            font-weight: bold;
            font-size: 1.1em;
            padding: 8px 15px;
            margin-bottom: 15px;
            border-radius: 0 20px 20px 0;
            cursor: pointer;
            user-select: none;
        `;

        // Create container for categories
        const categoriesContainer = document.createElement('div');
        categoriesContainer.style.cssText = `
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
            padding: 0 15px;
        `;
        
        // Add click handler for collapsing
        header.addEventListener('click', () => {
            const actualHeight = categoriesContainer.scrollHeight;
            const isCollapsed = categoriesContainer.style.maxHeight === '0px' || categoriesContainer.style.maxHeight === '0';
            categoriesContainer.style.maxHeight = isCollapsed ? `${actualHeight}px` : '0';
            header.textContent = zone.name + (isCollapsed ? ' ▼' : ' ▶');
        });

        groupDiv.appendChild(header);
        groupDiv.appendChild(categoriesContainer);

        // Create category links within each zone
zone.categories.forEach(category => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'category-item';
    itemDiv.style.cssText = `
        padding: 5px 0;
    `;

    const link = document.createElement('a');
    link.href = `#${category.technical_id}`; // Use category technical ID as anchor

    // Split the display name into words
    const words = category.display_name.split(' ');
    const firstTwoWords = words.slice(0, 2).join(' ');
    const remainingWords = words.slice(2).join(' ');

    // Set the innerHTML to include the extra-bold class for the first two words
    link.innerHTML = `<span class="extra-bold">${firstTwoWords}</span> ${remainingWords}`;

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
            width < 768 ? 'repeat(1, minmax(200px, auto))' :
            width < 1200 ? 'repeat(1, minmax(200px, auto))' :
            'repeat(1, minmax(200px, auto))';
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
