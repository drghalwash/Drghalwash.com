
/**
 * Accordion Manager
 * Handles accordion behavior across the site
 * - Ensures accordions close other panels when one is opened
 * - Auto-collapses all but first item on page load
 * - Handles errors gracefully when elements don't exist
 */

document.addEventListener('DOMContentLoaded', function() {
  try {
    // Find all custom accordions on the page
    const accordions = document.querySelectorAll('.custom-accordion');
    if (!accordions || accordions.length === 0) return; // Exit if no accordions exist
    
    // Process each accordion group
    accordions.forEach(accordion => {
      if (!accordion) return; // Skip if accordion is null
      
      const items = accordion.querySelectorAll('.accordion-item');
      if (!items || items.length === 0) return; // Exit if no items
      
      const buttons = accordion.querySelectorAll('.btn-link');
      if (!buttons || buttons.length === 0) return; // Exit if no buttons
      
      // Close all items except the first one on initial load
      items.forEach((item, index) => {
        if (!item) return; // Skip if item is null
        
        const collapseEl = item.querySelector('.collapse');
        if (!collapseEl) return; // Skip if collapse element not found
        
        if (index !== 0) {
          // Make sure all except first are collapsed
          collapseEl.classList.remove('show');
          
          // Make sure button shows correct state
          const itemButton = item.querySelector('.btn-link');
          if (itemButton) {
            itemButton.classList.add('collapsed');
            itemButton.setAttribute('aria-expanded', 'false');
          }
        } else {
          // Ensure first item is expanded
          collapseEl.classList.add('show');
          
          // Set first button to expanded state
          const itemButton = item.querySelector('.btn-link');
          if (itemButton) {
            itemButton.classList.remove('collapsed');
            itemButton.setAttribute('aria-expanded', 'true');
          }
        }
      });
      
      // Add click event listeners to all buttons
      buttons.forEach(button => {
        if (!button) return; // Skip if button is null
        
        button.addEventListener('click', function(e) {
          try {
            // Prevent default behavior
            e.preventDefault();
            
            const targetId = this.getAttribute('data-bs-target');
            if (!targetId) return; // Skip if no target
            
            const targetCollapse = document.querySelector(targetId);
            if (!targetCollapse) return; // Skip if target not found
            
            // If the clicked item is already expanded, allow bootstrap to handle collapse
            if (this.getAttribute('aria-expanded') === 'true') {
              return;
            }
            
            // Close all other items in this accordion
            buttons.forEach(otherButton => {
              if (!otherButton || otherButton === this) return; // Skip self or null
              
              otherButton.setAttribute('aria-expanded', 'false');
              otherButton.classList.add('collapsed');
              
              const otherTargetId = otherButton.getAttribute('data-bs-target');
              if (!otherTargetId) return; // Skip if no target
              
              const otherCollapse = document.querySelector(otherTargetId);
              if (!otherCollapse) return; // Skip if target not found
              
              otherCollapse.classList.remove('show');
            });
            
            // Make sure the current button is expanded
            this.setAttribute('aria-expanded', 'true');
            this.classList.remove('collapsed');
            
            // Make sure the current collapse is shown
            targetCollapse.classList.add('show');
          } catch (err) {
            console.error('Error in accordion click handler:', err);
          }
        });
      });
    });
    
    // Fix for other missing elements in the page
    initializeRellaxSafely();
    
  } catch (err) {
    console.error('Error initializing accordions:', err);
  }
});

/**
 * Safely initializes Rellax if available and elements exist
 */
function initializeRellaxSafely() {
  try {
    // Only initialize Rellax if it exists and elements with .rellax class exist
    if (typeof Rellax !== 'undefined') {
      const rellaxElements = document.querySelectorAll('.rellax');
      if (rellaxElements && rellaxElements.length > 0) {
        new Rellax('.rellax');
      }
    }
  } catch (err) {
    console.error('Error initializing Rellax:', err);
  }
}
