document.addEventListener('DOMContentLoaded', function() {
  const passwordForm = document.getElementById('passwordForm');
  const passwordInput = document.getElementById('password');
  const errorMessage = document.getElementById('passwordError'); // Changed ID to match original code
  const galleryContent = document.getElementById('galleryContent'); // Assuming this element exists to show/hide content
  const passwordModal = new bootstrap.Modal(document.getElementById('passwordModal'));

  // Check if we have a JWT token for this gallery
  const slug = window.location.pathname.split('/').pop();
  const token = localStorage.getItem(`gallery_token_${slug}`);

  if (token) {
    // Try to validate the token
    fetch(`/api/gallery/validate/${slug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    })
    .then(response => response.json())
    .then(data => {
      if (data.valid) {
        // Token is valid, unlock the gallery
        galleryContent.style.display = 'block';
      } else {
        // Token is invalid or expired, show password modal
        passwordModal.show();
      }
    })
    .catch(error => {
      console.error('Error validating token:', error);
      passwordModal.show();
    });
  } else {
    // No token found, show the password modal
    passwordModal.show();
  }

  passwordForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const password = passwordInput.value.trim();

    if (!password) {
      errorMessage.textContent = 'Please enter a password.';
      errorMessage.style.display = 'block'; // Show the error message
      return;
    }

    // Send password to server for validation
    fetch(`/api/gallery/access/${slug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Store JWT token in localStorage
        localStorage.setItem(`gallery_token_${slug}`, data.token);

        // Hide the modal and show the gallery content
        passwordModal.hide();
        galleryContent.style.display = 'block';
        errorMessage.textContent = '';
        errorMessage.style.display = 'none'; //Hide error message
      } else {
        errorMessage.textContent = 'Invalid password. Please try again.';
        errorMessage.style.display = 'block'; // Show the error message
      }
    })
    .catch(error => {
      console.error('Error validating password:', error);
      errorMessage.textContent = 'An error occurred. Please try again.';
      errorMessage.style.display = 'block'; // Show the error message
    });
  });

  //This part remains from original code, but it is now functionally redundant due to the JWT system
  const galleryLinks = document.querySelectorAll('[data-slug]');
  galleryLinks.forEach(function(link) {
    const slug = link.getAttribute('data-slug');
    if (slug) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        passwordModal.show(); //Show the modal instead of the old logic
      });
    }
  });
});