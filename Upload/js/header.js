// Get the modals
var mobileModal = document.getElementById("mobileModal");
var desktopModal = document.getElementById("desktopModal");

// Variable to track whether the modal has been shown
var modalShown = false;

// Function to detect screen size and show the correct modal
function showModal() {
  if (!modalShown) {
    if (window.innerWidth <= 1000) {
      // Show mobile modal, hide desktop modal
      mobileModal.style.display = "block";
      desktopModal.style.display = "none";
    } else {
      // Show desktop modal, hide mobile modal
      mobileModal.style.display = "none";
      desktopModal.style.display = "block";
    }
    // Set the flag to true after the modal is displayed
    modalShown = true;
  }
}

// Close the modal when clicking anywhere outside the modal content
window.onclick = function (event) {
  if (event.target == mobileModal) {
    mobileModal.style.display = "none";
  } else if (event.target == desktopModal) {
    desktopModal.style.display = "none";
  }
};

// Trigger the modal logic when the page loads
window.onload = showModal;

// Get all dropdown elements
const dropdowns = document.querySelectorAll('.dropdown');

// Loop through each dropdown
dropdowns.forEach(dropdown => {
    const link = dropdown.querySelector('.dropdown-link');

    // Toggle dropdown menu on click
    link.addEventListener('click', (e) => {
        dropdown.classList.toggle('open'); // Toggle the 'open' class
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
        }
    });
});