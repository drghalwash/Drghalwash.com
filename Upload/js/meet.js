let slideIndex = 0;

function changeSlide(direction) {
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".dot");

  // Hide current slide
  slides[slideIndex].classList.remove("active");
  dots[slideIndex].classList.remove("active");

  // Calculate new slide index
  slideIndex = (slideIndex + direction + slides.length) % slides.length;

  // Show new slide
  slides[slideIndex].classList.add("active");
  dots[slideIndex].classList.add("active");

  updateSlider();
}

function currentSlide(index) {
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".dot");

  // Hide current slide
  slides[slideIndex].classList.remove("active");
  dots[slideIndex].classList.remove("active");

  // Set new slide index
  slideIndex = index - 1;

  // Show new slide
  slides[slideIndex].classList.add("active");
  dots[slideIndex].classList.add("active");

  updateSlider();
}

function updateSlider() {
  const slider = document.querySelector(".slider");
  slider.style.transform = `translateX(-${slideIndex * 100}%)`;
}

// Auto Slide
setInterval(() => {
  changeSlide(1);
}, 5000);
