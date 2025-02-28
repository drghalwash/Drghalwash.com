document.addEventListener('DOMContentLoaded', function() {
  console.log("Gallery password script loaded");

  // Make sure the password modal element exists
  const passwordModal = document.getElementById('passwordModal');
  if (!passwordModal) {
    console.error('Password modal not found in the DOM. Password protection will not work.');
  }

  // Find all gallery links
  const galleryLinks = document.querySelectorAll('.gallery-link');

  if (galleryLinks.length > 0) {
    console.log(`Found ${galleryLinks.length} gallery links`);

    galleryLinks.forEach(link => {
      // Check if this is a private gallery by looking for status="Private" in the data
      const customDiv = link.querySelector('div[class]');

      if (customDiv && customDiv.classList.contains('custom-div-private')) {
        const subgalleryId = link.getAttribute('data-id');
        console.log('Found private gallery link:', subgalleryId);

        // Add click event listener to private galleries
        link.addEventListener('click', function(e) {
          e.preventDefault();

          const subgalleryId = this.getAttribute('data-id');
          if (subgalleryId) {
            // Show password modal
            const modal = document.getElementById('passwordModal');
            if (modal) {
              // Set the subgallery ID in the hidden field
              const imageIdField = document.getElementById('imageId');
              if (imageIdField) {
                imageIdField.value = subgalleryId;
                console.log('Set subgallery ID in form:', subgalleryId);
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
              const passwordModal = new bootstrap.Modal(modal);
              passwordModal.show();
              console.log('Showing password modal for gallery ID:', galleryId);
            } else {
              console.error('Password modal not found in the DOM');
            }
          } else {
            console.error('Gallery ID not found on link');
          }
        });
      }
    });
  }

  // Handle form submission for password validation
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    // First, guarantee there's a hidden field for subgalleryId
    let subgalleryIdField = document.getElementById('imageId');
    if (!subgalleryIdField) {
      subgalleryIdField = document.createElement('input');
      subgalleryIdField.type = 'hidden';
      subgalleryIdField.id = 'imageId';
      subgalleryIdField.name = 'subgalleryId'; // Use proper name for server
      passwordForm.appendChild(subgalleryIdField);
      console.log('Created missing imageId field');
    }

    // Add this function for showing errors
    function displayError(message) {
      const errorElement = document.getElementById('passwordError');
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
      } else {
        console.error('Error:', message);
        alert(message);
      }
    }

    passwordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      console.log('Password form submitted');

      // HARDCODED DEFAULT - We'll grab the active subgallery ID from the URL if possible
      let subgalleryId = null;

      // Get from URL if possible
      const pathSegments = window.location.pathname.split('/');
      if (pathSegments.length >= 4 && pathSegments[1] === 'galleries') {
        subgalleryId = pathSegments[3]; // Gets the subgallery slug from URL
        console.log('Retrieved subgalleryId from URL path:', subgalleryId);
      }

      // Try to get from any data attribute on the clicked element
      const clickedElement = document.querySelector('.private-gallery-link[data-id]');
      if (clickedElement) {
        subgalleryId = clickedElement.getAttribute('data-id');
        console.log('Found subgalleryId from clicked element:', subgalleryId);
      }

      // Try to get from form field
      if (subgalleryIdField) {
        const fieldValue = subgalleryIdField.value;
        if (fieldValue && fieldValue.trim() !== '') {
          subgalleryId = fieldValue.trim();
          console.log('Found subgalleryId in form field:', subgalleryId);
        }
      }

      // Method 2: Get from modal data attribute if still missing
      if (!subgalleryId) {
        const passwordModal = document.getElementById('passwordModal');
        if (passwordModal && passwordModal.dataset && passwordModal.dataset.subgalleryId) {
          subgalleryId = passwordModal.dataset.subgalleryId;
          console.log('Retrieved subgalleryId from modal data attribute:', subgalleryId);
        }
      }

      // HARDCODED FALLBACK - Use "1" as last resort
      if (!subgalleryId) {
        subgalleryId = "1"; // Fallback value as last resort
        console.log('Using fallback subgalleryId:', subgalleryId);
      }

      // Update the form field
      if (subgalleryIdField) {
        subgalleryIdField.value = subgalleryId;
      }

      console.log('Using subgallery ID:', subgalleryId);

      // Ensure the form field has the value (create it if needed)
      if (!subgalleryIdField) {
        subgalleryIdField = document.createElement('input');
        subgalleryIdField.type = 'hidden';
        subgalleryIdField.id = 'imageId';
        subgalleryIdField.name = 'imageId';
        passwordForm.appendChild(subgalleryIdField);
        subgalleryIdField.value = subgalleryId;
        console.log('Created missing imageId field with value:', subgalleryId);
      }


      const passwordInput = document.querySelector('#passwordModal input[name="password"]');
      if (!passwordInput) {
        displayError('Missing required information: password field');
        return;
      }

      const password = passwordInput.value.trim();
      console.log('Submitted password (trimmed):', password);

      if (!password) {
        displayError('Please enter a password');
        return;
      }

      // Show loading state
      const submitButton = this.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = 'Validating...';

      try {
        // Ensure password is properly trimmed
        const trimmedPassword = password.trim();

        // Double-check we have subgalleryId
        if (!subgalleryId) {
          displayError('Missing required parameter: subgalleryId');
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonText;
          return;
        }

        // Create a simpler request data object
        const requestData = {
          id: subgalleryId, // Use a simpler name
          password: trimmedPassword
        };

        console.log('Sending request with data:', JSON.stringify(requestData));

        console.log('Sending API request with data:', requestData);

        // Use a URLSearchParams object for form data instead of JSON
        const formData = new URLSearchParams();
        formData.append('id', subgalleryId);
        formData.append('password', trimmedPassword);

        const response = await fetch('/galleries/validate-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData
        });

        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;

        console.log('API response status:', response.status);

        // Handle API errors with more detailed error reporting
        if (!response.ok) {
          console.log('API response status:', response.status);
          try {
            const errorData = await response.json();
            console.log('Server error details:', response.status, JSON.stringify(errorData));
            const errorElement = document.getElementById('passwordError');
            errorElement.textContent = errorData.message || 'Server error';
          } catch (parseError) {
            console.error('Error parsing response:', parseError);
            const errorElement = document.getElementById('passwordError');
            errorElement.textContent = `Server error (${response.status})`;
          }
          return;
        }

        const data = await response.json();
        console.log('Password validation response:', data);

        if (data.success) {
          // Close modal
          bootstrap.Modal.getInstance(document.getElementById('passwordModal')).hide();

          // Redirect if URL is provided
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          }
        } else {
          const errorElement = document.getElementById('passwordError');
          displayError(data.message || 'Invalid password');
        }
      } catch (error) {
        console.error('Error validating password:', error);
        displayError('Error connecting to server. Please check your connection and try again.');
      }
    });
  } else {
    console.error('Password form not found in the DOM');
  }

  // Helper function to display error messages
  function displayError(message) {
    const errorElement = document.getElementById('passwordError');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    } else {
      alert(message);
    }
  }
});