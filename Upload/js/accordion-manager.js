
document.addEventListener('DOMContentLoaded', function() {
  // Function to initialize all accordions
  function initializeAccordions() {
    // Close all accordion items except the first one on each page
    document.querySelectorAll('.custom-accordion').forEach(accordion => {
      const items = accordion.querySelectorAll('.accordion-item');
      
      // Close all accordion items initially
      items.forEach((item, index) => {
        const collapseEl = item.querySelector('.collapse');
        if (collapseEl) {
          if (index === 0) {
            // Keep the first one open
            collapseEl.classList.add('show');
          } else {
            // Close the rest
            collapseEl.classList.remove('show');
          }
        }
      });
    });

    // Set up click behavior for accordions
    setupAccordionBehavior();
    
    // Style accordions based on page type
    styleAccordions();
  }

  // Function to set up accordion click behavior
  function setupAccordionBehavior() {
    // Add click event listeners to all accordion buttons
    document.querySelectorAll('.accordion-item .btn-link').forEach(button => {
      button.addEventListener('click', function(e) {
        // Get the parent accordion
        const accordion = this.closest('.custom-accordion');
        if (!accordion) return;
        
        // Get the target collapse element
        const targetId = this.getAttribute('data-bs-target');
        const target = document.querySelector(targetId);
        if (!target) return;
        
        // Check if we should close other panels
        const isMultiple = accordion.getAttribute('data-allow-multiple') === 'true';
        if (!isMultiple) {
          // Close all other items in this accordion
          accordion.querySelectorAll('.collapse.show').forEach(item => {
            if (item.id !== targetId.substring(1)) {
              item.classList.remove('show');
              
              // Update the button's aria-expanded attribute
              const otherButton = accordion.querySelector(`[data-bs-target="#${item.id}"]`);
              if (otherButton) {
                otherButton.setAttribute('aria-expanded', 'false');
                otherButton.classList.add('collapsed');
              }
            }
          });
        }
        
        // Toggle the target
        const isExpanded = target.classList.contains('show');
        if (isExpanded) {
          target.classList.remove('show');
          this.setAttribute('aria-expanded', 'false');
          this.classList.add('collapsed');
        } else {
          target.classList.add('show');
          this.setAttribute('aria-expanded', 'true');
          this.classList.remove('collapsed');
        }
      });
    });
  }

  // Function to apply styles to accordions
  function styleAccordions() {
    // Doctor profile page accordions
    const doctorAccordions = document.querySelectorAll('#accordion_1');
    
    doctorAccordions.forEach(accordion => {
      const buttons = accordion.querySelectorAll('.btn-link');
      buttons.forEach(button => {
        // Use a subtle gradient background
        button.style.background = 'linear-gradient(to right, #f8f9fa, #e9ecef)';
        button.style.color = '#333';
        button.style.fontWeight = '600';
        button.style.borderRadius = '4px';
        button.style.padding = '12px 20px';
        button.style.transition = 'all 0.3s ease';
        button.style.border = '1px solid #dee2e6';
        button.style.textDecoration = 'none';
        button.style.position = 'relative';
        
        // Add hover effect
        button.addEventListener('mouseenter', function() {
          this.style.background = 'linear-gradient(to right, #e9ecef, #dee2e6)';
        });
        
        button.addEventListener('mouseleave', function() {
          if (!this.classList.contains('collapsed')) {
            this.style.background = 'linear-gradient(to right, #f8f9fa, #e9ecef)';
          }
        });
      });
    });

    // Q&A page accordions
    const qaAccordions = document.querySelectorAll('.qa-right-column .custom-accordion');

    qaAccordions.forEach(accordion => {
      const accordionItems = accordion.querySelectorAll('.accordion-item');

      accordionItems.forEach(item => {
        // Add curved styling to accordion items
        item.style.borderRadius = '8px';
        item.style.marginBottom = '10px';
        item.style.overflow = 'hidden';
        item.style.border = '1px solid #dee2e6';
        item.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';

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
          button.style.backgroundColor = '#f8f9fa';
          button.style.color = '#333';
          button.style.textDecoration = 'none';
          button.style.fontWeight = '500';
          button.style.borderRadius = '0';
          button.style.transition = 'all 0.3s ease';
          button.style.border = 'none';
          
          // Open state styling
          if (!button.classList.contains('collapsed')) {
            button.style.backgroundColor = '#f1f8ff';
            button.style.color = '#0056b3';
          }
          
          // Handle hover effect
          button.addEventListener('mouseenter', function() {
            if (this.classList.contains('collapsed')) {
              this.style.backgroundColor = '#f0f0f0';
            } else {
              this.style.backgroundColor = '#e6f0ff';
            }
          });
          
          button.addEventListener('mouseleave', function() {
            if (this.classList.contains('collapsed')) {
              this.style.backgroundColor = '#f8f9fa';
            } else {
              this.style.backgroundColor = '#f1f8ff';
            }
          });
        }

        // Style the content area
        const collapseEl = item.querySelector('.collapse');
        if (collapseEl) {
          collapseEl.style.padding = '15px 20px';
          collapseEl.style.backgroundColor = 'white';
          collapseEl.style.borderTop = '1px solid #dee2e6';
        }
      });
    });
  }

  // Initialize all accordions when DOM is loaded
  initializeAccordions();
});
