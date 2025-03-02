/**
 * Accordion Manager
 * Handles all accordion interactions across the site
 * - Auto-closes all accordions on page load
 * - Ensures only one accordion is open at a time
 * - Works consistently across all pages
 */
document.addEventListener('DOMContentLoaded', function() {
  // Initialize all accordions (close them on page load)
  initializeAccordions();

  // Set up event listeners for accordion buttons
  setupAccordionListeners();

  // Fix for other missing elements in the page
  initializeRellaxSafely();
});

function initializeAccordions() {
  // Get all accordion collapse elements
  const allCollapseElements = document.querySelectorAll('.collapse');

  // Close all accordions initially
  allCollapseElements.forEach(collapse => {
    collapse.classList.remove('show');
  });

  // Remove 'show' class from first accordion if it has it by default
  const firstAccordions = document.querySelectorAll('[id^="collapseOne"]');
  firstAccordions.forEach(accordion => {
    accordion.classList.remove('show');
  });
}

function setupAccordionListeners() {
  // Get all accordion toggle buttons
  const accordionButtons = document.querySelectorAll('.accordion-item .btn-link');

  // Add click event to each button
  accordionButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      // Get the target collapse element ID
      const targetId = this.getAttribute('data-bs-target') || 
                      this.getAttribute('data-target');

      if (!targetId) return;

      // Get parent accordion container
      const parentAccordion = this.closest('.custom-accordion');
      if (!parentAccordion) return;

      // Get all collapse elements in this accordion group
      const allCollapses = parentAccordion.querySelectorAll('.collapse');

      // Target collapse element
      const targetCollapse = document.querySelector(targetId);

      // If target is already showing, we're closing it - do nothing else
      if (targetCollapse && targetCollapse.classList.contains('show')) {
        return;
      }

      // Close all other accordions in this group
      allCollapses.forEach(collapse => {
        if (collapse.id !== targetId.replace('#', '')) {
          collapse.classList.remove('show');
        }
      });
    });
  });
}

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