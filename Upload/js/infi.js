document.addEventListener('DOMContentLoaded', () => {
    const tagContainer = document.querySelector('.tag-container');
    if (tagContainer) {
        const tagList = tagContainer.querySelector('.tag-list');
        if (!tagList) {
            const newTagList = document.createElement('div');
            newTagList.className = 'tag-list';
            tagContainer.appendChild(newTagList);
        }
        initializeRows();
    }
});