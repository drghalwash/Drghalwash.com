
document.addEventListener('DOMContentLoaded', function() {
  console.log('Gallery password script loaded');

  // Ensure the password modal exists in the DOM
  const ensureModalExists = () => {
    if (!document.getElementById('passwordModal')) {
      const modalHTML = `
        <div class="modal fade" id="passwordModal" tabindex="-1" aria-labelledby="passwordModalLabel" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="passwordModalLabel">Enter Password</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <form id="passwordForm">
                  <div class="mb-3">
                    <label for="password" class="form-label">This content is password protected. Please enter the password to view:</label>
                    <input type="password" class="form-control" name="password" required>
                    <input type="hidden" id="subgallerySlug" name="slug">
                    <div id="passwordError" class="alert alert-danger mt-2" style="display: none;"></div>
                  </div>
                  <button type="submit" class="btn btn-primary">Submit</button>
                </form>
              </div>
            </div>
          </div>
        </div>`;
      
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      console.log('Password modal added to DOM');
    }
  };
  
  // First ensure the modal exists
  ensureModalExists();

  // Find all gallery links with class 'private-gallery-link'
  const galleryLinks = document.querySelectorAll('.private-gallery-link, a[data-status="Private"]');
  console.log(`Found ${galleryLinks.length} private gallery links`);

  // Add click handlers to private gallery links
  galleryLinks.forEach(function(link) {
    const slug = link.getAttribute('data-slug');
    if (slug) {
      console.log('Found private gallery link with slug:', slug);
      
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const clickedSlug = this.getAttribute('data-slug');
        
        if (clickedSlug) {
          showPasswordModal(clickedSlug);
        } else {
          console.error('Slug not found on clicked link');
        }
      });
    }
  });
  
  // Function to show the password modal
  function showPasswordModal(slug) {
    console.log('Showing password modal for slug:', slug);
    
    // Ensure modal exists before proceeding
    ensureModalExists();
    
    // Get modal element
    const modal = document.getElementById('passwordModal');
    if (!modal) {
      console.error('Password modal not found in DOM even after attempting to create it');
      return;
    }
    
    // Set the subgallery slug in the hidden field
    const slugField = document.getElementById('subgallerySlug');
    if (slugField) {
      slugField.value = slug;
      console.log('Set subgallery slug in form:', slug);
    }
    
    // Clear any previous error messages
    const errorElement = document.getElementById('passwordError');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
    
    // Clear the password field
    const passwordField = modal.querySelector('input[name="password"]');
    if (passwordField) {
      passwordField.value = '';
    }
    
    // Show the modal
    try {
      // Try using Bootstrap modal
      if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const passwordModal = new bootstrap.Modal(modal);
        passwordModal.show();
      } else {
        // Fallback if Bootstrap isn't available
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.classList.add('modal-open');
        
        // Create backdrop if it doesn't exist
        if (!document.querySelector('.modal-backdrop')) {
          const backdrop = document.createElement('div');
          backdrop.classList.add('modal-backdrop', 'fade', 'show');
          document.body.appendChild(backdrop);
        }
      }
    } catch (err) {
      console.error('Error showing modal:', err);
      // Simple fallback
      modal.style.display = 'block';
    }
  }

  // Function to display error messages
  function displayError(message) {
    const errorElement = document.getElementById('passwordError');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    } else {
      console.error('Error element not found:', message);
      alert(message);
    }
  }

  // Initialize form submission handler
  function initializeFormHandler() {
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
      passwordForm.addEventListener('submit', handleFormSubmit);
    } else {
      console.error('Password form not found in DOM');
      
      // Try again after a short delay
      setTimeout(initializeFormHandler, 500);
    }
  }
  
  // Handle form submission
  async function handleFormSubmit(e) {
    e.preventDefault();
    console.log('Password form submitted');
    
    // Get slug and password from form
    const slugField = document.getElementById('subgallerySlug');
    const passwordField = document.querySelector('#passwordModal input[name="password"]');
    
    if (!slugField || !passwordField) {
      displayError('Form fields not found');
      return;
    }
    
    const slug = slugField.value.trim();
    const password = passwordField.value.trim();
    
    if (!slug) {
      displayError('Missing subgallery slug');
      return;
    }
    
    if (!password) {
      displayError('Please enter a password');
      return;
    }
    
    console.log('Validating password for slug:', slug);
    
    // Get submit button for updating UI state
    const submitButton = passwordForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.innerHTML : 'Submit';
    
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = 'Verifying...';
    }
    
    try {
      // Create form data for the request
      const formData = new URLSearchParams();
      formData.append('slug', slug);
      formData.append('password', password);
      
      console.log('Sending API request with data:', {
        slug: slug,
        password: password
      });
      
      const response = await fetch('/galleries/validate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });
      
      // Handle the response
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('Password validation successful, redirecting to:', result.redirectUrl);
        window.location.href = result.redirectUrl;
      } else {
        // Handle error response
        console.log('Server error details:', response.status, JSON.stringify(result));
        displayError(result.message || 'Invalid password. Please try again.');
        
        // Re-enable submit button
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonText;
        }
      }
    } catch (error) {
      console.error('Error during password validation:', error);
      displayError('An error occurred. Please try again.');
      
      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    }
  }
  
  // Initialize password form handler
  initializeFormHandler();
  
  // Add event handlers for close button and backdrop clicks
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-close') || 
        e.target.classList.contains('modal-backdrop')) {
      const modal = document.getElementById('passwordModal');
      if (modal) {
        try {
          if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const passwordModal = bootstrap.Modal.getInstance(modal);
            if (passwordModal) passwordModal.hide();
          } else {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
            
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
          }
        } catch (err) {
          console.error('Error hiding modal:', err);
          modal.style.display = 'none';
        }
      }
    }
  });
});
