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
    passwordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      console.log('Password form submitted');

      const subgalleryIdField = document.getElementById('imageId');
      // Try multiple ways to get the subgalleryId
      let subgalleryId = null;

      // Method 1: Get from form field
      if (subgalleryIdField) {
        subgalleryId = subgalleryIdField.value;
        console.log('Found subgalleryId in form field:', subgalleryId);
      }

      // Method 2: Get from modal data attribute if form field is missing or empty
      if (!subgalleryId) {
        const modalDataId = passwordModal.dataset.subgalleryId;
        if (modalDataId) {
          subgalleryId = modalDataId;
          console.log('Retrieved subgalleryId from modal data attribute:', subgalleryId);
        }
      }

      // Final check
      if (!subgalleryId) {
        console.error('Could not retrieve subgalleryId from any source');
        displayError('Missing required information: subgallery ID');
        return;
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

        // Create the request data - include both field names for maximum compatibility
        const requestData = {
          subgalleryId: subgalleryId,
          imageId: subgalleryId,  // Include both field names to be safe
          password: trimmedPassword
        };

        console.log('Sending API request with data:', requestData);

        const response = await fetch('/galleries/validate-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });

        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;

        console.log('API response status:', response.status);

        if (!response.ok) {
          const responseText = await response.text();
          console.log('Server error:', response.status, responseText);

          try {
            // Try to parse as JSON for more detailed error
            const errorData = JSON.parse(responseText);
            displayError(errorData.message || `Error (${response.status}): Please try again`);
          } catch (e) {
            // If can't parse as JSON, show generic error
            displayError(`Server error (${response.status}): Please try again`);
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