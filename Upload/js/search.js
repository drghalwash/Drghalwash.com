/********************************************
 * File: /js/search.js
 * Description:
 * - Filters categories and Q&A blocks based on search input.
 * - Highlights matching terms in both categories and questions.
 ********************************************/

/**
 * Injects inline CSS for search styling.
 */
function injectSearchStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .category-hidden { display: none !important; }
      .qa-hidden { opacity: 0; height: 0; overflow: hidden; transition: all 0.3s ease; }
      .search-highlight { background-color: #ffef99; padding: 2px 5px; border-radius: 3px; }
      .search-results-count { margin-top: 10px; font-weight: bold; }
      .search-no-results { color: #d9534f; font-style: italic; }
    `;
    document.head.appendChild(style);
}

/**
 * Highlights matching terms in text content.
 */
function highlightText(content, term) {
    if (!term) return content;

    const regex = new RegExp(`(${term})`, 'gi');
    return content.replace(regex, '<span class="search-highlight">$1</span>');
}

/**
 * Handles search functionality for filtering categories and Q&A sections.
 */
function handleSearch() {
    const searchInput = document.getElementById('categorySearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        const term = searchInput.value.toLowerCase().trim();
        let matchCount = 0;

        // Filter category navigation
        document.querySelectorAll('.category-group').forEach(group => {
            let hasVisibleItems = false;

            group.querySelectorAll('.category-item').forEach(item => {
                const isMatch = item.textContent.toLowerCase().includes(term);
                item.style.display = isMatch ? '' : 'none';
                if (isMatch) hasVisibleItems = true;
            });

            group.style.display = hasVisibleItems ? '' : 'none';
        });

        // Filter Q&A sections
        document.querySelectorAll('.accordion-item').forEach(item => {
            const questionText = item.querySelector('.btn-link').textContent.toLowerCase();
            const answerText = item.querySelector('.accordion-body').textContent.toLowerCase();
            
            const isMatch =
                questionText.includes(term) || answerText.includes(term);

            item.style.display = isMatch ? '' : 'none';
            
            if (isMatch) matchCount++;
        });

        // Update results count
        const resultsCountElement = document.querySelector('.search-results-count');
        
        if (term && matchCount === 0) {
          resultsCountElement.textContent = "No results found.";
          resultsCountElement.classList.add("search-no-results");
          resultsCountElement.style.display = "block";
        } else if (term) {
          resultsCountElement.textContent = `${matchCount} result(s) found.`;
          resultsCountElement.classList.remove("search-no-results");
          resultsCountElement.style.display = "block";
        } else {
          resultsCountElement.style.display = "none";
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    injectSearchStyles();
    handleSearch();
});
