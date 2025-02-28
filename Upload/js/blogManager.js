
/**
 * Blog Manager - Manages blog navigation similar to categoryManager.js
 * Creates zone-based navigation with collapsible sections and proper styling
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Blog Manager: Initializing...');
    
    // Main DOM elements
    const leftColumn = document.querySelector('.custom-left-column');
    const rightColumn = document.querySelector('.custom-right-column');
    const searchInput = document.getElementById('blogSearch');
    const searchCountElement = document.getElementById('blogSearchCount');
    
    // Apply additional styles to ensure consistency with categoryManager.js
    applyStyles();
    
    // Setup categories navigation with exact categoryManager.js styling
    setupCategoriesNav();
    
    // Setup search functionality if input exists
    if (searchInput) {
        setupSearch();
    }
    
    // Setup scroll buttons
    setupScrollButtons();
    
    /**
     * Generate category navigation similar to categoryManager.js
     */
    function setupCategoriesNav() {
        if (!rightColumn) return;
        
        // Get the categories container
        const categoriesContainer = rightColumn.querySelector('.custom-categories-container');
        if (!categoriesContainer) return;
        
        // Clean existing content
        categoriesContainer.innerHTML = '<h4>Categories</h4>';
        
        // Create a new container for zones with proper styling
        const zonesContainer = document.createElement('div');
        zonesContainer.className = 'zones-container';
        zonesContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 15px;
        `;
        
        // Get all zone headers from the left column
        const zoneHeaders = leftColumn ? leftColumn.querySelectorAll('h4') : [];
        
        if (zoneHeaders.length === 0) {
            // Create placeholder for empty state
            createEmptyStateZones(zonesContainer);
        } else {
            // Create zone sections with collapsible behavior
            zoneHeaders.forEach(header => {
                const zoneName = header.textContent;
                const zoneId = header.id;
                
                // Create zone group
                const zoneGroup = document.createElement('div');
                zoneGroup.className = 'zone-group';
                zoneGroup.style.cssText = `
                    background-color: #ffffff;
                    break-inside: avoid;
                    margin-bottom: 2px;
                    border-radius: 5px;
                    overflow: hidden;
                `;
                
                // Create zone header (styled like categoryManager.js)
                const zoneHeader = document.createElement('h3');
                zoneHeader.textContent = zoneName + ' ▶';
                zoneHeader.dataset.targetId = zoneId;
                zoneHeader.style.cssText = `
                    background-color: #394464;
                    color: white;
                    font-family: Verdana, sans-serif;
                    font-weight: bold;
                    font-size: 1.1em;
                    padding: 8px 15px;
                    margin: 0;
                    border-radius: 0 20px 20px 0;
                    cursor: pointer;
                    user-select: none;
                    transition: background-color 0.3s ease;
                `;
                
                // Create categories container for this zone
                const zoneCategories = document.createElement('div');
                zoneCategories.className = 'zone-categories';
                zoneCategories.style.cssText = `
                    padding: 10px;
                    display: none;
                `;
                
                // Get blogs for this zone
                const blogs = leftColumn ? leftColumn.querySelectorAll(`.custom-card[data-category="${zoneId}"]`) : [];
                
                if (blogs.length === 0) {
                    // Create placeholder item
                    const placeholderItem = document.createElement('div');
                    placeholderItem.className = 'category-item';
                    placeholderItem.style.cssText = `
                        padding: 8px 15px;
                        margin: 5px 0;
                        border-radius: 4px;
                        transition: all 0.3s ease;
                    `;
                    
                    const placeholderLink = document.createElement('a');
                    placeholderLink.href = '#';
                    placeholderLink.textContent = 'Coming Soon';
                    placeholderLink.style.cssText = `
                        color: #495057;
                        text-decoration: none;
                        font-family: Verdana, sans-serif;
                        font-size: 0.95em;
                        display: block;
                        transition: all 0.3s ease;
                        opacity: 0.7;
                    `;
                    
                    placeholderItem.appendChild(placeholderLink);
                    zoneCategories.appendChild(placeholderItem);
                } else {
                    // Create link to the zone
                    const zoneItem = document.createElement('div');
                    zoneItem.className = 'category-item';
                    zoneItem.style.cssText = `
                        padding: 8px 15px;
                        margin: 5px 0;
                        border-radius: 4px;
                        transition: all 0.3s ease;
                    `;
                    
                    const zoneLink = document.createElement('a');
                    zoneLink.href = `#${zoneId}`;
                    
                    // Split text into first two words and remaining words for styling
                    const words = zoneName.split(' ');
                    const firstTwoWords = words.slice(0, 2).join(' ');
                    const remainingWords = words.slice(2).join(' ');
                    
                    zoneLink.innerHTML = `<span class="extra-bold">${firstTwoWords}</span> ${remainingWords}`;
                    zoneLink.style.cssText = `
                        color: #495057;
                        text-decoration: none;
                        font-family: Verdana, sans-serif;
                        font-size: 0.95em;
                        display: block;
                        transition: all 0.3s ease;
                    `;
                    
                    zoneLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        scrollToElement(zoneId);
                    });
                    
                    // Add hover effects
                    zoneItem.addEventListener('mouseenter', () => {
                        zoneLink.style.color = '#007bff';
                        zoneItem.style.backgroundColor = '#f8f9fa';
                    });
                    
                    zoneItem.addEventListener('mouseleave', () => {
                        zoneLink.style.color = '#495057';
                        zoneItem.style.backgroundColor = 'transparent';
                    });
                    
                    zoneItem.appendChild(zoneLink);
                    zoneCategories.appendChild(zoneItem);
                }
                
                // Toggle zone categories visibility on header click
                zoneHeader.addEventListener('click', function() {
                    const isCollapsed = zoneCategories.style.display === 'none';
                    zoneCategories.style.display = isCollapsed ? 'block' : 'none';
                    zoneHeader.textContent = zoneName + (isCollapsed ? ' ▼' : ' ▶');
                    zoneHeader.style.backgroundColor = isCollapsed ? '#1B54FF' : '#394464';
                });
                
                zoneGroup.appendChild(zoneHeader);
                zoneGroup.appendChild(zoneCategories);
                zonesContainer.appendChild(zoneGroup);
            });
        }
        
        categoriesContainer.appendChild(zonesContainer);
    }
    
    /**
     * Create placeholder zones when no data is available
     */
    function createEmptyStateZones(container) {
        // Create placeholder zones
        const placeholderZones = ['Blog Categories', 'More Coming Soon'];
        
        placeholderZones.forEach(zoneName => {
            const zoneGroup = document.createElement('div');
            zoneGroup.className = 'zone-group';
            zoneGroup.style.cssText = `
                background-color: #ffffff;
                break-inside: avoid;
                margin-bottom: 2px;
                border-radius: 5px;
                overflow: hidden;
            `;
            
            const zoneHeader = document.createElement('h3');
            zoneHeader.textContent = zoneName + ' ▶';
            zoneHeader.style.cssText = `
                background-color: #394464;
                color: white;
                font-family: Verdana, sans-serif;
                font-weight: bold;
                font-size: 1.1em;
                padding: 8px 15px;
                margin: 0;
                border-radius: 0 20px 20px 0;
                cursor: pointer;
                user-select: none;
                transition: background-color 0.3s ease;
                opacity: 0.8;
            `;
            
            const zoneCategories = document.createElement('div');
            zoneCategories.className = 'zone-categories';
            zoneCategories.style.cssText = `
                padding: 10px;
                display: none;
            `;
            
            // Create placeholder items
            const placeholderItems = ['Coming Soon', 'Stay Tuned', 'New Content'];
            
            placeholderItems.forEach(itemText => {
                const placeholderItem = document.createElement('div');
                placeholderItem.className = 'category-item';
                placeholderItem.style.cssText = `
                    padding: 8px 15px;
                    margin: 5px 0;
                    border-radius: 4px;
                    transition: all 0.3s ease;
                `;
                
                const placeholderLink = document.createElement('a');
                placeholderLink.href = '#';
                placeholderLink.textContent = itemText;
                placeholderLink.style.cssText = `
                    color: #495057;
                    text-decoration: none;
                    font-family: Verdana, sans-serif;
                    font-size: 0.95em;
                    display: block;
                    transition: all 0.3s ease;
                    opacity: 0.7;
                `;
                
                placeholderItem.appendChild(placeholderLink);
                zoneCategories.appendChild(placeholderItem);
            });
            
            // Toggle zone categories visibility on header click
            zoneHeader.addEventListener('click', function() {
                const isCollapsed = zoneCategories.style.display === 'none';
                zoneCategories.style.display = isCollapsed ? 'block' : 'none';
                zoneHeader.textContent = zoneName + (isCollapsed ? ' ▼' : ' ▶');
                zoneHeader.style.backgroundColor = isCollapsed ? '#1B54FF' : '#394464';
            });
            
            zoneGroup.appendChild(zoneHeader);
            zoneGroup.appendChild(zoneCategories);
            container.appendChild(zoneGroup);
        });
    }
    
    /**
     * Setup blog search functionality
     */
    function setupSearch() {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            let visibleCount = 0;
            
            // Get all blog cards
            const blogCards = document.querySelectorAll('.custom-card');
            
            blogCards.forEach(card => {
                const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
                const description = card.querySelector('p')?.textContent.toLowerCase() || '';
                
                if (title.includes(searchTerm) || description.includes(searchTerm)) {
                    card.style.display = 'flex';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Update category headers visibility
            const categoryHeaders = document.querySelectorAll('.custom-left-column h4');
            categoryHeaders.forEach(header => {
                const categoryId = header.id;
                const categoryCards = document.querySelectorAll(`.custom-card[data-category="${categoryId}"]`);
                
                let visibleCategoryCards = 0;
                categoryCards.forEach(card => {
                    if (card.style.display !== 'none') {
                        visibleCategoryCards++;
                    }
                });
                
                header.style.display = visibleCategoryCards > 0 ? 'block' : 'none';
            });
            
            // Update search count display
            if (searchCountElement) {
                if (searchTerm) {
                    searchCountElement.textContent = `Found ${visibleCount} result${visibleCount !== 1 ? 's' : ''}`;
                    searchCountElement.style.display = 'block';
                } else {
                    searchCountElement.style.display = 'none';
                }
            }
        });
    }
    
    /**
     * Setup scroll to top/bottom buttons
     */
    function setupScrollButtons() {
        const scrollTopBtn = document.getElementById('scrollTopBtn');
        const scrollBottomBtn = document.getElementById('scrollBottomBtn');
        
        if (scrollTopBtn) {
            scrollTopBtn.addEventListener('click', function() {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
        
        if (scrollBottomBtn) {
            scrollBottomBtn.addEventListener('click', function() {
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });
            });
        }
    }
    
    /**
     * Scroll to an element by ID with offset
     */
    function scrollToElement(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const offsetTop = element.getBoundingClientRect().top + window.pageYOffset;
        
        window.scrollTo({
            top: offsetTop - 100, // Offset for fixed header
            behavior: 'smooth'
        });
    }
    
    /**
     * Apply additional styles to match categoryManager.js
     */
    function applyStyles() {
        // Create style element
        const style = document.createElement('style');
        style.textContent = `
            /* Categories container styling */
            .custom-categories-container {
                border: 2px solid #ffa500 !important;
                border-radius: 8px !important;
                padding: 15px !important;
            }
            
            .custom-categories-container h4 {
                color: #394464 !important;
                font-family: Verdana, sans-serif !important;
                font-size: 1.2em !important;
                margin-bottom: 10px !important;
                padding-bottom: 10px !important;
                border-bottom: 2px solid #f0f0f0 !important;
            }
            
            /* Zone styling */
            .zone-group {
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            
            .zone-group h3:hover {
                background-color: #1B54FF !important;
            }
            
            /* Category item styling */
            .category-item {
                border-left: 3px solid transparent;
            }
            
            .category-item:hover {
                border-left: 3px solid #1B54FF;
                padding-left: 17px !important;
            }
            
            /* Extra bold class for first words */
            .extra-bold {
                font-weight: bold;
                color: #333;
            }
            
            /* Ensure minimum height for empty containers */
            .custom-left-column, 
            .custom-right-column {
                min-height: 400px;
            }
            
            /* Latest posts styling */
            .custom-latest-posts-container {
                border: 2px solid #ffa500 !important;
                border-radius: 8px !important;
                padding: 15px !important;
            }
            
            .custom-latest-posts-container h4 {
                color: #394464 !important;
                font-family: Verdana, sans-serif !important;
                font-size: 1.2em !important;
                margin-bottom: 10px !important;
                padding-bottom: 10px !important;
                border-bottom: 2px solid #f0f0f0 !important;
            }
            
            .custom-latest-posts-container ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .custom-latest-posts-container li {
                margin-bottom: 5px;
                padding-left: 15px;
                position: relative;
            }
            
            .custom-latest-posts-container li:before {
                content: "▶";
                color: #394464;
                font-size: 10px;
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
            }
            
            .custom-latest-posts-container a {
                color: #495057;
                text-decoration: none;
                font-family: Verdana, sans-serif;
                font-size: 0.95em;
                display: block;
                transition: all 0.3s ease;
                padding: 5px 0;
            }
            
            .custom-latest-posts-container a:hover {
                color: #1B54FF;
            }
            
            /* Empty state styling for categories */
            .empty-state-placeholder {
                text-align: center;
                padding: 40px 20px;
                background-color: #f8f9fa;
                border-radius: 10px;
                margin: 20px 0;
                border: 1px dashed #dee2e6;
            }
        `;
        document.head.appendChild(style);
    }
});
