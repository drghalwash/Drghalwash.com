
document.addEventListener('DOMContentLoaded', function() {
    // Gallery items click event
    const galleryItems = document.querySelectorAll('.gallery-item');
    const modal = document.getElementById('passwordModal');
    const closeBtn = document.querySelector('.close-button');
    
    if (galleryItems) {
        galleryItems.forEach(item => {
            item.addEventListener('click', function() {
                const slug = this.getAttribute('data-slug');
                const status = this.getAttribute('data-status');
                
                if (status === 'Private') {
                    // Show password modal for private galleries
                    modal.style.display = 'block';
                    modal.setAttribute('data-slug', slug);
                } else {
                    // Navigate to subgallery for public galleries
                    const gallerySlug = window.location.pathname.split('/').pop();
                    window.location.href = `/galleries/${gallerySlug}/${slug}`;
                }
            });
        });
    }
    
    // Close modal when clicking the close button
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Handle form submission
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const modal = document.getElementById('passwordModal');
            const subgallerySlug = modal.getAttribute('data-slug');
            const password = document.getElementById('gallery-password').value;
            const errorElement = document.getElementById('password-error');

            // Clear any previous errors
            if (errorElement) errorElement.textContent = '';

            // Validate inputs
            if (!subgallerySlug) {
                if (errorElement) errorElement.textContent = 'Missing subgallery information';
                return;
            }

            if (!password) {
                if (errorElement) errorElement.textContent = 'Please enter a password';
                return;
            }

            // Show loading indicator
            const submitButton = passwordForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Validating...';
            submitButton.disabled = true;

            // Send the validation request
            fetch('/galleries/validate-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    slug: subgallerySlug,
                    password: password
                })
            })
            .then(response => response.json())
            .then(data => {
                // Reset button
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;

                if (data.success) {
                    // Hide modal
                    modal.style.display = 'none';

                    // Redirect to the subgallery page
                    if (data.redirectUrl) {
                        window.location.href = data.redirectUrl;
                    }
                } else {
                    // Show error message
                    if (errorElement) errorElement.textContent = data.message || 'Invalid password';
                }
            })
            .catch(error => {
                console.error('Error validating password:', error);
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;

                if (errorElement) errorElement.textContent = 'An error occurred. Please try again.';
            });
        });
    }
});
