
/***********************************************************************
 * File: /js/blogManager.js
 * Description: Dynamically generates blog navigation and handles 
 * responsive grid layout for blogs based on Supabase data.
 ***********************************************************************/

function generateBlogNav(zones) {
    const navContainer = document.querySelector('.blogs-container .blogs');
    if (!navContainer) return;

    navContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(1, minmax(200px, 1fr));
        gap: 15px;
        border: 2px solid #ffa500;
        border-radius: 8px;
        padding: 15px;
    `;

    zones.forEach(zone => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'blog-group';
        groupDiv.style.cssText = `
            background-color: #ffffff;
            break-inside: avoid;
            margin-bottom: 0.11px;
        `;

        const header = document.createElement('h3');
        header.textContent = zone.name + ' ▶'; // Changed to ▶ for collapsed state
        header.style.cssText = `
            background-color: #394464;
            color: white;
            font-family: Verdana, sans-serif;
            font-weight: bold;
            font-size: 1.1em;
            padding: 8px 15px;
            margin-bottom: 0.1px;
            border-radius: 0 20px 20px 0;
            cursor: pointer;
            user-select: none;
            transition: background-color 0.3s ease;
        `;

        const categoriesContainer = document.createElement('div');
        categoriesContainer.style.cssText = `
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
        `;
        
        header.addEventListener('click', () => {
            const isExpanded = categoriesContainer.style.maxHeight !== '0px';

            // Collapse all other categories
            const allCategories = document.querySelectorAll('.blogs-container .blogs > .blog-group > div');
            allCategories.forEach(container => {
                if (container !== categoriesContainer) {
                    container.style.maxHeight = '0';
                    const otherZoneHeader = container.previousElementSibling;
                    otherZoneHeader.textContent = otherZoneHeader.dataset.zoneName + ' ▶'; // Use data attribute
                    otherZoneHeader.style.backgroundColor = '#394464';
                }
            });

            // Expand the clicked category
            categoriesContainer.style.maxHeight = isExpanded ? '0' : '1000px';
            header.textContent = zone.name + (isExpanded ? ' ▶' : ' ▼'); // Use correct zone name
            header.style.backgroundColor = isExpanded ? '#394464' : '#2c3e50';
        });

        // Set data attribute for the zone name
        header.dataset.zoneName = zone.name;
        
        zone.blogs.forEach(blog => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'blog-item';
            itemDiv.style.cssText = `
                padding: 8px 15px;
                margin: 0.3px 0;
                transition: all 0.3s ease;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            // Add soon tag if blog has no content
            if (!blog.content || blog.content.length === 0) {
                const soonTag = document.createElement('span');
                soonTag.textContent = 'soon';
                soonTag.style.cssText = `
                    background: linear-gradient(45deg, #FF8C42, #FFA07A);
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.7em;
                    font-weight: bold;
                    margin-left: 8px;
                `;
                itemDiv.appendChild(soonTag);
            }

            const link = document.createElement('a');
            link.href = `/Read_More/${blog.slug || blog.id}`;

            const words = blog.title.split(' ');
            const firstTwoWords = words.slice(0, 2).join(' ');
            const remainingWords = words.slice(2).join(' ');

            link.innerHTML = `<span class="extra-bold">${firstTwoWords}</span> ${remainingWords}`;
            link.style.cssText = `
                color: #495057;
                text-decoration: none;
                font-family: Verdana, sans-serif;
                font-size: 0.95em;
                display: block;
                transition: all 0.3s ease;
            `;

            link.addEventListener('mouseenter', () => {
                link.style.color = '#007bff';
                itemDiv.style.backgroundColor = '#f8f9fa';
            });

            link.addEventListener('mouseleave', () => {
                link.style.color = '#495057';
                itemDiv.style.backgroundColor = 'transparent';
            });

            itemDiv.appendChild(link);
            categoriesContainer.appendChild(itemDiv);
        });

        groupDiv.appendChild(header);
        groupDiv.appendChild(categoriesContainer);
        navContainer.appendChild(groupDiv);
    });
}

function handleResponsiveDesign() {
    const blogs = document.querySelector('.blogs-container .blogs');
    if (!blogs) return;

    const updateGrid = () => {
        const width = window.innerWidth;
        blogs.style.gridTemplateColumns = 'repeat(1, minmax(200px, auto))';
    };

    updateGrid();
    window.addEventListener('resize', updateGrid);
}

function enableAutoScroll() {
    document.querySelectorAll('.blog-item a').forEach(link => {
        link.addEventListener('click', (event) => {
            // Allow normal link navigation for blogs
        });
    });
}

function injectBlogStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .blog-group h3:hover {
        background-color: #2c3e50 !important;
      }
      .blog-item:hover {
        background-color: #f8f9fa;
      }
      .extra-bold {
        font-weight: 700;
      }
      @media (max-width: 768px) {
        .blogs-container .blogs {
          grid-template-columns: 1fr !important;
        }
      }
    `;
    document.head.appendChild(style);
}

function handleBlogSearch() {
    const searchInput = document.getElementById('blogSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        const term = searchInput.value.toLowerCase().trim();
        let matchCount = 0;

        // Filter blog navigation
        document.querySelectorAll('.blog-group').forEach(group => {
            let hasVisibleItems = false;

            group.querySelectorAll('.blog-item').forEach(item => {
                const isMatch = item.textContent.toLowerCase().includes(term);
                item.style.display = isMatch ? '' : 'none';
                if (isMatch) hasVisibleItems = true;
            });

            group.style.display = hasVisibleItems ? '' : 'none';
        });

        // Update search results count
        const countDisplay = document.getElementById('blogSearchCount');
        if (countDisplay) {
            countDisplay.textContent = matchCount > 0 
                ? `Found ${matchCount} results` 
                : 'No results found';
            countDisplay.className = matchCount > 0 
                ? 'search-results-count' 
                : 'search-no-results';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.zonesData) {
        generateBlogNav(window.zonesData);
        handleResponsiveDesign();
        enableAutoScroll();
        injectBlogStyles();
        handleBlogSearch();
    }
});
