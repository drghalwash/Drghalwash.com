document.addEventListener('DOMContentLoaded', function() {
    // Function to show the password modal
    function showPasswordModal(subgallerySlug) {
        const modal = document.getElementById('passwordModal');
        if (modal) {
            // Set the subgallery slug as a data attribute
            modal.setAttribute('data-slug', subgallerySlug);

            // Reset form fields and errors
            const passwordInput = document.getElementById('gallery-password');
            const errorElement = document.getElementById('password-error');
            if (passwordInput) passwordInput.value = '';
            if (errorElement) errorElement.textContent = '';

            // Show the modal
            modal.style.display = 'flex';
        }
    }

    // Add click event listeners to all private gallery items
    const privateItems = document.querySelectorAll('.private-gallery-item');
    privateItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const subgallerySlug = this.getAttribute('data-slug');
            if (subgallerySlug) {
                showPasswordModal(subgallerySlug);
            } else {
                console.error('Missing subgallery slug on private item');
            }
        });
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

    // Close modal when the close button is clicked
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = document.getElementById('passwordModal');
            if (modal) modal.style.display = 'none';
        });
    });

    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('passwordModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});