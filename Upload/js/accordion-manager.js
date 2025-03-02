
/**
 * Accordion Manager
 * Handles accordion behavior across the site
 */

document.addEventListener('DOMContentLoaded', function() {
  // Find all custom accordions on the page
  const accordions = document.querySelectorAll('.custom-accordion');
  
  // Process each accordion group
  accordions.forEach(accordion => {
    const accordionId = accordion.id;
    const items = accordion.querySelectorAll('.accordion-item');
    const buttons = accordion.querySelectorAll('.btn-link');
    
    // Close all items except the first one on initial load
    items.forEach((item, index) => {
      const collapseEl = item.querySelector('.collapse');
      if (index !== 0 && collapseEl) {
        // Make sure it's fully collapsed
        collapseEl.classList.remove('show');
      }
    });
    
    // Add click event listeners to all buttons
    buttons.forEach(button => {
      button.addEventListener('click', function(e) {
        // Prevent default behavior
        e.preventDefault();
        
        const targetId = this.getAttribute('data-bs-target');
        const targetCollapse = document.querySelector(targetId);
        
        // If the clicked item is already expanded, allow it to collapse
        if (this.getAttribute('aria-expanded') === 'true') {
          return;
        }
        
        // Close all other items in this accordion
        buttons.forEach(otherButton => {
          if (otherButton !== this) {
            otherButton.setAttribute('aria-expanded', 'false');
            otherButton.classList.add('collapsed');
            
            const otherTargetId = otherButton.getAttribute('data-bs-target');
            if (otherTargetId) {
              const otherCollapse = document.querySelector(otherTargetId);
              if (otherCollapse) {
                otherCollapse.classList.remove('show');
              }
            }
          }
        });
        
        // Make sure the current button is expanded
        this.setAttribute('aria-expanded', 'true');
        this.classList.remove('collapsed');
        
        // Make sure the current collapse is shown
        if (targetCollapse) {
          targetCollapse.classList.add('show');
        }
      });
    });
  });
  
  // Fix for missing .rellax elements
  if (typeof Rellax !== 'undefined') {
    // Check if .rellax elements exist before initializing
    const rellaxElements = document.querySelectorAll('.rellax');
    if (rellaxElements.length > 0) {
      new Rellax('.rellax');
    }
  }
});
