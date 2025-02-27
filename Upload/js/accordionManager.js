
document.addEventListener('DOMContentLoaded', function() {
    // Initialize accordions
    initAccordions();

    // Add search functionality
    setupSearch();
});

function initAccordions() {
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    accordionItems.forEach(item => {
        const button = item.querySelector('.btn-link');
        const collapseId = button.getAttribute('data-bs-target') || 
                           button.getAttribute('aria-controls');
        const collapseElement = document.getElementById(collapseId);
        
        if (!button || !collapseElement) return;
        
        // Set initial state
        let isExpanded = button.getAttribute('aria-expanded') === 'true';
        collapseElement.style.display = isExpanded ? 'block' : 'none';
        
        // Add click event
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Toggle state
            isExpanded = !isExpanded;
            button.setAttribute('aria-expanded', isExpanded);
            
            // Toggle collapse with animation
            if (isExpanded) {
                collapseElement.style.display = 'block';
                setTimeout(() => {
                    collapseElement.classList.add('show');
                }, 10);
            } else {
                collapseElement.classList.remove('show');
                setTimeout(() => {
                    collapseElement.style.display = 'none';
                }, 350); // Match transition duration
            }
        });
    });
}

function setupSearch() {
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
            const answerText = item.querySelector('.accordion-body')?.textContent.toLowerCase() || '';
            
            const isMatch = questionText.includes(term) || answerText.includes(term);
            item.style.display = isMatch ? '' : 'none';
            
            if (isMatch) matchCount++;
        });
        
        // Update result count if element exists
        const resultCount = document.getElementById('resultCount');
        if (resultCount) {
            resultCount.textContent = term ? `${matchCount} results found` : '';
        }
    });
}
