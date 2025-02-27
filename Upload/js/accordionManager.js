
/***********************************************************************
 * File: /js/accordionManager.js
 * Description: Handles smooth accordion animations for Q&A sections 
 * similar to the category navigation.
 ***********************************************************************/

document.addEventListener('DOMContentLoaded', function() {
  // Initialize accordion panels
  initializeAccordion();
});

/**
 * Sets up accordion functionality with smooth animations
 */
function initializeAccordion() {
  const accordionItems = document.querySelectorAll('.accordion-item');
  
  if (!accordionItems || accordionItems.length === 0) return;
  
  accordionItems.forEach(item => {
    const button = item.querySelector('.btn-link');
    const collapse = item.querySelector('.accordion-collapse');
    
    if (!button || !collapse) return;
    
    // Set initial max-height to 0
    collapse.style.maxHeight = '0';
    collapse.style.overflow = 'hidden';
    collapse.style.transition = 'max-height 0.3s ease-out';
    
    // Only one accordion open at a time
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      
      // Close all other accordions
      accordionItems.forEach(otherItem => {
        const otherButton = otherItem.querySelector('.btn-link');
        const otherCollapse = otherItem.querySelector('.accordion-collapse');
        
        if (otherItem !== item && otherButton && otherCollapse) {
          otherButton.setAttribute('aria-expanded', 'false');
          otherButton.classList.add('collapsed');
          otherCollapse.style.maxHeight = '0';
          otherCollapse.classList.remove('show');
        }
      });
      
      // Toggle current accordion
      if (isExpanded) {
        button.setAttribute('aria-expanded', 'false');
        button.classList.add('collapsed');
        collapse.style.maxHeight = '0';
        collapse.classList.remove('show');
      } else {
        button.setAttribute('aria-expanded', 'true');
        button.classList.remove('collapsed');
        collapse.classList.add('show');
        
        // Calculate and set proper height
        const scrollHeight = collapse.scrollHeight;
        collapse.style.maxHeight = scrollHeight + 'px';
      }
    });
  });
}
