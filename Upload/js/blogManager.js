/**
 * Blog Manager - Manages blogs display, category navigation, and search
 * Works with the existing Blog.handlebars template structure
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const rightColumn = document.querySelector('.custom-right-column');
    const categoriesContainer = document.querySelector('.custom-categories-container ul');
    const leftColumn = document.querySelector('.custom-left-column');
    const searchInput = document.getElementById('blogSearch');

    if (!rightColumn || !categoriesContainer) return;

    // Function to handle category link click
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
                top: targetElement.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    }

    // Add click event listeners to category links
    categoriesContainer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', handleCategoryClick);
    });

    // Function to handle blog search
    function handleBlogSearch() {
        if (!searchInput) return;

        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const blogCards = document.querySelectorAll('.custom-card');
            let visibleCount = 0;

            // Create object to track which categories have visible items
            const categoryVisibility = {};

            // First, check cards and track which categories will have visible items
            blogCards.forEach(card => {
                const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
                const description = card.querySelector('p')?.textContent.toLowerCase() || '';
                const categoryId = card.closest('section')?.id || 
                                  card.previousElementSibling?.id ||
                                  card.parentElement.querySelector('h4')?.id;

                const isVisible = searchTerm === '' || 
                                 title.includes(searchTerm) || 
                                 description.includes(searchTerm);

                // Mark the card as visible or hidden
                card.style.display = isVisible ? 'flex' : 'none';

                if (isVisible) {
                    visibleCount++;
                    if (categoryId) {
                        categoryVisibility[categoryId] = true;
                    }
                }
            });

            // Then, update category headers visibility
            document.querySelectorAll('.custom-left-column h4').forEach(header => {
                const categoryId = header.id;
                header.style.display = categoryVisibility[categoryId] ? 'block' : 'none';
            });

            // Update search count if element exists
            const searchCountEl = document.getElementById('blogSearchCount');
            if (searchCountEl) {
                if (searchTerm === '') {
                    searchCountEl.style.display = 'none';
                } else {
                    searchCountEl.style.display = 'block';
                    searchCountEl.textContent = `Found ${visibleCount} result${visibleCount !== 1 ? 's' : ''}`;
                }
            }
        });
    }

    // Style active category when page loads
    function styleActiveCategory() {
        // Get the current hash from URL or first category if none
        const currentHash = window.location.hash || 
            (categoriesContainer.querySelector('a') ? 
            categoriesContainer.querySelector('a').getAttribute('href') : null);

        if (currentHash) {
            // Find and activate the matching category link
            const activeLink = categoriesContainer.querySelector(`a[href="${currentHash}"]`);
            if (activeLink) {
                activeLink.classList.add('active');

                // Scroll to the section
                const targetElement = document.querySelector(currentHash);
                if (targetElement) {
                    // Small delay to ensure DOM is ready
                    setTimeout(() => {
                        window.scrollTo({
                            top: targetElement.offsetTop - 100,
                            behavior: 'smooth'
                        });
                    }, 300);
                }
            }
        }
    }

    // Add smooth scrolling to "Read More" links
    function setupReadMoreLinks() {
        document.querySelectorAll('.custom-card-content a').forEach(link => {
            link.addEventListener('click', function(e) {
                // Allow normal link behavior but add a nice transition
                document.body.style.opacity = '0.8';
                setTimeout(() => {
                    document.body.style.opacity = '1';
                }, 300);
            });
        });
    }

    // Add styles for categories and latest posts
    const style = document.createElement('style');
    style.textContent = `
        .custom-categories-container ul a {
            text-decoration: none;
            color: #555;
            display: block;
            padding: 8px 0;
            transition: all 0.3s ease;
            border-left: 3px solid transparent;
            padding-left: 10px;
        }

        .custom-categories-container ul a:hover,
        .custom-categories-container ul a.active {
            color: #007bff;
            font-weight: bold;
            border-left: 3px solid #007bff;
            padding-left: 15px;
            background-color: rgba(0, 123, 255, 0.05);
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
        }

        .custom-latest-posts-container ul a:hover {
            color: #007bff;
        }

        #blogSearchCount {
            background-color: #f8f9fa;
            padding: 8px 15px;
            border-radius: 4px;
            margin-top: 10px;
            display: none;
            font-size: 14px;
            color: #555;
        }
    `;
    document.head.appendChild(style);

    // Initialize all components
    styleActiveCategory();
    handleBlogSearch();
    setupReadMoreLinks();
});