
/**
 * Accordion Manager
 * 
 * Manages all accordion elements on the site with consistent styling
 * and behavior including curved arrows that match categoryManager.js
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get all accordion containers
  const accordionContainers = document.querySelectorAll('.custom-accordion');
  
  if (accordionContainers.length === 0) return;
  
  accordionContainers.forEach(container => {
    const accordionItems = container.querySelectorAll('.accordion-item');
    
    // Initially close all accordions except the first one
    accordionItems.forEach((item, index) => {
      const collapseElement = item.querySelector('.collapse');
      const button = item.querySelector('.btn-link');
      
      // Add arrow to all buttons and apply consistent styling
      if (button) {
        // Create arrow element
        if (!button.querySelector('.accordion-arrow')) {
          const arrow = document.createElement('span');
          arrow.className = 'accordion-arrow';
          arrow.innerHTML = '&#9658;'; // Right-pointing arrow (collapsed state)
          arrow.style.cssText = `
            display: inline-block;
            margin-left: 10px;
            transition: transform 0.3s ease;
            color: #394464;
            font-size: 0.8em;
          `;
          button.appendChild(arrow);
        }
        
        // Style all buttons consistently
        button.style.cssText = `
          color: #394464;
          font-weight: 600;
          font-family: Verdana, sans-serif;
          text-decoration: none;
          position: relative;
          width: 100%;
          text-align: left;
          padding: 15px;
          background-color: #fff;
          border: none;
          border-radius: 0;
          transition: background-color 0.3s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
        `;
        
        // Update style for expanded/collapsed state
        if (collapseElement && collapseElement.classList.contains('show')) {
          const arrow = button.querySelector('.accordion-arrow');
          if (arrow) {
            arrow.style.transform = 'rotate(90deg)';
            arrow.innerHTML = '&#9658;'; // Keep same character, just rotate
          }
          button.style.background = '#f8f9fa';
        }
      }
      
      // Close all but first item on page load
      if (index > 0 && collapseElement) {
        collapseElement.classList.remove('show');
      }
    });
    
    // Add event listeners for the accordion items
    container.addEventListener('click', function(e) {
      const button = e.target.closest('.btn-link');
      
      if (button) {
        // Find all collapse elements and close them
        const allCollapseElements = container.querySelectorAll('.collapse');
        const targetCollapseId = button.getAttribute('data-bs-target');
        const targetCollapse = document.querySelector(targetCollapseId);
        
        // Close all accordions and reset arrows
        allCollapseElements.forEach(collapse => {
          const collapseButton = container.querySelector(`[data-bs-target="#${collapse.id}"]`);
          const collapseArrow = collapseButton ? collapseButton.querySelector('.accordion-arrow') : null;
          
          // Don't close the one that was just clicked
          if (collapse.id !== targetCollapse.id.replace('#', '')) {
            collapse.classList.remove('show');
            
            if (collapseArrow) {
              collapseArrow.style.transform = '';
              collapseButton.style.background = '#fff';
            }
          }
        });
        
        // Toggle the clicked arrow
        const clickedArrow = button.querySelector('.accordion-arrow');
        if (clickedArrow) {
          if (targetCollapse.classList.contains('show')) {
            clickedArrow.style.transform = '';
            button.style.background = '#fff';
          } else {
            clickedArrow.style.transform = 'rotate(90deg)';
            button.style.background = '#f8f9fa';
          }
        }
      }
    });
  });
  
  // Apply additional styling to accordion containers
  accordionContainers.forEach(container => {
    container.style.cssText = `
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    `;
    
    // Style accordion items
    const items = container.querySelectorAll('.accordion-item');
    items.forEach((item, index) => {
      item.style.cssText = `
        border: none;
        border-bottom: 1px solid #eee;
        margin-bottom: ${index === items.length - 1 ? '0' : '1px'};
      `;
      
      // Style accordion body
      const body = item.querySelector('.accordion-body');
      if (body) {
        body.style.cssText = `
          padding: 20px;
          color: #495057;
          background-color: #fff;
          border-top: 1px solid #f5f5f5;
        `;
      }
    });
  });
});
