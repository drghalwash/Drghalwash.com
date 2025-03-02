
/**
 * Accordion Manager - Controls accordion behavior across the site
 * Features:
 * - Only one accordion open at a time
 * - All accordions closed by default
 * - Consistent curve styling
 */
document.addEventListener('DOMContentLoaded', function() {
  // Function to initialize accordions on any page
  function initializeAccordions() {
    // Select all accordion containers on the page
    const accordionContainers = document.querySelectorAll('.custom-accordion');
    
    if (!accordionContainers.length) return;
    
    // Process each accordion container
    accordionContainers.forEach(container => {
      // Find all collapse elements within this container
      const collapseElements = container.querySelectorAll('.collapse');
      
      // Initially close all accordion items
      collapseElements.forEach(collapseEl => {
        // Remove 'show' class if present
        collapseEl.classList.remove('show');
        
        // Find the associated button and add the 'collapsed' class
        const buttonId = collapseEl.getAttribute('aria-labelledby');
        const button = buttonId ? document.getElementById(buttonId) : null;
        
        if (button) {
          button.classList.add('collapsed');
          button.setAttribute('aria-expanded', 'false');
        }
      });
      
      // Add click event listeners to toggle buttons
      const toggleButtons = container.querySelectorAll('.btn-link');
      
      toggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Get target collapse element from the button
          const targetId = this.getAttribute('data-bs-target') || 
                          this.getAttribute('href');
          if (!targetId) return;
          
          const targetCollapse = document.querySelector(targetId);
          if (!targetCollapse) return;
          
          // Check if the target is already shown
          const isExpanded = targetCollapse.classList.contains('show');
          
          // Close all other collapses in this container
          collapseElements.forEach(collapseEl => {
            if (collapseEl !== targetCollapse) {
              collapseEl.classList.remove('show');
              
              // Reset the associated button
              const otherButtonId = collapseEl.getAttribute('aria-labelledby');
              const otherButton = otherButtonId ? document.getElementById(otherButtonId) : null;
              
              if (otherButton) {
                otherButton.classList.add('collapsed');
                otherButton.setAttribute('aria-expanded', 'false');
              }
            }
          });
          
          // Toggle the target collapse
          if (isExpanded) {
            // If it's already expanded, collapse it
            targetCollapse.classList.remove('show');
            this.classList.add('collapsed');
            this.setAttribute('aria-expanded', 'false');
          } else {
            // If it's collapsed, expand it
            targetCollapse.classList.add('show');
            this.classList.remove('collapsed');
            this.setAttribute('aria-expanded', 'true');
          }
        });
      });
    });
    
    // Special handling for Q&A page accordions with curved styles
    const qaAccordions = document.querySelectorAll('.qa-right-column .custom-accordion');
    
    qaAccordions.forEach(accordion => {
      const accordionItems = accordion.querySelectorAll('.accordion-item');
      
      accordionItems.forEach(item => {
        // Add curved styling to accordion items
        item.style.borderRadius = '10px';
        item.style.marginBottom = '10px';
        item.style.overflow = 'hidden';
        
        // Find the button in this item
        const button = item.querySelector('.btn-link');
        if (button) {
          // Style the button to match the screenshot
          button.style.display = 'flex';
          button.style.alignItems = 'center';
          button.style.width = '100%';
          button.style.textAlign = 'left';
          button.style.padding = '15px 20px';
          button.style.position = 'relative';
          button.style.backgroundColor = '#1a2c55';
          button.style.color = 'white';
          button.style.textDecoration = 'none';
          button.style.fontWeight = '500';
          button.style.borderRadius = '5px';
          
          // Add the circular minus/plus indicators
          if (!button.querySelector('.accordion-icon')) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'accordion-icon';
            iconSpan.style.position = 'absolute';
            iconSpan.style.left = '5px';
            iconSpan.style.top = '50%';
            iconSpan.style.transform = 'translateY(-50%)';
            iconSpan.style.width = '25px';
            iconSpan.style.height = '25px';
            iconSpan.style.borderRadius = '50%';
            iconSpan.style.backgroundColor = '#ffffff';
            iconSpan.style.display = 'flex';
            iconSpan.style.alignItems = 'center';
            iconSpan.style.justifyContent = 'center';
            iconSpan.style.color = '#1a2c55';
            iconSpan.style.fontWeight = 'bold';
            iconSpan.innerHTML = '-';
            
            // Add the icon before the button text
            button.insertBefore(iconSpan, button.firstChild);
            
            // Add padding for the icon
            button.style.paddingLeft = '40px';
            
            // Update icon based on collapse state
            button.addEventListener('click', function() {
              if (this.classList.contains('collapsed')) {
                iconSpan.innerHTML = '+';
              } else {
                iconSpan.innerHTML = '-';
              }
            });
            
            // Set initial state
            if (button.classList.contains('collapsed')) {
              iconSpan.innerHTML = '+';
            }
          }
        }
        
        // Style the content area
        const collapseEl = item.querySelector('.collapse');
        if (collapseEl) {
          collapseEl.style.padding = '15px 20px';
          collapseEl.style.backgroundColor = '#f8f9fa';
          collapseEl.style.borderTop = '1px solid #dee2e6';
        }
      });
    });
  }
  
  // Initialize all accordions when DOM is loaded
  initializeAccordions();
  
  // Re-initialize accordions when the page content might have changed
  // This helps with dynamic content or SPA navigation
  document.addEventListener('contentChanged', initializeAccordions);
});
