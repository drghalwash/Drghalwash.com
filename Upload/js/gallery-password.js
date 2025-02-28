// Gallery password handling system
document.addEventListener('DOMContentLoaded', function() {
  console.log('Gallery password script loaded');

  // Ensure the modal exists in the DOM
  ensureModalExists();

  // Set up handlers for private gallery links
  setupPrivateGalleryLinks();

  // Initialize the password form submission handler
  initializePasswordForm();
});

// Create the modal in the DOM if it doesn't exist
function ensureModalExists() {
  if (!document.getElementById('passwordModal')) {
    console.log('Creating password modal in DOM');
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
                  <input type="password" class="form-control" id="passwordInput" name="password" required>
                  <input type="hidden" id="subgallerySlug" name="slug">
                  <div id="passwordError" class="alert alert-danger mt-2" style="display: none;"></div>
                </div>
                <button type="submit" class="btn btn-primary w-100">Submit</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
  }
}

// Find and set up click handlers for private gallery links
function setupPrivateGalleryLinks() {
  // Find all links with the 'data-private' attribute
  const privateLinks = document.querySelectorAll('a[data-private="true"]');
  console.log(`Found ${privateLinks.length} gallery links`);

  privateLinks.forEach(link => {
    const slug = link.getAttribute('data-slug');

    if (slug) {
      console.log(`Found private gallery link:`, slug);

      // Add click handler to show password modal
      link.addEventListener('click', function(e) {
        e.preventDefault();

        // Set the slug in the form
        const slugField = document.getElementById('subgallerySlug');
        if (slugField) {
          slugField.value = slug;
          console.log(`Set subgallery slug in form:`, slug);
        } else {
          console.error('Slug field not found in modal form');
        }

        // Show the modal
        const modal = document.getElementById('passwordModal');
        if (modal) {
          try {
            // Try Bootstrap modal
            if (typeof bootstrap !== 'undefined') {
              const modalInstance = new bootstrap.Modal(modal);
              modalInstance.show();
            } else {
              // Fallback if Bootstrap is not available
              modal.style.display = 'block';
              modal.classList.add('show');
            }

            // Focus the password input
            setTimeout(() => {
              const passwordInput = document.getElementById('passwordInput');
              if (passwordInput) passwordInput.focus();
            }, 300);
          } catch (err) {
            console.error('Error showing modal:', err);
            // Basic fallback
            modal.style.display = 'block';
          }
        } else {
          console.error('Password modal not found in DOM');
        }
      });
    }
  });
}

// Initialize password form submission
function initializePasswordForm() {
  const form = document.getElementById('passwordForm');

  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      console.log('Password form submitted');

      // Get the slug and password values
      const slugField = document.getElementById('subgallerySlug');
      const passwordField = document.getElementById('passwordInput');

      if (!slugField) {
        console.error('Slug field not found in form');
        displayError('Form configuration error');
        return;
      }

      if (!passwordField) {
        console.error('Password field not found in form');
        displayError('Form configuration error');
        return;
      }

      const slug = slugField.value.trim();
      const password = passwordField.value.trim();

      console.log(`Using subgallery slug:`, slug);
      console.log(`Submitted password (trimmed):`, password);

      if (!slug) {
        displayError('Missing subgallery identifier');
        return;
      }

      if (!password) {
        displayError('Please enter a password');
        return;
      }

      // Update UI to show processing state
      const submitButton = form.querySelector('button[type="submit"]');
      const originalButtonText = submitButton ? submitButton.innerHTML : 'Submit';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verifying...';
      }

      try {
        // Prepare request data
        const requestData = {
          slug: slug,
          password: password
        };

        console.log(`Sending request with data:`, JSON.stringify(requestData));

        // Send the validation request
        const response = await fetch('/galleries/validate-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });

        console.log(`API response status:`, response.status);

        const result = await response.json();

        if (response.ok && result.success) {
          console.log('Password validation successful, redirecting to:', result.redirectUrl);

          // Clear the password field for security
          passwordField.value = '';

          // Redirect to the authenticated URL
          window.location.href = result.redirectUrl;
        } else {
          // Handle error response
          console.log('Server error details:', response.status, JSON.stringify(result));
          displayError(result.message || 'Invalid password. Please try again.');

          // Reset button state
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
          }
        }
      } catch (error) {
        console.error('Error during password validation:', error);
        displayError('An error occurred while verifying your password. Please try again.');

        // Reset button state
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonText;
        }
      }
    });
  } else {
    console.error('Password form not found in DOM');
  }
}

// Display error message in the form
function displayError(message) {
  const errorElement = document.getElementById('passwordError');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    // Automatically hide after 5 seconds
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  } else {
    console.error('Error element not found, cannot display:', message);
  }
}