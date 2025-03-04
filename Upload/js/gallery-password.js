
// Gallery password modal handler
document.addEventListener('DOMContentLoaded', function() {
  console.log('Gallery password script initialized');
  
  // Setup event listeners for private gallery links
  setupPrivateGalleryLinks();
  
  // Check if we need to open the modal based on URL parameters
  checkUrlForAuthRequirement();
  
  // Setup the password form submission handler
  setupPasswordForm();
});

// Setup event listeners for private gallery links
function setupPrivateGalleryLinks() {
  const privateGalleryLinks = document.querySelectorAll('.private-gallery');
  
  privateGalleryLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const subgallerySlug = this.getAttribute('data-slug');
      console.log('Opening password modal for:', subgallerySlug);
      
      // Set the slug in the hidden field
      const slugField = document.getElementById('subgallerySlug');
      if (slugField) {
        slugField.value = subgallerySlug;
      }
      
      // Clear any previous error messages
      const errorDiv = document.getElementById('passwordError');
      if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
      }
      
      // Reset the password field
      const passwordField = document.querySelector('#passwordForm input[name="password"]');
      if (passwordField) {
        passwordField.value = '';
      }
      
      // Open the modal
      const passwordModal = new bootstrap.Modal(document.getElementById('passwordModal'));
      passwordModal.show();
    });
  });
}

// Check if URL contains auth_required parameter
function checkUrlForAuthRequirement() {
  const urlParams = new URLSearchParams(window.location.search);
  const authRequired = urlParams.get('auth_required');
  
  if (authRequired) {
    // Clear the parameter from URL without refreshing
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
    
    // Find the matching gallery link and simulate a click
    const matchingLink = document.querySelector(`.private-gallery[data-slug="${authRequired}"]`);
    if (matchingLink) {
      matchingLink.click();
    } else {
      console.error('Could not find matching gallery for:', authRequired);
    }
  }
}

// Setup the password form submission handler
function setupPasswordForm() {
  const passwordForm = document.getElementById('passwordForm');
  
  if (passwordForm) {
    passwordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const errorDiv = document.getElementById('passwordError');
      const submitButton = this.querySelector('button[type="submit"]');
      const passwordField = this.querySelector('input[name="password"]');
      const subgallerySlugField = document.getElementById('subgallerySlug');
      
      if (!subgallerySlugField || !subgallerySlugField.value) {
        console.error('Missing subgallery slug in form');
        if (errorDiv) {
          errorDiv.textContent = 'Missing gallery information. Please try again.';
          errorDiv.style.display = 'block';
        }
        return;
      }
      
      const subgallerySlug = subgallerySlugField.value;
      console.log('Submitting password for subgallery:', subgallerySlug);
      
      // Disable the button and show loading state
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verifying...';
      }
      
      try {
        // Clear any previous error messages
        if (errorDiv) {
          errorDiv.style.display = 'none';
          errorDiv.textContent = '';
        }
        
        // Send the password validation request
        const response = await fetch('/galleries/validate-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            slug: subgallerySlug,
            password: passwordField.value
          })
        });
        
        // Check for non-200 responses
        if (!response.ok) {
          console.error('Server responded with status:', response.status);
          let errorMessage = 'Server error. Please try again.';
          
          // Try to get more specific error message if available
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error('Could not parse error response:', e);
          }
          
          if (errorDiv) {
            errorDiv.textContent = errorMessage;
            errorDiv.style.display = 'block';
          }
          return;
        }
        
        const data = await response.json();
        console.log('Password validation response:', data.success ? 'success' : 'failed');
        
        if (data.success) {
          // Success - redirect to the protected content
          console.log('Redirecting to:', data.redirectUrl);
          window.location.href = data.redirectUrl;
        } else {
          // Show error message
          if (errorDiv) {
            errorDiv.textContent = data.message || 'Invalid password. Please try again.';
            errorDiv.style.display = 'block';
          }
          
          // Shake the password field to indicate error
          if (passwordField) {
            passwordField.classList.add('is-invalid');
            setTimeout(() => passwordField.classList.remove('is-invalid'), 500);
          }
        }
      } catch (error) {
        console.error('Error validating password:', error);
        if (errorDiv) {
          errorDiv.textContent = 'Connection error. Please try again.';
          errorDiv.style.display = 'block';
        }
      } finally {
        // Re-enable the button
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = 'Submit';
        }
      }
    });
  } else {
    console.error('Password form not found in the DOM');
    // Dynamically create the form if needed
    ensureModalExists();
  }
}

// Function to create a modal if it doesn't exist
function ensureModalExists() {
  if (!document.getElementById('passwordModal')) {
    const modalHTML = `
      <div class="modal fade" id="passwordModal" tabindex="-1" aria-labelledby="passwordModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content rounded-0">
            <div class="modal-body p-4 px-5">
              <div class="main-content text-center">
                <button type="button" class="close-btn" data-bs-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true"><span class="icon-close2"></span></span>
                </button>

                <div class="warp-icon mb-4">
                  <span class="icon-lock2"></span>
                </div>

                <form id="passwordForm">
                  <input type="hidden" id="subgallerySlug" name="slug">
                  <label>This link is password protected</label>
                  <p class="mb-4">You Can <svg style="color: rgb(68, 155, 68);" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-whatsapp" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                  </svg><a href="https://wa.me/01011111111" target="_blank" style="color: rgb(68, 155, 68);"><b> Contact via WhatsApp</b></a> or <a href="/Contact" style="color: rgb(68, 155, 68);"><b>Contact Page</b></a> to Get Access From Dr. Khaled</p>

                  <div class="form-group mb-4">
                    <input type="password" name="password" class="form-control text-center" placeholder="Enter password" required>
                  </div>

                  <div id="passwordError" class="alert alert-danger mt-3" style="display: none;"></div>

                  <div class="d-flex">
                    <div class="mx-auto">
                      <button type="submit" class="btn btn-primary">Submit</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Set up event listeners for the new modal
    setupPasswordForm();
  }
}
