
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

function initializeRow() {
    const row = document.querySelector('.tag-row');
    if (!row) return;
    
    // Add tags twice to create seamless loop
    [...TAGS, ...TAGS].forEach(tag => {
        row.appendChild(createTag(tag));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeRow();
});
