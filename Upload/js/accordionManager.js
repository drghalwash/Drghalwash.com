
/**
 * AccordionManager - Manages the Q&A accordion functionality
 */
class AccordionManager {
  constructor() {
    this.initializeAccordions();
  }

  initializeAccordions() {
    // Get all accordion buttons
    const accordionButtons = document.querySelectorAll('.accordion-item .btn-link');
    
    if (!accordionButtons || accordionButtons.length === 0) {
      console.log("No accordion elements found on this page");
      return;
    }
    
    // Add click event listeners to each accordion button
    accordionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Toggle the 'collapsed' class on the button
        button.classList.toggle('collapsed');
        
        // Get the target element ID from the data-bs-target attribute
        const targetId = button.getAttribute('data-bs-target') || 
                         button.getAttribute('aria-controls');
                         
        if (!targetId) return;
        
        // Remove the # from the ID if it exists
        const contentId = targetId.startsWith('#') ? targetId.substring(1) : targetId;
        const contentElement = document.getElementById(contentId);
        
        if (!contentElement) return;
        
        // Toggle the 'show' class on the content element
        contentElement.classList.toggle('show');
        
        // Update aria-expanded attribute
        const isExpanded = contentElement.classList.contains('show');
        button.setAttribute('aria-expanded', isExpanded);
        
        // Close other accordions if needed
        if (isExpanded) {
          accordionButtons.forEach(otherButton => {
            if (otherButton !== button) {
              otherButton.classList.add('collapsed');
              otherButton.setAttribute('aria-expanded', 'false');
              
              const otherId = otherButton.getAttribute('data-bs-target') || 
                             otherButton.getAttribute('aria-controls');
                             
              if (otherId) {
                const otherContentId = otherId.startsWith('#') ? otherId.substring(1) : otherId;
                const otherContent = document.getElementById(otherContentId);
                
                if (otherContent) {
                  otherContent.classList.remove('show');
                }
              }
            }
          });
        }
      });
    });
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const accordionManager = new AccordionManager();
});
