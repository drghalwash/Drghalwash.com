
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

function createRow(tags) {
    const row = document.createElement('div');
    row.className = 'tag-row';
    tags.forEach(tag => row.appendChild(createTag(tag)));
    return row;
}

function initializeRows() {
    const tagContainer = document.querySelector('.tag-container');
    if (!tagContainer) return;

    const tagList = tagContainer.querySelector('.tag-list');
    if (!tagList) return;

    // Clear existing content
    tagList.innerHTML = '';

    // Create two rows with shuffled tags
    const shuffledTags = [...TAGS].sort(() => Math.random() - 0.5);
    const row1 = createRow(shuffledTags.slice(0, 6));
    const row2 = createRow(shuffledTags.slice(6));

    tagList.appendChild(row1);
    tagList.appendChild(row2);
}

document.addEventListener('DOMContentLoaded', () => {
    const tagContainer = document.querySelector('.tag-container');
    if (tagContainer) {
        const tagList = document.createElement('div');
        tagList.className = 'tag-list';
        tagContainer.appendChild(tagList);
        initializeRows();
    }
});
