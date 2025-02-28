
document.addEventListener('DOMContentLoaded', function() {
  console.log("Gallery password script loaded");
  
  // Setup all private gallery links
  setupPrivateGalleryLinks();
  
  // Setup password form submission
  setupPasswordForm();
});

function setupPrivateGalleryLinks() {
  // Find all private gallery links
  const privateLinks = document.querySelectorAll('.private-gallery-link');
  console.log(`Found ${privateLinks.length} private gallery links`);
  
  privateLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get the subgalleryId directly from the clicked link
      const subgalleryId = this.getAttribute('data-id');
      console.log(`Link clicked with subgalleryId: ${subgalleryId}`);
      
      if (!subgalleryId) {
        console.error('No subgalleryId found on clicked link');
        alert('Error: Cannot identify the gallery. Please try again or contact support.');
        return;
      }
      
      // Show the password modal
      const modal = document.getElementById('passwordModal');
      if (!modal) {
        console.error('Password modal not found');
        return;
      }
      
      // Store the subgalleryId in multiple places for redundancy
      modal.setAttribute('data-subgallery-id', subgalleryId);
      
      // Set the subgallery ID in the hidden field
      const idField = document.getElementById('imageId');
      if (idField) {
        idField.value = subgalleryId;
        console.log(`Set subgalleryId in imageId field: ${subgalleryId}`);
      } else {
        // Create the field if it doesn't exist
        createHiddenField('imageId', subgalleryId, modal);
      }
      
      // Also set it in a field named subgalleryId for extra redundancy
      const subgalleryIdField = document.getElementById('subgalleryId');
      if (subgalleryIdField) {
        subgalleryIdField.value = subgalleryId;
      } else {
        createHiddenField('subgalleryId', subgalleryId, modal);
      }
      
      // Clear previous error messages
      const errorElement = document.getElementById('passwordError');
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      }
      
      // Clear the password field
      const passwordField = document.querySelector('#passwordModal input[name="password"]');
      if (passwordField) {
        passwordField.value = '';
      }
      
      // Show the modal
      const passwordModal = new bootstrap.Modal(modal);
      passwordModal.show();
    });
  });
}

function createHiddenField(id, value, container) {
  const form = container.querySelector('form') || document.getElementById('passwordForm');
  if (!form) {
    console.error('Form not found, cannot create hidden field');
    return;
  }
  
  const hiddenField = document.createElement('input');
  hiddenField.type = 'hidden';
  hiddenField.id = id;
  hiddenField.name = id;
  hiddenField.value = value;
  form.appendChild(hiddenField);
  console.log(`Created hidden field ${id} with value ${value}`);
}

function setupPasswordForm() {
  const passwordForm = document.getElementById('passwordForm');
  if (!passwordForm) {
    console.error('Password form not found');
    return;
  }
  
  passwordForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Password form submitted');
    
    // Get the submit button
    const submitButton = this.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.innerHTML : 'Submit';
    
    // Disable the button to prevent multiple submissions
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = 'Verifying...';
    }
    
    // Get the password input
    const passwordInput = this.querySelector('input[name="password"]');
    if (!passwordInput) {
      displayError('Password field not found');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
      return;
    }
    
    // Get subgalleryId from multiple possible sources
    const subgalleryId = getSubgalleryId();
    
    // Log the final subgalleryId for debugging
    console.log(`Final subgalleryId to be used: ${subgalleryId}`);
    
    // Validate subgalleryId
    if (!subgalleryId) {
      displayError('Missing required parameter: subgalleryId');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
      return;
    }
    
    // Get password and validate
    const password = passwordInput.value.trim();
    console.log(`Password entered (length: ${password.length})`);
    
    if (!password) {
      displayError('Please enter a password');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
      return;
    }
    
    try {
      // Prepare request data with all possible ID field names
      const requestData = {
        subgalleryId: subgalleryId,
        imageId: subgalleryId,
        id: subgalleryId,
        password: password,
        timestamp: new Date().getTime() // Cache busting
      };
      
      console.log('Sending request with data:', JSON.stringify(requestData));
      
      // Send the validation request
      const response = await fetch('/galleries/validate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      // Reset button state
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
      
      console.log(`API response status: ${response.status}`);
      
      // Handle the response
      if (response.ok) {
        const data = await response.json();
        console.log('Password validation successful:', data);
        
        // Redirect to the gallery if a redirect URL was provided
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          // Refresh the page as fallback
          window.location.reload();
        }
      } else {
        // Handle error response
        const responseText = await response.text();
        console.error('Server error:', response.status, responseText);
        
        try {
          const errorData = JSON.parse(responseText);
          displayError(errorData.message || 'Invalid password');
        } catch (e) {
          // If the response isn't valid JSON, just display the status
          displayError(`Error: ${response.status} - Invalid password or server error`);
        }
      }
    } catch (error) {
      console.error('Error in password validation:', error);
      displayError('Network error. Please try again.');
      
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    }
  });
}

function getSubgalleryId() {
  // Try multiple sources with detailed logging
  
  // 1. Try from form fields (both possible field names)
  const imageIdField = document.getElementById('imageId');
  const subgalleryIdField = document.getElementById('subgalleryId');
  
  if (imageIdField && imageIdField.value) {
    console.log(`Found subgalleryId in imageId field: ${imageIdField.value}`);
    return imageIdField.value;
  }
  
  if (subgalleryIdField && subgalleryIdField.value) {
    console.log(`Found subgalleryId in subgalleryId field: ${subgalleryIdField.value}`);
    return subgalleryIdField.value;
  }
  
  // 2. Try from modal data attribute
  const passwordModal = document.getElementById('passwordModal');
  if (passwordModal && passwordModal.dataset && passwordModal.dataset.subgalleryId) {
    console.log(`Found subgalleryId in modal data attribute: ${passwordModal.dataset.subgalleryId}`);
    return passwordModal.dataset.subgalleryId;
  }
  
  // 3. Try from URL path
  const pathSegments = window.location.pathname.split('/');
  if (pathSegments.length >= 4 && pathSegments[1] === 'galleries') {
    console.log(`Found subgalleryId in URL path: ${pathSegments[3]}`);
    return pathSegments[3];
  }
  
  // 4. Try from any active gallery link with data-id
  const activeLink = document.querySelector('.private-gallery-link.active[data-id]');
  if (activeLink) {
    console.log(`Found subgalleryId from active link: ${activeLink.getAttribute('data-id')}`);
    return activeLink.getAttribute('data-id');
  }
  
  // 5. Try from any gallery link with data-id (last clicked)
  const anyLink = document.querySelector('.private-gallery-link[data-id]');
  if (anyLink) {
    console.log(`Found subgalleryId from any link: ${anyLink.getAttribute('data-id')}`);
    return anyLink.getAttribute('data-id');
  }
  
  console.error('Could not find subgalleryId from any source');
  return null;
}

function displayError(message) {
  console.error(`Error: ${message}`);
  
  const errorElement = document.getElementById('passwordError');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  } else {
    // Fallback to alert if error element doesn't exist
    alert(`Error: ${message}`);
  }
}
