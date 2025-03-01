
(function() {
    const TAGS = [
        'Dr. Khaled Ghalwash', 'Dr. Mohammed Ghalwash', 'Alexandria, Egypt',
        'Plastic Surgery', 'Aesthetic Excellence', 'Patient Care',
        'Professional Experience', 'Surgical Expertise', 'Medical Innovation',
        'Beauty Enhancement', 'Surgical Precision', 'Patient Safety'
    ];

    function createTags() {
        const tagRow = document.querySelector('.tag-row');
        if (!tagRow) return;

        const fragment = document.createDocumentFragment();
        
        // Create tags three times for smooth infinite scroll
        for (let i = 0; i < 3; i++) {
            TAGS.forEach(tag => {
                const div = document.createElement('div');
                div.className = 'tag';
                div.textContent = tag;
                fragment.appendChild(div);
            });
        }
        
        tagRow.appendChild(fragment);

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

            setTimeout(() => {
                if (isAnimationPaused) {
                    tag.classList.remove('active');
                    tagRow.style.animationPlayState = 'running';
                    isAnimationPaused = false;
                    activeTag = null;
                }
            }, 2000);
        });

        // Check for center position
        function checkCenter() {
            const container = document.querySelector('.tag-container');
            if (!container) return;
            
            const containerRect = container.getBoundingClientRect();
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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createTags);
    } else {
        createTags();
    }
})();
