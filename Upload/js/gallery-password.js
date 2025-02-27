document.addEventListener('DOMContentLoaded', function() {
  // Get the password form element
  const passwordForm = document.getElementById('passwordForm');

  if (passwordForm) {
    passwordForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Get the form data
      const subgalleryId = document.getElementById('imageId').value;
      const password = document.querySelector('input[name="password"]').value;

      try {
        // Send the password to the server for validation
        const response = await fetch('/galleries/validate-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subgalleryId: subgalleryId,
            password: password
          })
        });

        const data = await response.json();

        if (data.success) {
          // If successful, redirect to the subgallery page
          window.location.href = data.redirectUrl;
        } else {
          // If failed, show an error message
          alert('Invalid password. Please try again or contact Dr. Khaled for access.');
        }
      } catch (error) {
        console.error('Error validating password:', error);
        alert('An error occurred. Please try again later.');
      }
    });
  }

  // Handle click events on gallery links to check if they're private
  document.querySelectorAll('.gallery-link').forEach(link => {
    link.addEventListener('click', function(e) {
      // Check if this is a private gallery by looking at parent container
      const galleryItem = this.querySelector('.custom-div-private');

      if (galleryItem) {
        // Prevent the default navigation
        e.preventDefault();

        // Set the subgallery ID in the modal
        if (this.dataset.id) {
          document.getElementById('imageId').value = this.dataset.id;

          // Show the password modal
          const passwordModal = new bootstrap.Modal(document.getElementById('passwordModal'));
          passwordModal.show();
        }
      }
      // If not private, the link will work normally
    });
  });
});