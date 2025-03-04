
const TAGS = [
    'Node.js', 'Express', 'Bootstrap', 'JavaScript', 'HTML',
    'CSS', 'MongoDB', 'REST API', 'Docker', 'AWS',
    'Git', 'CI/CD', 'Testing', 'Performance', 'Accessibility'
];

const TAGS_PER_ROW = 5;
const BASE_DURATION = 15000;
const INITIAL_SPEED_MULTIPLIER = 5; // Initial speed multiplier
const TARGET_SPEED_MULTIPLIER = 2;  // Target speed multiplier
const TRANSITION_DURATION = 500;    // Transition duration in milliseconds

function shuffle(array) {
    return [...array].sort(() => Math.random() - 0.5);
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function createTag(text) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = `<i class="hash">#</i>${text}`;

    let startX, currentX, velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let animationRequest;
    let initialTransform = 0;
    let isDragging = false;

    const handleInteraction = (e) => {
        e.preventDefault();
        cancelAnimationFrame(animationRequest);
        tag.classList.add('active');
        isDragging = true;
        startX = e.type === 'pointerdown' ? e.clientX : (e.touches ? e.touches[0].clientX : e.clientX);
        currentX = startX;
        lastX = startX;
        lastTime = Date.now();
        velocity = 0;

        const row = tag.closest('.tag-row');
        const computedStyle = window.getComputedStyle(row);
        const matrix = new DOMMatrix(computedStyle.transform);
        initialTransform = matrix.m41;
    };

    const handleMove = (e) => {
        if (!isDragging) return;

        const now = Date.now();
        const dt = now - lastTime;
        currentX = e.type === 'pointermove' ? e.clientX : (e.touches ? e.touches[0].clientX : e.clientX);

        velocity = (currentX - lastX) / dt;
        const row = tag.closest('.tag-row');
        const deltaX = currentX - lastX;

        const newX = initialTransform + deltaX * (1 + Math.abs(velocity));
        row.style.transform = `translate3d(${newX}px, 0, 0)`;

        lastX = currentX;
        lastTime = now;
    };

    const handleInteractionEnd = (e) => {
        e.preventDefault();
        tag.classList.remove('active');
        isDragging = false;
        const row = tag.closest('.tag-row');

        const predictedDistance = velocity * 150;
        const currentX = new DOMMatrix(window.getComputedStyle(row).transform).m41;

        // Animate smoothly back to the origin
        let animationStartTime = null;
        const animateBack = (currentTime) => {
            if (animationStartTime === null) animationStartTime = currentTime;
            const timeElapsed = currentTime - animationStartTime;
            const animationDuration = 300;

            const progress = Math.min(1, timeElapsed / animationDuration);
            const easedProgress = easeOutCubic(progress);

            const newX = currentX * (1 - easedProgress);
            row.style.transform = `translate3d(${newX}px, 0, 0)`;

            if (progress < 1) {
                animationRequest = requestAnimationFrame(animateBack);
            } else {
                row.style.transform = `translate3d(0, 0, 0)`;
            }
        };

        animationRequest = requestAnimationFrame(animateBack);
    };

    tag.addEventListener('pointerdown', handleInteraction);
    tag.addEventListener('pointerleave', handleInteractionEnd);
    tag.addEventListener('pointermove', handleMove);
    tag.addEventListener('pointerup', handleInteractionEnd);

    return tag;
}

function initializeRows() {
    const rows = document.querySelectorAll('.tag-row');

    rows.forEach((row, index) => {
        const tags = shuffle(TAGS).slice(0, TAGS_PER_ROW);
        let baseDuration = random(BASE_DURATION - 5000, BASE_DURATION + 5000);

        row.style.willChange = 'transform';

        for (let i = 0; i < 3; i++) {
            tags.forEach(tag => {
                row.appendChild(createTag(tag));
            });
        }

        // Set up initial animation duration
        let currentSpeedMultiplier = INITIAL_SPEED_MULTIPLIER;
        row.style.animationDuration = `${baseDuration / currentSpeedMultiplier}ms`;

        // Intersection Observer to handle scroll-based speed changes
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Animate the transition to the target speed
                    let startTime = null;
                    const animateSpeed = (currentTime) => {
                        if (startTime === null) startTime = currentTime;
                        const timeElapsed = currentTime - startTime;
                        const progress = Math.min(1, timeElapsed / TRANSITION_DURATION);

                        // Linear interpolation for smooth transition
                        const newSpeedMultiplier = INITIAL_SPEED_MULTIPLIER + (TARGET_SPEED_MULTIPLIER - INITIAL_SPEED_MULTIPLIER) * progress;
                        row.style.animationDuration = `${baseDuration / newSpeedMultiplier}ms`;

                        if (progress < 1) {
                            animationRequest = requestAnimationFrame(animateSpeed);
                        }
                    };
                    animationRequest = requestAnimationFrame(animateSpeed);
                    observer.unobserve(row); // Stop observing after animation
                }
            });
        }, { threshold: 0.1 }); // Adjust threshold as needed

        observer.observe(row);
    });
}

document.addEventListener('DOMContentLoaded', initializeRows);

// Easing function for smoother animation
function easeOutCubic(t) {
    t = t - 1;
    return t * t * t + 1;
}

// Performance monitoring
const perfObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach(entry => {
        if (entry.duration > 50) {
            console.warn('Long task detected:', entry);
        }
    });
});

perfObserver.observe({ entryTypes: ['longtask'] });
