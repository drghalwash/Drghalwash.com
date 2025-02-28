// Gallery password authentication handler
document.addEventListener('DOMContentLoaded', function() {
  console.log("Gallery password script loaded");

  // Find all gallery items that are password protected
  const galleryLinks = document.querySelectorAll('.subgallery-item[data-status="Private"]');
  console.log("Found " + galleryLinks.length + " gallery links");

  // Password modal elements
  const passwordModal = document.getElementById('passwordModal');
  const passwordForm = document.getElementById('passwordForm');
  const passwordInput = document.getElementById('passwordInput');
  const slugInput = document.getElementById('subgallerySlug');
  const errorMessage = document.getElementById('passwordError');

  // Add click event to private gallery items
  galleryLinks.forEach(link => {
    const subgalleryId = link.getAttribute('data-id');
    const subgallerySlug = link.getAttribute('data-slug');
    console.log("Found private gallery link:", subgalleryId);

    link.addEventListener('click', function(e) {
      e.preventDefault();
      // Show password modal
      if (passwordModal) {
        // Set the subgallery slug in the hidden form field
        if (slugInput) {
          slugInput.value = subgallerySlug;
          console.log("Set subgallery slug in form:", subgallerySlug);
        }
        passwordModal.style.display = 'flex';
        passwordInput.focus();
      }
    });
  });

  // Close modal when clicking outside
  if (passwordModal) {
    passwordModal.addEventListener('click', function(e) {
      if (e.target === passwordModal) {
        passwordModal.style.display = 'none';
      }
    });
  }

  // Handle password form submission
  if (passwordForm) {
    passwordForm.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log("Password form submitted");

      // Get subgallery slug and password
      const slug = slugInput.value;
      const password = passwordInput.value.trim();

      console.log("Using subgallery slug:", slug);
      console.log("Submitted password (trimmed):", password);

      if (!slug) {
        errorMessage.textContent = "Invalid gallery selection.";
        return;
      }

      if (!password) {
        errorMessage.textContent = "Please enter a password.";
        return;
      }

      // Prepare the data to send
      const data = {
        slug: slug,
        password: password
      };

      console.log("Sending request with data:", JSON.stringify(data));

      // Send password validation request
      fetch('/api/gallery/validate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        console.log("API response status:", response.status);
        return response.json();
      })
      .then(data => {
        if (data.success) {
          // If successful, redirect to the protected gallery
          console.log("Password correct, redirecting to:", data.redirectUrl);
          window.location.href = data.redirectUrl;
        } else {
          // Show error message
          console.log("Server error details:", data.status, JSON.stringify(data));
          errorMessage.textContent = data.message || "Invalid password. Please try again.";
        }
      })
      .catch(error => {
        console.log("Server error:", error);
        errorMessage.textContent = "Server error. Please try again later.";
      });
    });
  }

  // Clear error message when typing new password
  if (passwordInput) {
    passwordInput.addEventListener('input', function() {
      errorMessage.textContent = "";
    });
  }
});