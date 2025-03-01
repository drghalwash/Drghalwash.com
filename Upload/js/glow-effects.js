
document.addEventListener('DOMContentLoaded', function() {
  // Initialize glowing text elements
  const glowElements = document.querySelectorAll('.glow-text');
  glowElements.forEach(element => {
    // Store the text content as a data attribute for the ::after pseudo-element
    const text = element.textContent;
    element.setAttribute('data-text', text);
    
    // Add highlight animation
    animateGlowText(element);
  });
  
  // Initialize gradient borders
  initGradientBorders();
  
  // Add parallax effect to hero sections
  initParallaxEffect();
});

// Function to animate glow text with subtle movements
function animateGlowText(element) {
  // Random slight movement for organic feel
  const randomX = Math.random() * 10 - 5; // -5 to 5px
  const randomY = Math.random() * 10 - 5; // -5 to 5px
  const randomScale = 0.95 + Math.random() * 0.1; // 0.95 to 1.05
  
  // Apply animation with GSAP if available, otherwise use basic CSS
  if (window.gsap) {
    gsap.to(element, {
      x: randomX,
      y: randomY,
      scale: randomScale,
      duration: 4,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true
    });
  } else {
    // Fallback to CSS animation
    element.style.animation = `float 4s ease-in-out infinite`;
  }
}

// Initialize gradient border animations
function initGradientBorders() {
  const borderElements = document.querySelectorAll('.gradient-border');
  
  borderElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
      element.style.animationDuration = '2s';
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.animationDuration = '4s';
    });
  });
}

// Add subtle parallax effect to hero sections
function initParallaxEffect() {
  const heroSection = document.querySelector('.hero-section');
  if (!heroSection) return;
  
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const elements = heroSection.querySelectorAll('.parallax');
    
    elements.forEach(element => {
      const speed = element.getAttribute('data-speed') || 0.2;
      element.style.transform = `translateY(${scrollY * speed}px)`;
    });
  });
}

// Add this to global scope for easy access
window.createGlowingText = function(text, container) {
  const element = document.createElement('h2');
  element.className = 'glow-text';
  element.textContent = text;
  element.setAttribute('data-text', text);
  container.appendChild(element);
  animateGlowText(element);
  return element;
};
