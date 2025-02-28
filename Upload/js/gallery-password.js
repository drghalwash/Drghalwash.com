document.addEventListener('DOMContentLoaded', function() {
  console.log('Gallery password script loaded');

  // Find all gallery links
  const galleryLinks = document.querySelectorAll('.gallery-link');
  console.log(`Found ${galleryLinks.length} gallery links`);

  // Add click handlers to private gallery links
  galleryLinks.forEach(function(link) {
    if (link.classList.contains('private-gallery-link')) {
      const slug = link.getAttribute('data-slug');
      console.log('Found private gallery link:', slug);

      link.addEventListener('click', function(e) {
        e.preventDefault();

        const slug = this.getAttribute('data-slug');
        if (slug) {
          // Show password modal
          const modal = document.getElementById('passwordModal');
          if (modal) {
            // Set the subgallery slug in the hidden field
            const slugField = document.getElementById('subgallerySlug');
            if (slugField) {
              slugField.value = slug;
              console.log('Set subgallery slug in form:', slug);
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
          } else {
            console.error('Password modal not found in the DOM');
          }
        } else {
          console.error('Subgallery slug not found on link');
        }
      });
    }
  });

  // Function to display error messages
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

  // Handle form submission for password validation
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      console.log('Password form submitted');

      // Get slug and password from form
      const slugField = document.getElementById('subgallerySlug');
      const passwordField = document.querySelector('#passwordModal input[name="password"]');

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

      console.log('Submitted password (trimmed):', password);

      // Get submit button for updating UI state
      const submitButton = passwordForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton ? submitButton.innerHTML : 'Submit';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = 'Verifying...';
      }

      try {
        // Create a simpler request data object
        const requestData = {
          slug: slug,
          password: password
        };

        console.log('Sending request with data:', JSON.stringify(requestData));
        console.log('Sending API request with data:', requestData);

        // Use a URLSearchParams object for form data
        const formData = new URLSearchParams();
        formData.append('slug', slug);
        formData.append('password', password);

        const response = await fetch('/galleries/validate-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData
        });

        // Reset button state
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonText;
        }

        console.log('API response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.log('Server error details:', response.status, JSON.stringify(errorData));
          displayError(errorData.message || 'Invalid password');
          return;
        }

        const data = await response.json();
        if (data.success && data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          displayError('Authentication failed. Please try again.');
        }
      } catch (error) {
        console.error('Error during password validation:', error);
        displayError('An error occurred. Please try again later.');

        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonText;
        }
      }
    });
  } else {
    console.log('Password form not found');
  }
});