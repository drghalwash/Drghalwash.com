
document.addEventListener('DOMContentLoaded', function() {
    // Tags for the scrolling animation
    const tags = [
        'Dr. Khaled Ghalwash', 'Dr. Mohammed Ghalwash', 'Alexandria, Egypt',
        'Plastic Surgery', 'Aesthetic Excellence', 'Patient Care',
        'Professional Experience', 'Surgical Expertise', 'Medical Innovation',
        'Beauty Enhancement', 'Surgical Precision', 'Patient Safety',
        'What is plastic surgery?', 'How to choose a surgeon?'
    ];

    const tagRow = document.querySelector('.tag-row');
    if (!tagRow) return;
    
    // Clear any existing content
    tagRow.innerHTML = '';
    
    // Create tags twice for seamless infinite scroll
    for (let i = 0; i < 2; i++) {
        tags.forEach(tag => {
            const div = document.createElement('div');
            div.className = 'tag';
            div.textContent = tag;
            tagRow.appendChild(div);
        });
    }
    
    // Handle search redirect
    const searchInput = document.getElementById('categorySearch');
    const searchIcon = document.querySelector('.search-icon');
    
    if (searchInput) {
        searchInput.addEventListener('click', function() {
            window.location.href = '/Questions_And_Answer';
        });
    }
    
    if (searchIcon) {
        searchIcon.addEventListener('click', function() {
            window.location.href = '/Questions_And_Answer';
        });
    }
});
