
document.addEventListener('DOMContentLoaded', function() {
  console.log("Gallery password script loaded");
  
  // Find all gallery links
  const galleryLinks = document.querySelectorAll('.gallery-link');
  
  if (galleryLinks.length > 0) {
    console.log(`Found ${galleryLinks.length} gallery links`);
    
    galleryLinks.forEach(link => {
      // Check if this is a private gallery by looking for status="Private" in the data
      const customDiv = link.querySelector('div[class]');
      
      if (customDiv && customDiv.classList.contains('custom-div-private')) {
        console.log('Found private gallery link:', link.getAttribute('data-id'));
        
        // Add click event listener to private galleries
        link.addEventListener('click', function(e) {
          e.preventDefault();
          
          const galleryId = this.getAttribute('data-id');
          if (galleryId) {
            // Show password modal
            const modal = document.getElementById('passwordModal');
            if (modal) {
              // Set the subgallery ID in the hidden field
              const imageIdField = document.getElementById('imageId');
              if (imageIdField) {
                imageIdField.value = galleryId;
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
      
      const subgalleryId = document.getElementById('imageId').value;
      const passwordInput = document.querySelector('#passwordModal input[name="password"]');
      
      if (!subgalleryId || !passwordInput) {
        displayError('Missing required information');
        return;
      }
      
      const password = passwordInput.value;
      if (!password) {
        displayError('Please enter a password');
        return;
      }

      // Show loading state
      const submitButton = passwordForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = 'Validating...';

      try {
        const response = await fetch('/galleries/validate-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subgalleryId: subgalleryId,
            password: password.trim()
          })
        });

        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error:', response.status, errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            displayError(errorData.message || 'Invalid password. Please try again.');
          } catch (e) {
            displayError('Invalid password or server error. Please try again.');
          }
          return;
        }
        
        // Success - handle redirect
        const data = await response.json();
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          // Close the modal if no redirect
          const modal = bootstrap.Modal.getInstance(document.getElementById('passwordModal'));
          if (modal) {
            modal.hide();
          }
        }
      } catch (error) {
        console.error('Error validating password:', error);
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        displayError('A network error occurred. Please try again.');
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
