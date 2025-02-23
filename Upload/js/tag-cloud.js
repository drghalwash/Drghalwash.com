
const TAGS = [
    'Dr. Khaled Ghalwash', 'Dr. Mohammed Ghalwash', 'Alexandria, Egypt', 'Plastic Surgery',
    'Aesthetic Excellence', 'Patient Care', 'Professional Experience', 'Surgical Expertise',
    'Medical Innovation', 'Beauty Enhancement', 'Surgical Precision', 'Patient Safety'
];

function createTag(text) {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = text;
    return tag;
}

function initializeTagCloud() {
    const tagRow = document.querySelector('.tag-row');
    if (!tagRow) return;
    
    tagRow.innerHTML = ''; // Clear existing content
    
    // Create tags for continuous scrolling
    for (let i = 0; i < 3; i++) {
        TAGS.forEach(tag => {
            tagRow.appendChild(createTag(tag));
        });
    }
    
    // Add basic animation
    tagRow.style.animation = 'scrollTags 30s linear infinite';
}

// Wait for DOM and reinitialize if needed
document.addEventListener('DOMContentLoaded', () => {
    initializeTagCloud();
    // Reinitialize if container exists but empty
    const observer = new MutationObserver(() => {
        const tagRow = document.querySelector('.tag-row');
        if (tagRow && !tagRow.hasChildNodes()) {
            initializeTagCloud();
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
});
