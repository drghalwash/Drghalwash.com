document.addEventListener('DOMContentLoaded', function() {
  console.log('Gallery password script initialized');

  // Create modal if it doesn't exist
  ensureModalExists();

  // Set up click handlers for private galleries
  setupPrivateGalleryLinks();
});

// Create password modal in DOM if it doesn't exist
function ensureModalExists() {
  if (!document.getElementById('passwordModal')) {
    const modalHTML = `
      <div class="modal fade" id="passwordModal" tabindex="-1" aria-labelledby="passwordModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="passwordModalLabel">Password Protected Content</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="passwordForm">
                <div class="mb-3">
                  <label for="password" class="form-label">This content is password protected. Please enter the password:</label>
                  <input type="password" class="form-control" id="password" name="password" required autocomplete="off">
                  <input type="hidden" id="subgallerySlug" name="slug">
                  <div id="passwordFeedback" class="invalid-feedback mt-2"></div>
                </div>
                <div class="d-grid">
                  <button type="submit" class="btn btn-primary">Submit</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Set up the form submit handler
    const form = document.getElementById('passwordForm');
    form.addEventListener('submit', handlePasswordSubmit);
  }
}

// Set up click handlers for private gallery links
function setupPrivateGalleryLinks() {
  // Find all elements with data-slug attribute (private galleries)
  document.querySelectorAll('[data-slug]').forEach(link => {
    const slug = link.getAttribute('data-slug');
    if (slug) {
      // Remove existing event listeners
      const newLink = link.cloneNode(true);
      link.parentNode.replaceChild(newLink, link);

      // Add click handler
      newLink.addEventListener('click', function(e) {
        e.preventDefault();
        showPasswordModal(slug);
        return false;
      });
    }
  });
}

// Show the password modal for a specific subgallery
function showPasswordModal(slug) {
  console.log('Opening password modal for:', slug);

  // Set the slug in the hidden input
  document.getElementById('subgallerySlug').value = slug;

  // Clear previous password and errors
  const passwordInput = document.getElementById('password');
  passwordInput.value = '';
  passwordInput.classList.remove('is-invalid');

  // Show the modal using Bootstrap
  const modal = document.getElementById('passwordModal');
  if (typeof bootstrap !== 'undefined') {
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  } else {
    // Fallback for if Bootstrap JS isn't available
    modal.style.display = 'block';
    modal.classList.add('show');
    document.body.classList.add('modal-open');

    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';
    document.body.appendChild(backdrop);
  }

  // Focus the password input
  setTimeout(() => passwordInput.focus(), 300);
}

// Handle password form submission
async function handlePasswordSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const submitButton = form.querySelector('button[type="submit"]');
  const passwordInput = document.getElementById('password');
  const feedback = document.getElementById('passwordFeedback');
  const slug = document.getElementById('subgallerySlug').value;
  const password = passwordInput.value.trim();

  // Disable form during submission
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verifying...';

  try {
    // Send password validation request
    const response = await fetch('/galleries/validate-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ slug, password })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Success - redirect to protected content
      window.location.href = result.redirectUrl;
    } else {
      // Show error message
      passwordInput.classList.add('is-invalid');
      feedback.textContent = result.message || 'Invalid password';
    }
  } catch (error) {
    console.error('Password validation error:', error);
    passwordInput.classList.add('is-invalid');
    feedback.textContent = 'An error occurred. Please try again.';
  } finally {
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = 'Submit';
  }
}