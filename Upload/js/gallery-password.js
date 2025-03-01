
// Gallery Password Protection System

document.addEventListener('DOMContentLoaded', function() {
  console.log('Gallery password system initializing...');
  
  // Create the password modal first thing
  createPasswordModal();
  
  // Set up event listeners on all protected gallery links
  setupPrivateGalleryLinks();
});

// Create the password modal in the DOM
function createPasswordModal() {
  // Check if modal already exists
  if (document.getElementById('passwordModal')) {
    console.log('Password modal already exists in DOM');
    return;
  }
  
  console.log('Creating password modal in DOM');
  
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
            <div id="passwordFormContainer">
              <form id="passwordForm" method="post">
                <div class="mb-3">
                  <label for="passwordInput" class="form-label">This content is password protected. Please enter the password to view:</label>
                  <input type="password" class="form-control" id="passwordInput" name="password" required>
                  <input type="hidden" id="subgallerySlug" name="slug">
                  <div id="passwordError" class="alert alert-danger mt-2" style="display: none;"></div>
                </div>
                <button type="submit" class="btn btn-primary" id="passwordSubmitBtn">Submit</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to document
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Set up form submission handler
  const form = document.getElementById('passwordForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      handlePasswordSubmit(e);
    });
    console.log('Password form handler initialized');
  } else {
    console.error('Could not find password form after creation');
  }
}

// Set up click handlers for private gallery links
function setupPrivateGalleryLinks() {
  // Find all links with data attributes
  const privateLinks = document.querySelectorAll('[data-slug]');
  
  if (privateLinks.length === 0) {
    console.log('No protected gallery links found on page');
    return;
  }
  
  console.log(`Found ${privateLinks.length} protected gallery links`);
  
  // Add click handlers to each link
  privateLinks.forEach(link => {
    // Remove any existing event listeners by cloning the node
    const newLink = link.cloneNode(true);
    link.parentNode.replaceChild(newLink, link);
    
    // Add the new event listener
    newLink.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get the slug from the link
      const slug = this.getAttribute('data-slug');
      if (!slug) {
        console.error('Link has no data-slug attribute');
        return;
      }
      
      console.log(`Protected gallery link clicked with slug: ${slug}`);
      showPasswordModal(slug);
    });
  });
}

// Show the password modal with the correct slug
function showPasswordModal(slug) {
  // Make sure the modal exists
  if (!document.getElementById('passwordModal')) {
    console.error('Password modal not found in DOM');
    createPasswordModal();
  }
  
  console.log(`Opening password modal for slug: ${slug}`);
  
  // Set the slug in the hidden form field
  const slugField = document.getElementById('subgallerySlug');
  if (slugField) {
    slugField.value = slug;
    console.log(`Set slug field value to: ${slug}`);
  } else {
    console.error('Could not find slug field in password form');
  }
  
  // Clear any previous errors
  const errorElement = document.getElementById('passwordError');
  if (errorElement) {
    errorElement.style.display = 'none';
    errorElement.textContent = '';
  }
  
  // Clear the password field
  const passwordField = document.getElementById('passwordInput');
  if (passwordField) {
    passwordField.value = '';
  }
  
  // Show the modal using Bootstrap
  try {
    const modal = new bootstrap.Modal(document.getElementById('passwordModal'));
    modal.show();
  } catch (error) {
    console.error('Error showing modal:', error);
    alert('Error showing password form. Please refresh the page and try again.');
  }
}

// Handle password form submission
async function handlePasswordSubmit(event) {
  event.preventDefault();
  
  // Get the form elements
  const slugField = document.getElementById('subgallerySlug');
  const passwordField = document.getElementById('passwordInput');
  const submitButton = document.getElementById('passwordSubmitBtn');
  
  // Validate form fields
  if (!slugField || !passwordField) {
    displayError('Form fields not found');
    console.error('Form fields not found:', {
      slugField: Boolean(slugField),
      passwordField: Boolean(passwordField)
    });
    return;
  }
  
  const slug = slugField.value.trim();
  const password = passwordField.value.trim();
  
  // Basic validation
  if (!slug) {
    displayError('Missing gallery identifier');
    console.error('Slug field is empty');
    return;
  }
  
  if (!password) {
    displayError('Please enter a password');
    return;
  }
  
  // Disable submit button during API call
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = 'Verifying...';
  
  try {
    console.log(`Validating password for subgallery: ${slug}`);
    
    // Create form data for submission
    const formData = new URLSearchParams();
    formData.append('slug', slug);
    formData.append('password', password);
    
    // Make API request
    const response = await fetch('/galleries/validate-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });
    
    // Process response
    if (!response.ok) {
      throw new Error(`Server returned ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Password validated successfully');
      
      // Close the modal if still open
      try {
        const modalElement = document.getElementById('passwordModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
      } catch (e) {
        console.warn('Error closing modal:', e);
      }
      
      // Redirect to the protected content
      if (result.redirectUrl) {
        console.log(`Redirecting to: ${result.redirectUrl}`);
        window.location.href = result.redirectUrl;
      } else {
        console.error('No redirect URL provided in successful response');
        displayError('Error accessing protected content. Please try again.');
      }
    } else {
      // Display error message from server
      displayError(result.message || 'Invalid password');
      console.warn('Password validation failed:', result.message);
    }
  } catch (error) {
    console.error('Error during password validation:', error);
    displayError('An error occurred. Please try again.');
  } finally {
    // Re-enable submit button
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  }
}

// Display error message in the form
function displayError(message) {
  const errorElement = document.getElementById('passwordError');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  } else {
    console.error('Error element not found in form');
    alert(`Error: ${message}`);
  }
}
