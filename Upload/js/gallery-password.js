
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
  // Check for password prompt in URL
  const urlParams = new URLSearchParams(window.location.search);
  const needsPassword = urlParams.get('passwordPrompt') === 'true';
  const subgallerySlug = urlParams.get('subgallerySlug');
  
  if (needsPassword && subgallerySlug) {
    // Get current gallery slug from URL path
    const pathParts = window.location.pathname.split('/');
    const gallerySlug = pathParts[pathParts.length - 1];
    
    // Set the hidden fields in the form
    document.getElementById('gallerySlug').value = gallerySlug;
    document.getElementById('subgallerySlug').value = subgallerySlug;
    
    // Show the password modal
    const passwordModal = new bootstrap.Modal(document.getElementById('passwordModal'));
    passwordModal.show();
  }
  
  // Password form submission handler
  document.getElementById('passwordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const gallerySlug = document.getElementById('gallerySlug').value;
    const subgallerySlug = document.getElementById('subgallerySlug').value;
    const password = document.getElementById('password').value;
    
    try {
      const response = await fetch('/galleries/validate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gallerySlug,
          subgallerySlug,
          password
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        window.location.href = data.redirectUrl;
      } else {
        // Show error message
        const errorMsg = document.getElementById('passwordError');
        errorMsg.textContent = data.message || 'Invalid password';
        errorMsg.style.display = 'block';
      }
    } catch (error) {
      console.error('Error validating password:', error);
      alert('An error occurred while validating the password');
    }
  });
  
  // Direct click handler for subgallery links
  document.querySelectorAll('.gallery-link').forEach(link => {
    link.addEventListener('click', function(e) {
      // If this is a private subgallery (has the custom-div-private class)
      if (this.querySelector('.custom-div-private')) {
        e.preventDefault();
        
        // Extract slugs from the href
        const href = this.getAttribute('href');
        const parts = href.split('/');
        const gallerySlug = parts[parts.length - 2];
        const subgallerySlug = parts[parts.length - 1];
        
        // Set form values
        document.getElementById('gallerySlug').value = gallerySlug;
        document.getElementById('subgallerySlug').value = subgallerySlug;
        
        // Show password modal
        const passwordModal = new bootstrap.Modal(document.getElementById('passwordModal'));
        passwordModal.show();
      }
    });
  });
});
