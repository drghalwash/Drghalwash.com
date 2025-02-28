/***********************************************************************
 * File: /js/blogManager.js
 * Description: Dynamically manages and displays blogs grouped by zones
 * from Supabase data.
 ***********************************************************************/

document.addEventListener('DOMContentLoaded', function() {
    // Get the blogs container elements
    const blogsContainer = document.getElementById('blogs-container');

    if (blogsContainer) {
        // Setup zone navigation and content display
        setupBlogZones();
    }
});

/**
 * Sets up the zone navigation and initial content display
 */
function setupBlogZones() {
    const zoneLinks = document.querySelectorAll('.zone-link');
    const zoneContents = document.querySelectorAll('.zone-content');

    if (zoneLinks.length > 0) {
        // Set the first zone as active by default
        zoneLinks[0].classList.add('active');
        if (zoneContents.length > 0) {
            zoneContents[0].classList.add('active');
        }

        // Add click event listener to each zone link
        zoneLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();

                // Get the zone ID from the data attribute
                const zoneId = this.getAttribute('data-zone-id');

                // Remove active class from all links and contents
                zoneLinks.forEach(l => l.classList.remove('active'));
                zoneContents.forEach(c => c.classList.remove('active'));

                // Add active class to the clicked link
                this.classList.add('active');

                // Show the corresponding content
                const content = document.querySelector(`.zone-content[data-zone-id="${zoneId}"]`);
                if (content) {
                    content.classList.add('active');
                }
            });
        });
    }

    // Initialize the blog card hover effects
    initializeBlogCards();
}

/**
 * Initializes hover effects for blog cards
 */
function initializeBlogCards() {
    const blogCards = document.querySelectorAll('.custom-card');

    blogCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.classList.add('card-hover');
        });

        card.addEventListener('mouseleave', function() {
            this.classList.remove('card-hover');
        });
    });
}

/**
 * Handles the search functionality for blogs
 */
function searchBlogs() {
    const searchInput = document.getElementById('blog-search-input');
    const blogCards = document.querySelectorAll('.custom-card');

    if (searchInput && blogCards) {
        const searchTerm = searchInput.value.toLowerCase().trim();

        blogCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('p') ? 
                card.querySelector('p').textContent.toLowerCase() : '';

            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });

        // Show/hide empty state message
        const zoneContents = document.querySelectorAll('.zone-content');
        zoneContents.forEach(zone => {
            const visibleCards = zone.querySelectorAll('.custom-card[style="display: block;"]');
            const emptyMessage = zone.querySelector('.empty-search-results');

            if (visibleCards.length === 0 && searchTerm !== '') {
                if (!emptyMessage) {
                    const message = document.createElement('p');
                    message.className = 'empty-search-results';
                    message.textContent = 'No blogs found matching your search.';
                    zone.appendChild(message);
                }
            } else if (emptyMessage) {
                emptyMessage.remove();
            }
        });
    }
}

// Initialize search if the search box exists
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('blog-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', searchBlogs);
    }
});