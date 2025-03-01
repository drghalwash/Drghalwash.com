
document.addEventListener('DOMContentLoaded', function() {
  // Initialize animated hero elements
  initHeroParticles();
  initSmoothScroll();
  initRevealOnScroll();
});

function initHeroParticles() {
  const heroSection = document.querySelector('.hero-section');
  if (!heroSection) return;
  
  const particlesContainer = document.createElement('div');
  particlesContainer.className = 'floating-particles';
  heroSection.appendChild(particlesContainer);
  
  // Create 50 particles with random properties
  for (let i = 0; i < 50; i++) {
    createParticle(particlesContainer);
  }
}

function createParticle(container) {
  const particle = document.createElement('span');
  particle.className = 'particle';
  
  // Random position, size and animation
  const size = Math.random() * 15 + 3;
  const posX = Math.random() * 100;
  const posY = Math.random() * 100;
  const duration = Math.random() * 20 + 10;
  const delay = Math.random() * 5;
  
  // Set particle style
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  particle.style.left = `${posX}%`;
  particle.style.top = `${posY}%`;
  particle.style.opacity = Math.random() * 0.5 + 0.1;
  
  // Add animation
  particle.style.animation = `floatParticle ${duration}s linear ${delay}s infinite`;
  
  // Create animation keyframes dynamically
  const keyframes = `
    @keyframes floatParticle {
      0% {
        transform: translate(0, 0) rotate(0deg);
        opacity: ${Math.random() * 0.5 + 0.1};
      }
      25% {
        transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(${Math.random() * 360}deg);
      }
      50% {
        transform: translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px) rotate(${Math.random() * 720}deg);
        opacity: ${Math.random() * 0.7 + 0.3};
      }
      75% {
        transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(${Math.random() * 360}deg);
      }
      100% {
        transform: translate(0, 0) rotate(0deg);
        opacity: ${Math.random() * 0.5 + 0.1};
      }
    }
  `;
  
  // Add keyframes to document
  const styleSheet = document.createElement('style');
  styleSheet.textContent = keyframes;
  document.head.appendChild(styleSheet);
  
  // Add particle to container
  container.appendChild(particle);
}

function initSmoothScroll() {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (!targetElement) return;
      
      window.scrollTo({
        top: targetElement.offsetTop - 100,
        behavior: 'smooth'
      });
    });
  });
}

function initRevealOnScroll() {
  // Add reveal animation for elements as they scroll into view
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  
  function checkReveal() {
    revealElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      
      if (elementTop < windowHeight - 100) {
        element.classList.add('revealed');
      }
    });
  }
  
  // Check on scroll
  window.addEventListener('scroll', checkReveal);
  
  // Check on page load
  checkReveal();
}
