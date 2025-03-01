document.addEventListener('DOMContentLoaded', function() {
  console.log('Gallery password script loaded');

  // Ensure modal exists in DOM
  createPasswordModal();

  // Set up click handlers for private gallery links
  setupPrivateGalleryLinks();
});

// Create the password modal in DOM
function createPasswordModal() {
  // Remove any existing modal to prevent duplicates
  const existingModal = document.getElementById('passwordModal');
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal HTML
  const modalHTML = `
    <div class="modal fade" id="passwordModal" tabindex="-1" aria-labelledby="passwordModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="passwordModalLabel">Password Required</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="passwordForm" method="POST" action="/galleries/validate-password">
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
  `;

  // Add to DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Set up event listener for the form
  const form = document.getElementById('passwordForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      validatePassword(e);
    });
  }
}

// Set up click handlers for private gallery links
function setupPrivateGalleryLinks() {
  // Target all links with data-slug attribute
  const links = document.querySelectorAll('[data-slug]');

  links.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();

      const slug = this.getAttribute('data-slug');
      if (slug) {
        showPasswordModal(slug);
      }
    });
  });
}

// Show the password modal with the correct slug
function showPasswordModal(slug) {
  // Set the slug in the hidden field
  const slugField = document.getElementById('subgallerySlug');
  if (slugField) {
    slugField.value = slug;
    console.log('Set slug in form:', slug);
  }

  // Clear previous error and password
  const errorEl = document.getElementById('passwordError');
  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }

  const passwordField = document.getElementById('password');
  if (passwordField) {
    passwordField.value = '';
  }

  // Show the modal
  const modal = document.getElementById('passwordModal');
  if (modal && typeof bootstrap !== 'undefined') {
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
  } else if (modal) {
    // Fallback for when Bootstrap isn't available
    modal.style.display = 'block';
    modal.classList.add('show');
  }
}

// Handle the password validation
async function validatePassword(e) {
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn ? submitBtn.textContent : 'Submit';

  // Get form data
  const slugField = document.getElementById('subgallerySlug');
  const passwordField = document.getElementById('password');

  if (!slugField || !passwordField) {
    showError('Form configuration error');
    return;
  }

  const slug = slugField.value.trim();
  const password = passwordField.value.trim();

  if (!slug || !password) {
    showError('Please enter a password');
    return;
  }

  // Disable submit button and show loading state
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';
  }

  try {
    // Create form data
    const formData = new FormData();
    formData.append('slug', slug);
    formData.append('password', password);

    // Send API request
    const response = await fetch('/galleries/validate-password', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      // On success, redirect to the URL provided by the server
      window.location.href = result.redirectUrl;
    } else {
      // On failure, show the error message
      showError(result.message || 'Invalid password');
    }
  } catch (error) {
    console.error('Error validating password:', error);
    showError('An error occurred while validating the password');
  } finally {
    // Reset button state
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  }
}

// Helper function to show error messages
function showError(message) {
  const errorEl = document.getElementById('passwordError');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  } else {
    alert(message);
  }
}