/**
 * Blog Zone Manager - Manages blog display categorized by zones
 * Similar to categoryManager.js but specialized for the blog page
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const customRightColumn = document.querySelector('.custom-right-column');
    const categoriesContainer = document.querySelector('.custom-categories-container ul');
    const leftColumn = document.querySelector('.custom-left-column');
    const searchInput = document.getElementById('blogSearch');

    // Initialize component
    initializeBlogManager();

    /**
     * Main initialization function
     */
    function initializeBlogManager() {
        if (!customRightColumn || !categoriesContainer) {
            console.warn('Blog Manager: Required DOM elements not found');
            return;
        }

        console.log('Blog Manager: Initializing');

        // Setup event listeners and functionality
        setupCategoryLinks();
        handleEmptyState();
        setupSearchFunctionality();

        // Set initial active category based on URL hash or first available
        window.addEventListener('hashchange', styleActiveCategory);
    }

    /**
     * Handles empty state styling for blog zones
     */
    function handleEmptyState() {
        const isEmpty = leftColumn.querySelector('.empty-state-placeholder');

        if (isEmpty) {
            console.log('Blog Manager: Empty state detected, creating placeholders');

            // Create placeholder categories if needed
            if (categoriesContainer && categoriesContainer.children.length === 0) {
                const zoneNames = ['Face Procedures', 'Body Procedures', 'Non-Surgical', 'Latest Articles'];

                zoneNames.forEach(zoneName => {
                    const listItem = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = `#${zoneName.replace(/\s+/g, '-')}`;
                    link.textContent = zoneName;
                    link.classList.add('disabled-link');
                    listItem.appendChild(link);
                    categoriesContainer.appendChild(listItem);
                });

                // Add placeholder zone headers to left column
                if (leftColumn) {
                    for (const zoneName of zoneNames) {
                        const placeholderHeader = document.createElement('h4');
                        placeholderHeader.id = zoneName.replace(/\s+/g, '-');
                        placeholderHeader.textContent = zoneName;

                        if (isEmpty) {
                            leftColumn.insertBefore(placeholderHeader, leftColumn.querySelector('.empty-state-placeholder'));
                        } else {
                            leftColumn.appendChild(placeholderHeader);
                        }
                    }
                }
            }

            // Create placeholder latest posts
            const latestPostsContainer = document.querySelector('.custom-latest-posts-container ul');
            if (latestPostsContainer && latestPostsContainer.children.length === 0) {
                for (let i = 0; i < 3; i++) {
                    const placeholderPost = document.createElement('li');
                    placeholderPost.innerHTML = `<a href="#">Upcoming Blog Post ${i+1}</a>`;
                    latestPostsContainer.appendChild(placeholderPost);
                }
            }
        }
    }

    /**
     * Sets up category navigation
     */
    function setupCategoryLinks() {
        if (!categoriesContainer) return;

        const categoryLinks = categoriesContainer.querySelectorAll('a');
        if (categoryLinks.length === 0) return;

        // Add click listeners safely
        categoryLinks.forEach(link => {
            if (link && link.getAttribute('href')) {
                link.addEventListener('click', handleCategoryClick);
            }
        });

        // Style active category based on URL hash or default to first
        styleActiveCategory();

        console.log('Blog Manager: Category links initialized');
    }

    /**
     * Handles category link clicks with smooth scrolling
     */
    function handleCategoryClick(e) {
        e.preventDefault();

        const target = e.target.closest('a');
        if (!target) return;

        const targetId = target.getAttribute('href');
        if (!targetId) return;

        // Remove 'active' class from all links
        categoriesContainer.querySelectorAll('a').forEach(link => {
            link.classList.remove('active');
        });

        // Add 'active' class to clicked link
        target.classList.add('active');

        // Find the target element and scroll to it
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 100, // Add some offset for header
                behavior: 'smooth'
            });
        }
    }

    /**
     * Styles active category based on URL hash or defaults to first category
     */
    function styleActiveCategory() {
        if (!categoriesContainer) return;

        // Get current hash or default to first category
        const currentHash = window.location.hash || 
            (categoriesContainer.querySelector('a') ? 
            categoriesContainer.querySelector('a').getAttribute('href') : null);

        if (currentHash) {
            // Reset all links
            categoriesContainer.querySelectorAll('a').forEach(link => {
                link.classList.remove('active');
            });

            // Find matching category link
            const activeLink = categoriesContainer.querySelector(`a[href="${currentHash}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            } else if (categoriesContainer.querySelector('a')) {
                // Default to first if no match
                categoriesContainer.querySelector('a').classList.add('active');
            }
        }
    }

    /**
     * Sets up blog search functionality
     */
    function setupSearchFunctionality() {
        if (!searchInput) return;

        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const blogCards = document.querySelectorAll('.custom-card');
            let visibleCount = 0;

            // Hide/show blog cards based on search
            blogCards.forEach(card => {
                const titleEl = card.querySelector('h3');
                const descEl = card.querySelector('p');

                if (!titleEl || !descEl) return;

                const title = titleEl.textContent.toLowerCase();
                const description = descEl.textContent.toLowerCase();

                const isVisible = title.includes(searchTerm) || description.includes(searchTerm);
                card.style.display = isVisible ? 'flex' : 'none';

                if (isVisible) visibleCount++;
            });

            // Update category headers visibility
            document.querySelectorAll('.custom-left-column h4').forEach(header => {
                if (!header || !header.id) return;

                const categoryId = header.id;
                const categoryCards = document.querySelectorAll(`.custom-card[data-category="${categoryId}"]`);

                let hasVisibleCards = false;
                categoryCards.forEach(card => {
                    if (card.style.display !== 'none') {
                        hasVisibleCards = true;
                    }
                });

                header.style.display = hasVisibleCards || searchTerm === '' ? 'block' : 'none';
            });

            // Show search results count
            const searchCountEl = document.getElementById('blogSearchCount');
            if (searchCountEl) {
                if (searchTerm === '') {
                    searchCountEl.textContent = '';
                } else {
                    searchCountEl.textContent = `Found ${visibleCount} result${visibleCount !== 1 ? 's' : ''}`;
                }
            }
        });
    }

    // Add CSS styles for active links and search results
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .custom-categories-container ul li a.active {
                color: #007bff !important;
                font-weight: bold;
            }
            .disabled-link {
                color: #999 !important;
                cursor: default;
            }
            #blogSearchCount {
                margin-top: 5px;
                font-size: 14px;
                color: #666;
            }
            .empty-state-placeholder {
                text-align: center;
                padding: 40px 20px;
                background-color: #f8f9fa;
                border-radius: 8px;
                margin: 20px 0;
            }
            .empty-state-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
        `;
        document.head.appendChild(style);
    }

    // Add styles
    addStyles();

    /**
     * Adds CSS styling for all blog components
     * Including empty state styling
     */
    function applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Category links styling */
            .custom-categories-container ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .custom-categories-container ul a {
                text-decoration: none;
                color: #555;
                display: block;
                padding: 8px 10px;
                margin: 2px 0;
                border-radius: 4px;
                transition: all 0.3s ease;
            }
            
            .custom-categories-container ul a:hover,
            .custom-categories-container ul a.active {
                color: #007bff;
                font-weight: bold;
                background-color: rgba(0, 123, 255, 0.05);
                border-left: 3px solid #007bff;
                padding-left: 15px;
            }
            
            /* Latest posts styling */
            .custom-latest-posts-container ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .custom-latest-posts-container ul a {
                text-decoration: none;
                color: #555;
                display: block;
                padding: 8px 0;
                transition: color 0.3s ease;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .custom-latest-posts-container ul a:hover {
                color: #007bff;
            }
            
            /* Search results count */
            .search-results-count {
                background-color: #f8f9fa;
                padding: 8px 15px;
                border-radius: 4px;
                margin-top: 10px;
                display: none;
                font-size: 14px;
                color: #555;
            }
            
            /* Blog card animations */
            .custom-card {
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                margin-bottom: 30px;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            .custom-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            }
            
            /* Empty state styling */
            .empty-state-placeholder {
                text-align: center;
                padding: 40px 20px;
                background-color: #f8f9fa;
                border-radius: 10px;
                margin: 20px 0;
                border: 1px dashed #dee2e6;
            }
            
            .empty-state-icon {
                font-size: 50px;
                margin-bottom: 20px;
            }
            
            .empty-state-placeholder h3 {
                color: #6c757d;
                margin-bottom: 10px;
            }
            
            .empty-state-placeholder p {
                color: #adb5bd;
            }
            
            /* Ensure containers have minimum height */
            .custom-container {
                min-height: 500px;
            }
            
            .custom-left-column, 
            .custom-right-column {
                min-height: 400px;
            }
            
            /* Maintain proper spacing with headers */
            .custom-left-column h4 {
                margin-top: 30px;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #f0f0f0;
            }
        `;
        document.head.appendChild(style);
        console.log('Blog Manager: Styles applied');
    }
});