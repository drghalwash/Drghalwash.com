
/**
 * Blog Manager - Comprehensive solution for blog display
 * Handles categories, search, navigation, and empty state handling
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Blog Manager: Initializing...');
    
    // Get key DOM elements with safe checks
    const leftColumn = document.querySelector('.custom-left-column');
    const rightColumn = document.querySelector('.custom-right-column');
    const categoriesContainer = document.querySelector('.custom-categories-container ul');
    const searchInput = document.getElementById('blogSearch');
    const searchCountElement = document.getElementById('blogSearchCount');
    
    // Apply default styles to maintain layout even with empty data
    applyStyles();
    
    // Handle potential empty state
    handleEmptyState();
    
    // Initialize other features only if required elements exist
    if (categoriesContainer) {
        setupCategoryLinks();
    }
    
    if (searchInput) {
        setupSearch();
    }
    
    setupScrollButtons();
    
    /**
     * Creates proper fallback content for empty states
     */
    function handleEmptyState() {
        // Check if we have any blog cards
        const blogCards = document.querySelectorAll('.custom-card');
        const categoryHeaders = document.querySelectorAll('.custom-left-column h4');
        
        // If no blog cards, add a placeholder message
        if (blogCards.length === 0 && leftColumn) {
            console.log('Blog Manager: No blog cards found, showing placeholder');
            
            // Create placeholder content
            const placeholder = document.createElement('div');
            placeholder.className = 'empty-state-placeholder';
            placeholder.innerHTML = `
                <div class="empty-state-icon">📝</div>
                <h3>No Blog Posts Yet</h3>
                <p>Check back soon for informative articles and updates.</p>
            `;
            
            // Add placeholder to left column
            leftColumn.appendChild(placeholder);
            
            // Add at least one placeholder category to maintain layout
            if (categoriesContainer && categoriesContainer.children.length === 0) {
                const placeholderCategory = document.createElement('li');
                placeholderCategory.innerHTML = '<a href="#coming-soon">Coming Soon</a>';
                categoriesContainer.appendChild(placeholderCategory);
                
                // Add placeholder header in left column
                if (categoryHeaders.length === 0) {
                    const placeholderHeader = document.createElement('h4');
                    placeholderHeader.id = 'coming-soon';
                    placeholderHeader.textContent = 'Coming Soon';
                    
                    // Insert before the placeholder if it exists
                    if (leftColumn.querySelector('.empty-state-placeholder')) {
                        leftColumn.insertBefore(placeholderHeader, leftColumn.querySelector('.empty-state-placeholder'));
                    } else {
                        leftColumn.appendChild(placeholderHeader);
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
        
        const targetId = e.target.getAttribute('href');
        if (!targetId) return;
        
        // Remove 'active' class from all links
        categoriesContainer.querySelectorAll('a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add 'active' class to clicked link
        e.target.classList.add('active');
        
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
            // Find matching category link
            const activeLink = categoriesContainer.querySelector(`a[href="${currentHash}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
                
                // Scroll to section after a short delay
                setTimeout(() => {
                    const targetElement = document.querySelector(currentHash);
                    if (targetElement) {
                        window.scrollTo({
                            top: targetElement.offsetTop - 100,
                            behavior: 'smooth'
                        });
                    }
                }, 100);
            }
        }
    }
    
    /**
     * Sets up blog search functionality
     */
    function setupSearch() {
        if (!searchInput) return;
        
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            let visibleCount = 0;
            const blogCards = document.querySelectorAll('.custom-card');
            const categoryHeaders = document.querySelectorAll('.custom-left-column h4');
            
            // Create a mapping of category headers to their visible cards
            const categoryVisibility = {};
            categoryHeaders.forEach(header => {
                categoryVisibility[header.id] = false;
            });
            
            // Check all blog cards for matches
            blogCards.forEach(card => {
                if (!card) return;
                
                const titleElement = card.querySelector('h3');
                const descElement = card.querySelector('p');
                
                if (!titleElement || !descElement) return;
                
                const title = titleElement.textContent.toLowerCase();
                const description = descElement.textContent.toLowerCase();
                const categoryId = card.getAttribute('data-category') || 
                                  (card.closest('div[id]') ? card.closest('div[id]').id : null);
                
                if (title.includes(searchTerm) || description.includes(searchTerm)) {
                    card.style.display = 'block';
                    visibleCount++;
                    
                    // Mark the category as having visible cards
                    if (categoryId && categoryVisibility.hasOwnProperty(categoryId)) {
                        categoryVisibility[categoryId] = true;
                    }
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Update category headers visibility
            categoryHeaders.forEach(header => {
                if (header.id && categoryVisibility.hasOwnProperty(header.id)) {
                    header.style.display = categoryVisibility[header.id] ? 'block' : 'none';
                }
            });
            
            // Update search count
            if (searchCountElement) {
                if (searchTerm) {
                    searchCountElement.textContent = `Found ${visibleCount} result${visibleCount !== 1 ? 's' : ''}`;
                    searchCountElement.style.display = 'block';
                } else {
                    searchCountElement.style.display = 'none';
                }
            }
        });
        
        console.log('Blog Manager: Search functionality initialized');
    }
    
    /**
     * Handle scroll events for the back-to-top button
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
