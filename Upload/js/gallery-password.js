document.addEventListener('DOMContentLoaded', function() {
  setupPrivateGalleryLinks();
  setupPasswordForm();
});

function setupPrivateGalleryLinks() {
  // Find all elements with data-slug attribute (private galleries)
  document.querySelectorAll('[data-slug]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const slug = this.getAttribute('data-slug');
      console.log('Private gallery clicked:', slug);
      showPasswordModal(slug);
    });
  });
}

function setupPasswordForm() {
  const form = document.getElementById('passwordForm');
  if (form) {
    form.addEventListener('submit', handlePasswordSubmit);
  }
}

function showPasswordModal(slug) {
  console.log('Opening password modal for:', slug);
  const modal = document.getElementById('passwordModal');

  // Clear previous errors
  const errorElement = document.getElementById('passwordError');
  if (errorElement) {
    errorElement.style.display = 'none';
  }

  // Reset form
  const form = document.getElementById('passwordForm');
  if (form) {
    form.reset();
  }

  // Set hidden input value
  const slugInput = document.getElementById('subgallerySlug');
  if (slugInput) {
    slugInput.value = slug;
  }

  // Show modal using Bootstrap
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function handlePasswordSubmit(e) {
  e.preventDefault();

  const password = document.querySelector('input[name="password"]').value;
  const slug = document.getElementById('subgallerySlug').value;
  const errorElement = document.getElementById('passwordError');

  if (!password || !slug) {
    errorElement.textContent = 'Password is required';
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

    if (response.ok && result.success) {
      // Success - redirect to protected content
      window.location.href = result.redirectUrl;
    } else {
      // Show error message
      errorElement.textContent = result.message || 'Invalid password';
      errorElement.style.display = 'block';
    }
  } catch (error) {
    console.error('Password validation error:', error);
    errorElement.textContent = 'An error occurred. Please try again.';
    errorElement.style.display = 'block';
  }
}

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