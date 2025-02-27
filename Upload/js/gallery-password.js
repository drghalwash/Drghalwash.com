
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
document.addEventListener('DOMContentLoaded', () => {
  // Setup password modal event listeners
  const passwordModal = document.getElementById('passwordModal');
  
  if (passwordModal) {
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const subgalleryId = document.getElementById('subgalleryId').value;
      const password = document.getElementById('password').value;
      
      try {
        const response = await fetch('/validate-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subgalleryId, password }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          window.location.href = data.redirectUrl;
        } else {
          alert('Invalid password. Please try again.');
        }
      } catch (error) {
        console.error('Error validating password:', error);
        alert('An error occurred. Please try again.');
      }
    });
  }
  
  // Setup click handlers for private galleries
  const privateGalleries = document.querySelectorAll('.subgallery-private');
  privateGalleries.forEach(gallery => {
    gallery.addEventListener('click', (e) => {
      e.preventDefault();
      const subgalleryId = gallery.getAttribute('data-subgallery-id');
      document.getElementById('subgalleryId').value = subgalleryId;
      document.getElementById('passwordModal').style.display = 'flex';
    });
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === passwordModal) {
      passwordModal.style.display = 'none';
    }
  });
  
  // Close button functionality
  const closeBtn = document.querySelector('.close-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      passwordModal.style.display = 'none';
    });
  }
});
