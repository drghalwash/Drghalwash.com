document.addEventListener('DOMContentLoaded', function() {
  console.log('Gallery password script initialized');

  // Find all private gallery links and attach click handlers
  const privateGalleryLinks = document.querySelectorAll('.private-gallery[data-slug]');

  privateGalleryLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const slug = this.getAttribute('data-slug');
      console.log('Opening password modal for:', slug);

      // Set the subgallery slug in the form
      const slugInput = document.getElementById('subgallerySlug');
      if (slugInput) {
        slugInput.value = slug;
      }

      // Clear any previous errors
      const errorElement = document.getElementById('passwordError');
      if (errorElement) {
        errorElement.style.display = 'none';
      }

      // Reset password field
      const passwordField = document.querySelector('#passwordForm input[name="password"]');
      if (passwordField) {
        passwordField.value = '';
      }

      // Show the modal using Bootstrap
      const passwordModal = document.getElementById('passwordModal');
      if (passwordModal) {
        const bsModal = new bootstrap.Modal(passwordModal);
        bsModal.show();
      }
    });
  });

  // Set up the password form submission
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Get form values
      const slug = document.getElementById('subgallerySlug').value;
      const password = passwordForm.querySelector('input[name="password"]').value;
      const errorElement = document.getElementById('passwordError');

      // Validate inputs
      if (!slug || !password) {
        errorElement.textContent = 'Both slug and password are required';
        errorElement.style.display = 'block';
        return;
      }

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

        if (result.success) {
          // Success - redirect to the protected page
          window.location.href = result.redirectUrl;
        } else {
          // Show error message
          errorElement.textContent = result.message || 'Invalid password';
          errorElement.style.display = 'block';
        }
      } catch (error) {
        console.error('Error validating password:', error);
        errorElement.textContent = 'An error occurred. Please try again.';
        errorElement.style.display = 'block';
      }
    });
  }
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
                  <div id="passwordError" class="invalid-feedback mt-2"></div>
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
  }
}