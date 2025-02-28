
/**
 * Blog Manager - Comprehensive solution for blog display
 * Handles categories, search, and navigation in a robust way
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get key DOM elements with safe checks
    const rightColumn = document.querySelector('.custom-right-column');
    const categoriesContainer = document.querySelector('.custom-categories-container ul');
    const searchInput = document.getElementById('blogSearch');
    const searchCountElement = document.getElementById('blogSearchCount');
    const blogCards = document.querySelectorAll('.custom-card');
    const categoryHeaders = document.querySelectorAll('.custom-left-column h4');
    
    // Only proceed if we have the essential elements
    if (!rightColumn || !categoriesContainer) {
        console.log('Blog Manager: Essential elements not found');
        return;
    }
    
    /**
     * Safely handles category link clicks with smooth scrolling
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
        
        console.log('Blog Manager: Category links initialized');
    }
    
    /**
     * Handles blog search functionality
     */
    function setupBlogSearch() {
        if (!searchInput) return;
        
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            let visibleCount = 0;
            
            // Create a mapping of category headers to their visible cards
            const categoryVisibility = {};
            
            // Check all blog cards for matches
            blogCards.forEach(card => {
                if (!card) return;
                
                const titleElement = card.querySelector('h3');
                const descElement = card.querySelector('p');
                
                if (!titleElement || !descElement) return;
                
                const title = titleElement.textContent.toLowerCase();
                const description = descElement.textContent.toLowerCase();
                const isVisible = title.includes(searchTerm) || description.includes(searchTerm);
                
                // Show/hide based on search match
                card.style.display = isVisible ? 'block' : 'none';
                
                if (isVisible) {
                    visibleCount++;
                    
                    // Find which category this card belongs to
                    const section = card.closest('section') || card.parentElement;
                    if (section) {
                        const header = section.querySelector('h4');
                        if (header && header.id) {
                            categoryVisibility[header.id] = true;
                        }
                    }
                }
            });
            
            // Update category header visibility
            categoryHeaders.forEach(header => {
                if (!header || !header.id) return;
                
                const hasVisibleCards = categoryVisibility[header.id] || false;
                header.style.display = hasVisibleCards ? 'block' : 'none';
            });
            
            // Update search count display
            if (searchCountElement) {
                if (searchTerm && visibleCount > 0) {
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
     * Adds CSS styling for the blog components
     */
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
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
            
            .search-results-count {
                background-color: #f8f9fa;
                padding: 8px 15px;
                border-radius: 4px;
                margin-top: 10px;
                display: none;
                font-size: 14px;
                color: #555;
            }
            
            .custom-card {
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            
            .custom-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            }
        `;
        document.head.appendChild(style);
        console.log('Blog Manager: Styles applied');
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
    
    // Initialize all components
    try {
        console.log('Blog Manager: Initializing...');
        addStyles();
        setupCategoryLinks();
        setupBlogSearch();
        styleActiveCategory();
        setupScrollButtons();
        console.log('Blog Manager: Successfully initialized');
    } catch (error) {
        console.error('Blog Manager: Error during initialization', error);
    }
});
