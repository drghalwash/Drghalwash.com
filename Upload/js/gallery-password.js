
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const imageId = document.getElementById('imageId').value;
  const password = e.target.password.value;

  try {
    const response = await fetch('/galleries/validate-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId, password })
    });
    
    const data = await response.json();
    if (data.success) {
      window.location.href = data.redirectUrl;
    } else {
      alert('Invalid password');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred');
  }
});
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
  
  // Handle showing the password modal when clicking on private galleries
  document.querySelectorAll('.custom-div-private').forEach(item => {
    item.addEventListener('click', function(e) {
      // Prevent the default navigation
      e.preventDefault();
      
      // Get the gallery link and extract the subgallery ID
      const galleryLink = this.closest('a');
      const url = new URL(galleryLink.href);
      const pathParts = url.pathname.split('/');
      const slug = pathParts[pathParts.length - 1];
      
      // Find the subgallery ID by slug
      const subgalleryElement = this.closest('.gallery-link');
      if (subgalleryElement && subgalleryElement.dataset.id) {
        // Set the subgallery ID in the modal
        document.getElementById('imageId').value = subgalleryElement.dataset.id;
        
        // Show the password modal
        const passwordModal = new bootstrap.Modal(document.getElementById('passwordModal'));
        passwordModal.show();
      }
    });
  });
});
