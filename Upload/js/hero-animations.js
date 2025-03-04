
document.addEventListener('DOMContentLoaded', function() {
    const tagContainer = document.querySelector('.tag-container');
    if (!tagContainer) return;
    
    const tagRow = document.querySelector('.tag-row');
    if (!tagRow) return;
    
    // Get tags from the data or use defaults
    let tags = window.questionTags || ['What is plastic surgery?', 'How to choose a surgeon?', 'Recovery time', 'Risks & complications', 'Non-surgical options', 'Cost & financing'];
    
    // Assign colors to tags
    const colors = ['cyan', 'yellow', 'magenta', 'green'];
    
    // Create tags three times for smooth infinite scroll
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 3; i++) {
        tags.forEach((tag, index) => {
            const div = document.createElement('div');
            div.className = `tag ${colors[index % colors.length]}`;
            div.setAttribute('data-text', tag);
            fragment.appendChild(div);
        });
    }
    
    tagRow.appendChild(fragment);
    
    // Interactive functionality
    let isAnimationPaused = false;
    let activeTag = null;
    
    tagRow.addEventListener('click', (e) => {
        const tag = e.target.closest('.tag');
        if (!tag) return;
        
        if (activeTag === tag) {
            tag.classList.remove('active');
            activeTag = null;
            tagRow.style.animationPlayState = 'running';
            isAnimationPaused = false;
            return;
        }
        
        if (activeTag) {
            activeTag.classList.remove('active');
        }
        
        tag.classList.add('active');
        activeTag = tag;
        tagRow.style.animationPlayState = 'paused';
        isAnimationPaused = true;
        
        // Resume animation after 2 seconds
        setTimeout(() => {
            if (isAnimationPaused) {
                tag.classList.remove('active');
                tagRow.style.animationPlayState = 'running';
                isAnimationPaused = false;
                activeTag = null;
            }
        }, 2000);
    });
    
    // Highlight tags in center
    function checkCenter() {
        const containerRect = tagContainer.getBoundingClientRect();
        const centerX = containerRect.left + containerRect.width / 2;
        
        document.querySelectorAll('.tag').forEach(tag => {
            const rect = tag.getBoundingClientRect();
            const tagCenter = rect.left + rect.width / 2;
            if (Math.abs(tagCenter - centerX) < 50) {
                tag.classList.add('center');
            } else {
                tag.classList.remove('center');
            }
        });
    }
    
    setInterval(checkCenter, 100);
    
    // Pause animation on hover
    tagRow.addEventListener('mouseenter', () => {
        if (!isAnimationPaused) {
            tagRow.style.animationPlayState = 'paused';
        }
    });
    
    tagRow.addEventListener('mouseleave', () => {
        if (!isAnimationPaused) {
            tagRow.style.animationPlayState = 'running';
        }
    });
});
