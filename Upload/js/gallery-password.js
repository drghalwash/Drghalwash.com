
document.addEventListener('DOMContentLoaded', function() {
  console.log('Gallery password script loaded');
  ensureModalExists();
});

function ensureModalExists() {
  // Check if modal already exists
  if (document.getElementById('passwordModal')) {
    console.log('Password modal already exists');
    setupForm();
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
                  <label for="passwordInput" class="form-label">This content is password protected. Please enter the password to view:</label>
                  <input type="password" class="form-control" id="passwordInput" name="password" required>
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
  
  // Set up the form after ensuring the modal exists
  setTimeout(setupForm, 100);
  
  // Find all private gallery links
  setupPrivateGalleryLinks();
}

function setupForm() {
  const passwordForm = document.getElementById('passwordForm');
  if (!passwordForm) {
    console.error('Password form not found in DOM');
    return;
  }
  
  // Remove any existing event listeners
  const newForm = passwordForm.cloneNode(true);
  if (passwordForm.parentNode) {
    passwordForm.parentNode.replaceChild(newForm, passwordForm);
  }
  
  // Add submit event listener
  newForm.addEventListener('submit', function(e) {
    e.preventDefault();
    handleFormSubmit();
    return false;
  });
  
  console.log('Password form handler initialized');
}

function showPasswordModal(slug) {
  console.log('Showing password modal for slug:', slug);
  
  // Ensure modal exists before proceeding
  ensureModalExists();
  
  // Get the slug field
  const slugField = document.getElementById('subgallerySlug');
  if (!slugField) {
    console.error('Slug field not found in form');
    return;
  }
  
  // Set the subgallery slug in the hidden field
  slugField.value = slug;
  console.log('Set subgallery slug in form:', slug);
  
  // Clear any previous error messages
  const errorElement = document.getElementById('passwordError');
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
  
  // Clear the password field
  const passwordField = document.getElementById('passwordInput');
  if (passwordField) {
    passwordField.value = '';
  }
  
  // Show the modal using Bootstrap
  const modal = document.getElementById('passwordModal');
  if (!modal) {
    console.error('Password modal not found in DOM');
    return;
  }
  
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
    }
  } catch (error) {
    console.error('Error showing modal:', error);
  }
}

function displayError(message) {
  console.error('Error:', message);
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
async function handleFormSubmit() {
  console.log('Password form submitted');
  
  // Get slug and password from form
  const slugField = document.getElementById('subgallerySlug');
  const passwordField = document.getElementById('passwordInput');
  
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
    
    // Send the password validation request
    const response = await fetch('/galleries/validate-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });
    
    // Parse the response
    const result = await response.json();
    
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
    
    if (result.success) {
      console.log('Password validation successful, redirecting...');
      window.location.href = result.redirectUrl;
    } else {
      console.error('Password validation failed:', result.message);
      displayError(result.message || 'Invalid password');
    }
  } catch (error) {
    console.error('Error during password validation:', error);
    displayError('An error occurred while validating the password. Please try again.');
    
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  }
}

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
      if (link.parentNode) {
        link.parentNode.replaceChild(newLink, link);
      }
      
      newLink.addEventListener('click', function(e) {
        e.preventDefault();
        
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
// Gallery password handling script
document.addEventListener('DOMContentLoaded', function() {
  const passwordForm = document.getElementById('passwordForm');
  
  if (passwordForm) {
    passwordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const password = document.getElementById('galleryPassword').value;
      const slug = document.getElementById('gallerySlug').value;
      
      try {
        const response = await fetch('/galleries/validate-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password, slug })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Store token in localStorage instead of using cookies
          if (data.token) {
            localStorage.setItem('gallery_auth_token', data.token);
          }
          
          // Redirect to the protected gallery
          window.location.href = data.redirectUrl;
        } else {
          // Show error message
          const errorElement = document.getElementById('passwordError');
          if (errorElement) {
            errorElement.textContent = data.message || 'Invalid password';
            errorElement.style.display = 'block';
          }
        }
      } catch (error) {
        console.error('Error validating password:', error);
      }
    });
  }
});
