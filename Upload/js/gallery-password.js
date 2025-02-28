
document.addEventListener('DOMContentLoaded', function() {
  console.log("Gallery password script loaded");
  
  // Find all gallery links that have private galleries
  document.querySelectorAll('.gallery-link').forEach(link => {
    const privateDiv = link.querySelector('.custom-div-private');
    
    if (privateDiv) {
      console.log('Found private gallery:', link.getAttribute('data-id'));
      
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        const galleryId = this.getAttribute('data-id');
        if (galleryId) {
          document.getElementById('imageId').value = galleryId;
          const modal = document.getElementById('passwordModal');
          if (modal) {
            const passwordModal = new bootstrap.Modal(modal);
            passwordModal.show();
            console.log('Showing password modal for gallery ID:', galleryId);
          } else {
            console.error('Password modal not found in the DOM');
          }
        } else {
          console.error('Missing data-id attribute on gallery link');
        }
      });
    }
  });

  // Handle form submission for password validation
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      console.log('Password form submitted');
      
      const subgalleryId = document.getElementById('imageId').value;
      const password = document.querySelector('input[name="password"]').value;
      
      if (!subgalleryId || !password) {
        alert('Please enter a password');
        return;
      }

      try {
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

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error:', response.status, errorText);
          alert('Invalid password or server error. Please try again.');
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          console.log('Password valid, redirecting to:', data.redirectUrl);
          window.location.href = data.redirectUrl;
        } else {
          console.error('Invalid password:', data.message);
          alert(data.message || 'Invalid password. Please try again.');
        }
      } catch (error) {
        console.error('Error validating password:', error);
        alert('An error occurred while validating the password. Please try again later.');
      }
    });
  } else {
    console.error('Password form not found in the DOM');
  }
});
