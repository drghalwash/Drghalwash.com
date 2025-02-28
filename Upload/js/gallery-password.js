
document.addEventListener('DOMContentLoaded', function() {
  console.log("Gallery password script loaded");
  
  // Make sure the password modal element exists
  const passwordModal = document.getElementById('passwordModal');
  if (!passwordModal) {
    console.error('Password modal not found');
    return;
  }

  // Function to display error messages
  function displayError(message) {
    const errorElement = document.getElementById('passwordError');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    } else {
      console.error('Error element not found:', message);
    }
  }

  // Add click event listeners to all gallery links with private access
  const privateLinks = document.querySelectorAll('.private-gallery-link');
  if (privateLinks && privateLinks.length > 0) {
    console.log('Found', privateLinks.length, 'private gallery links');
    
    privateLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        const subgalleryId = this.getAttribute('data-id');
        console.log('Link clicked with data-id:', subgalleryId);
        
        if (subgalleryId) {
          // Set the subgallery ID directly on the modal element
          passwordModal.setAttribute('data-subgallery-id', subgalleryId);
          
          // Also set it on any form fields 
          const imageIdField = document.getElementById('imageId');
          if (imageIdField) {
            imageIdField.value = subgalleryId;
            console.log('Set subgallery ID in imageId field:', subgalleryId);
          } else {
            console.log('imageId field not found, creating it');
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.id = 'imageId';
            hiddenField.name = 'imageId';
            hiddenField.value = subgalleryId;
            
            const form = document.getElementById('passwordForm');
            if (form) {
              form.appendChild(hiddenField);
              console.log('Created and appended imageId field with value:', subgalleryId);
            }
          }
          
          // Set ID in a separate field for redundancy
          const subgalleryIdField = document.getElementById('subgalleryId');
          if (subgalleryIdField) {
            subgalleryIdField.value = subgalleryId;
            console.log('Set subgallery ID in subgalleryId field:', subgalleryId);
          } else {
            console.log('subgalleryId field not found, creating it');
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.id = 'subgalleryId';
            hiddenField.name = 'subgalleryId';
            hiddenField.value = subgalleryId;
            
            const form = document.getElementById('passwordForm');
            if (form) {
              form.appendChild(hiddenField);
              console.log('Created and appended subgalleryId field with value:', subgalleryId);
            }
          }

          // Clear any previous error messages
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
          const bsModal = new bootstrap.Modal(passwordModal);
          bsModal.show();
          console.log('Showing password modal for subgallery ID:', subgalleryId);
        } else {
          console.error('Subgallery ID not found on link');
        }
      });
    });
  } else {
    console.log('No private gallery links found');
  }

  // Handle form submission
  const passwordForm = document.getElementById('passwordForm');
  if (!passwordForm) {
    console.error('Password form not found');
    return;
  }

  passwordForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Password form submitted');
    
    // Get submit button to manage loading state
    const submitButton = document.querySelector('#passwordForm button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.innerHTML : 'Submit';
    
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = 'Validating...';
    }
    
    // Get password input
    const passwordInput = document.querySelector('#passwordForm input[name="password"]');
    if (!passwordInput) {
      displayError('Password input not found');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
      return;
    }
    
    // STEP 1: Get subgalleryId from multiple possible sources for redundancy
    let subgalleryId = null;
    
    // Try to get from hidden form field first
    const subgalleryIdField = document.getElementById('subgalleryId');
    if (subgalleryIdField && subgalleryIdField.value) {
      subgalleryId = subgalleryIdField.value.trim();
      console.log('Found subgalleryId in form field:', subgalleryId);
    }
    
    // If not found, try the imageId field
    if (!subgalleryId) {
      const imageIdField = document.getElementById('imageId');
      if (imageIdField && imageIdField.value) {
        subgalleryId = imageIdField.value.trim();
        console.log('Found subgalleryId in imageId field:', subgalleryId);
      }
    }
    
    // If still not found, try the modal data attribute
    if (!subgalleryId && passwordModal.dataset.subgalleryId) {
      subgalleryId = passwordModal.dataset.subgalleryId.trim();
      console.log('Found subgalleryId in modal data attribute:', subgalleryId);
    }
    
    // If still not found, try to get from URL path
    if (!subgalleryId) {
      const pathSegments = window.location.pathname.split('/');
      if (pathSegments.length >= 4 && pathSegments[1] === 'galleries') {
        subgalleryId = pathSegments[3]; // Gets the subgallery slug from URL
        console.log('Retrieved subgalleryId from URL path:', subgalleryId);
      }
    }
    
    // Final check if we have a valid subgalleryId
    if (!subgalleryId) {
      console.error('subgalleryId is missing after all attempts');
      displayError('Missing required information: subgallery ID');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
      return;
    }
    
    console.log('Using subgallery ID:', subgalleryId);
    
    // STEP 2: Get and validate password
    const password = passwordInput.value.trim();
    console.log('Password entered (trimmed):', password);
    
    if (!password) {
      displayError('Please enter a password');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
      return;
    }
    
    // STEP 3: Send validation request
    try {
      // Create the request data
      const requestData = {
        subgalleryId: subgalleryId,  // Primary field name
        imageId: subgalleryId,       // Alternate field name for compatibility
        id: subgalleryId,            // Another alternate field name
        password: password,
        timestamp: new Date().getTime()  // For cache busting
      };
      
      console.log('Sending API request with data:', JSON.stringify(requestData));
      
      // Send request
      const response = await fetch('/galleries/validate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('API response status:', response.status);
      
      // Reset button state
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
      
      // Handle response
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          displayError(errorJson.message || 'Invalid password');
        } catch (e) {
          displayError('Invalid password');
        }
        return;
      }
      
      // Process successful response
      const data = await response.json();
      console.log('API response data:', data);
      
      if (data.success) {
        console.log('Password validation successful, redirecting to:', data.redirectUrl);
        
        // Hide the modal
        const modal = bootstrap.Modal.getInstance(passwordModal);
        if (modal) {
          modal.hide();
        }
        
        // Redirect to the gallery
        window.location.href = data.redirectUrl;
      } else {
        console.error('API returned success false');
        displayError(data.message || 'Invalid password');
      }
    } catch (error) {
      console.error('Error in API request:', error);
      
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
      
      displayError('An error occurred. Please try again.');
    }
  });
});
