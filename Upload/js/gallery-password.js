document.addEventListener('DOMContentLoaded', function() {
  console.log('Gallery password script loaded');

  // Ensure modal exists in DOM
  ensureModalExists();

  // Find all private gallery links
  setupPrivateGalleryLinks();

  // Initialize password form handler
  //initializeFormHandler(); //This is now called from ensureModalExists
});

// Make sure the password modal exists
function ensureModalExists() {
  // Check if modal already exists
  if (document.getElementById('passwordModal')) {
    console.log('Password modal already exists');
    return;
  }

  console.log('Creating password modal');

  // Create modal structure using Bootstrap
  const modalHTML = `
    <div class="modal fade" id="passwordModal" tabindex="-1" aria-labelledby="passwordModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="passwordModalLabel">Password Required</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div id="passwordFormContainer">
              <form id="passwordForm">
                <div class="mb-3">
                  <label for="password" class="form-label">This content is password protected. Please enter the password to view:</label>
                  <input type="password" class="form-control" id="password" name="password" required>
                  <input type="hidden" id="subgallerySlug" name="slug">
                  <div id="passwordError" class="alert alert-danger mt-2" style="display: none;"></div>
                </div>
                <button type="submit" class="btn btn-primary">Submit</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add modal to document
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  console.log('Password modal created');

  // Initialize form handler after creating the modal
  setTimeout(() => {
    initializeFormHandler();
  }, 100);
}

// Set up click handlers on all private gallery links
function setupPrivateGalleryLinks() {
  // Look for links with data-slug attribute
  const galleryLinks = document.querySelectorAll('[data-slug]');
  console.log(`Found ${galleryLinks.length} gallery links with data-slug attribute`);

  galleryLinks.forEach(function(link) {
    const slug = link.getAttribute('data-slug');
    if (slug) {
      console.log('Found private gallery link with slug:', slug);

      // Remove any existing event listeners first
      const newLink = link.cloneNode(true);
      link.parentNode.replaceChild(newLink, link);

      newLink.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const clickedSlug = this.getAttribute('data-slug');
        console.log('Private gallery link clicked, slug:', clickedSlug);

        if (clickedSlug) {
          showPasswordModal(clickedSlug);
        } else {
          console.error('Slug not found on clicked link');
        }

        return false; // Prevent default and stop propagation
      });
    }
  });
}

// Initialize form submission handler
function initializeFormHandler() {
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    // Remove any existing event listeners first
    const newForm = passwordForm.cloneNode(true);
    passwordForm.parentNode.replaceChild(newForm, passwordForm);

    newForm.addEventListener('submit', function(e) {
      e.preventDefault();
      e.stopPropagation();
      handleFormSubmit(e);
      return false;
    });

    console.log('Password form handler initialized');
  } else {
    console.warn('Password form not found, will retry');
    setTimeout(initializeFormHandler, 500);
  }
}

// Function to show the password modal
function showPasswordModal(slug) {
  console.log('Showing password modal for slug:', slug);

  // Ensure modal exists before proceeding
  ensureModalExists();

  // Get modal element
  const modal = document.getElementById('passwordModal');
  if (!modal) {
    console.error('Password modal not found in DOM');
    alert('Unable to show password form. Please refresh the page and try again.');
    return;
  }

  // Set the subgallery slug in the hidden field
  const slugField = document.getElementById('subgallerySlug');
  if (slugField) {
    slugField.value = slug;
    console.log('Set subgallery slug in form:', slug);
  } else {
    console.error('Slug field not found in form');
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

  // Show the modal using Bootstrap if available, or fallback
  try {
    if (typeof bootstrap !== 'undefined') {
      console.log('Using Bootstrap to show modal');
      const bootstrapModal = new bootstrap.Modal(modal);
      bootstrapModal.show();
    } else {
      console.log('Bootstrap not available, using fallback');
      modal.classList.add('show');
      modal.style.display = 'block';
      document.body.classList.add('modal-open');

      // Add backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  } catch (error) {
    console.error('Error showing modal:', error);

    // Last resort fallback
    modal.style.display = 'block';
    modal.classList.add('show');
  }
}

// Display error message in the form
function displayError(message) {
  const errorElement = document.getElementById('passwordError');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  } else {
    console.error('Error element not found, message:', message);
    alert('Error: ' + message);
  }
}

// Handle form submission
async function handleFormSubmit(e) {
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
  const submitButton = document.querySelector('#passwordForm button[type="submit"]');
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
      return; // Exit early to prevent further execution
    } else {
      // Handle error response
      console.log('Server error details:', response.status, JSON.stringify(result));
      displayError(result.message || 'Invalid password. Please try again.');
    }
  } catch (error) {
    console.error('Error during password validation:', error);
    displayError('An error occurred. Please try again.');
  } finally {
    // Always re-enable submit button
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  }
}