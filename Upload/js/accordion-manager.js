/**
 * Accordion Manager - Controls accordion behavior across the site
 * Features:
 * - Only one accordion open at a time
 * - All accordions closed by default
 * - Consistent styling across pages
 */
document.addEventListener('DOMContentLoaded', function() {
  // Function to initialize all accordions on the page
  function initializeAccordions() {
    // Get all accordion containers
    const accordionContainers = document.querySelectorAll('.custom-accordion');

    if (!accordionContainers.length) return;

    // Process each accordion container
    accordionContainers.forEach(container => {
      // Find all collapse elements in this container
      const collapseElements = container.querySelectorAll('.collapse');

      // Close all accordion items initially
      collapseElements.forEach(collapse => {
        collapse.classList.remove('show');

        // Find the button that controls this collapse
        const controlId = collapse.id;
        const button = container.querySelector(`[data-bs-target="#${controlId}"]`);

        if (button) {
          button.classList.add('collapsed');
          button.setAttribute('aria-expanded', 'false');
        }
      });

      // Add click event listeners to all toggle buttons
      const toggleButtons = container.querySelectorAll('.btn-link');

      toggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
          e.preventDefault();

          // Get the target collapse element
          const targetId = this.getAttribute('data-bs-target');
          const targetCollapse = document.querySelector(targetId);

          if (!targetCollapse) return;

          // Check if the clicked item is already open
          const isExpanded = this.getAttribute('aria-expanded') === 'true';

          // Close all items in this accordion first
          collapseElements.forEach(collapse => {
            // Skip the target if we're opening it
            if (collapse === targetCollapse && !isExpanded) return;

            collapse.classList.remove('show');

            // Find and update the corresponding button
            const collapseId = collapse.id;
            const collapseButton = container.querySelector(`[data-bs-target="#${collapseId}"]`);

            if (collapseButton) {
              collapseButton.classList.add('collapsed');
              collapseButton.setAttribute('aria-expanded', 'false');
            }
          });

          // Toggle the target item
          if (isExpanded) {
            // Close it if it was already open
            targetCollapse.classList.remove('show');
            this.classList.add('collapsed');
            this.setAttribute('aria-expanded', 'false');
          } else {
            // Open it if it was closed
            targetCollapse.classList.add('show');
            this.classList.remove('collapsed');
            this.setAttribute('aria-expanded', 'true');
          }
        });
      });
    });

    // Special handling for Q&A page accordions
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
          // Style the button to match the design
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
  document.addEventListener('contentChanged', initializeAccordions);
});