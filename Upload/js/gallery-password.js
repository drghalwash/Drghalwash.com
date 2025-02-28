document.addEventListener('DOMContentLoaded', function() {
  console.log("Gallery password script loaded");

  // Find all private gallery links
  const privateLinks = document.querySelectorAll('.private-gallery-link');
  console.log(`Found ${privateLinks.length} private gallery links`);

  // Set up click handlers for all private gallery links
  privateLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();

      // Get the subgalleryId from the data-id attribute
      const subgalleryId = this.getAttribute('data-id');
      console.log(`Link clicked with subgalleryId: ${subgalleryId}`);

      if (!subgalleryId) {
        console.error('No subgalleryId found on clicked link');
        alert('Error: Cannot identify the gallery. Please try again or contact support.');
        return;
      }

      // Set subgalleryId in both hidden form fields
      document.getElementById('subgalleryId').value = subgalleryId;
      document.getElementById('imageId').value = subgalleryId;

      // Clear error messages and password field
      const errorElement = document.getElementById('passwordError');
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      }

      const passwordField = document.getElementById('password');
      if (passwordField) {
        passwordField.value = '';
      }

      // Show the modal
      const passwordModal = new bootstrap.Modal(document.getElementById('passwordModal'));
      passwordModal.show();
    });
  });

  // Handle password form submission
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Get submit button and disable it
      const submitButton = this.querySelector('button[type="submit"]');
      const originalButtonText = submitButton ? submitButton.innerHTML : 'Submit';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = 'Verifying...';
      }

      // Get the password and subgalleryId
      const passwordInput = document.getElementById('password');
      const subgalleryIdField = document.getElementById('subgalleryId');

      // Validate inputs
      if (!passwordInput || !subgalleryIdField) {
        displayError('Form fields not found');
        resetButton(submitButton, originalButtonText);
        return;
      }

      const password = passwordInput.value.trim();
      const subgalleryId = subgalleryIdField.value.trim();

      // Detailed logging
      console.log(`Password submission - subgalleryId: ${subgalleryId} (type: ${typeof subgalleryId})`);
      console.log(`Password length: ${password.length}`);

      // Validate password
      if (!password) {
        displayError('Please enter a password');
        resetButton(submitButton, originalButtonText);
        return;
      }

      // Validate subgalleryId
      if (!subgalleryId) {
        displayError('Missing required parameter: subgalleryId');
        resetButton(submitButton, originalButtonText);
        return;
      }

      try {
        console.log('Sending password validation request...');

        // Create the request payload with explicit subgalleryId
        const requestData = {
          subgalleryId: subgalleryId,
          password: password
        };

        console.log('Request payload:', JSON.stringify(requestData));

        // Send API request
        const response = await fetch('/galleries/validate-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });

        // Reset button state
        resetButton(submitButton, originalButtonText);

        // Parse and handle response
        const data = await response.json();
        console.log('Server response:', data);

        if (response.ok && data.success) {
          console.log(`Password validated successfully. Redirecting to: ${data.redirectUrl}`);
          // Close modal before redirect
          const modalElement = document.getElementById('passwordModal');
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) modal.hide();

          // Redirect after a small delay to ensure modal is closed
          setTimeout(() => {
            window.location.href = data.redirectUrl;
          }, 300);
        } else {
          // Handle error
          const errorMessage = data.message || 'Invalid password';
          displayError(errorMessage);
          console.error('Password validation failed:', errorMessage);
        }
      } catch (error) {
        resetButton(submitButton, originalButtonText);
        displayError('An error occurred. Please try again.');
        console.error('Error during password validation:', error);
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
      console.error('Error element not found. Error message:', message);
      alert(message);
    }
  }

  // Helper to reset button state
  function resetButton(button, originalText) {
    if (button) {
      button.disabled = false;
      button.innerHTML = originalText;
    }
  }
});