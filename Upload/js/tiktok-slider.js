// Initialize after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Card data structure
  const cardData = [
    {
      frontImage: '/images/card1.jpg',
      backContent: {
        title: 'London Sunset',
        description: 'A beautiful view of Big Ben during golden hour'
      }
    },
    // Add more cards as needed
  ];

  // Initialize Swiper with advanced configuration
  const swiper = new Swiper('.swiper-container', {
    // Essential Settings
    effect: 'cards',
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: 'auto',
    initialSlide: 2,

    // Enhanced 3D Effects
    cardsEffect: {
      perSlideOffset: 8,
      perSlideRotate: 2,
      rotate: true,
      slideShadows: true
    },

    // Responsive Breakpoints
    breakpoints: {
      320: {
        slidesPerView: 1,
        spaceBetween: 20
      },
      768: {
        slidesPerView: 2,
        spaceBetween: 30
      },
      1024: {
        slidesPerView: 3,
        spaceBetween: 40
      }
    },

    // Navigation
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },

    // Pagination
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      dynamicBullets: true
    },

    // Advanced Features
    keyboard: {
      enabled: true,
      onlyInViewport: false
    },
    mousewheel: {
      invert: false
    },

    // Autoplay (optional)
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true
    }
  });

  // Card Flip Functionality
  const initializeCardFlip = () => {
    const cards = document.querySelectorAll('.card-3d');
    
    cards.forEach(card => {
      // Flip animation handler
      card.addEventListener('click', function(e) {
        // Prevent flip when clicking navigation elements
        if (e.target.closest('.swiper-button-next, .swiper-button-prev')) {
          return;
        }
        
        this.classList.toggle('card-flipped');
        
        // Add flip animation class
        this.style.transform = this.classList.contains('card-flipped') 
          ? 'rotateY(180deg)' 
          : 'rotateY(0deg)';
      });

      // Hover effects
      card.addEventListener('mouseenter', function() {
        if (!this.classList.contains('card-flipped')) {
          this.style.transform = 'scale(1.05) translateZ(20px)';
        }
      });

      card.addEventListener('mouseleave', function() {
        if (!this.classList.contains('card-flipped')) {
          this.style.transform = 'scale(1) translateZ(0)';
        }
      });
    });
  };

  // Lazy Loading Images
  const lazyLoadImages = () => {
    const images = document.querySelectorAll('.swiper-slide img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  };

  // Animation Handlers
  const addSlideAnimations = () => {
    swiper.on('slideChangeTransitionStart', function() {
      const activeSlide = this.slides[this.activeIndex];
      activeSlide.style.transform = 'scale(0.9)';
      setTimeout(() => {
        activeSlide.style.transform = 'scale(1)';
      }, 300);
    });
  };

  // Initialize all features
  initializeCardFlip();
  lazyLoadImages();
  addSlideAnimations();

  // Export for Node.js environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      swiper,
      initializeCardFlip,
      lazyLoadImages,
      addSlideAnimations
    };
  }
});

// Error handling
window.addEventListener('error', function(e) {
  console.error('Swiper Error:', e.message);
  // Implement fallback functionality if needed
});
