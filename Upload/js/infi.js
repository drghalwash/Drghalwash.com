
document.addEventListener('DOMContentLoaded', function() {
    const tags = [
        'Dr. Khaled Ghalwash', 'Dr. Mohammed Ghalwash', 'Alexandria, Egypt',
        'Plastic Surgery', 'Aesthetic Excellence', 'Patient Care',
        'Professional Experience', 'Surgical Expertise', 'Medical Innovation'
    ];

    const tagRow = document.querySelector('.tag-row');
    if (!tagRow) return;

    function createTags() {
        const tagsHtml = tags.map(tag => `<div class="tag">${tag}</div>`).join('');
        tagRow.innerHTML = tagsHtml + tagsHtml; // Duplicate for seamless scrolling
    }

    createTags();
});
