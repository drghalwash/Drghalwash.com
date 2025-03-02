(function () {

	'use strict'


	AOS.init({
		duration: 800,
		easing: 'slide',
		once: true
	});

	// Safely initialize Rellax only if elements exist
	try {
		if (document.querySelector('.rellax')) {
			var rellax = new Rellax('.rellax');
		}
	} catch (err) {
		console.log('Element not found: .rellax');
	}

	var preloader = function() {

		var loader = document.querySelector('.loader');
		var overlay = document.getElementById('overlayer');

		function fadeOut(el) {
			el.style.opacity = 1;
			(function fade() {
				if ((el.style.opacity -= .1) < 0) {
					el.style.display = "none";
				} else {
					requestAnimationFrame(fade);
				}
			})();
		};

		setTimeout(function() {
			fadeOut(loader);
			fadeOut(overlay);
		}, 200);
	};
	preloader();


	var tinyslier = function() {



		var el = document.querySelectorAll('.wide-slider-testimonial');
		if ( el.length > 0 ) {
			var slider = tns({
				container: ".wide-slider-testimonial",
				items: 1,
				slideBy: 1,
				axis: "horizontal",
				swipeAngle: false,
				speed: 700,
				nav: true,
				loop: true,
				edgePadding: 40,
				controls: true,
				controlsPosition: "bottom",
				autoHeight: true,
				autoplay: true,
				mouseDrag: true,
				autoplayHoverPause: true,
				autoplayTimeout: 3500,
				autoplayButtonOutput: false,
				controlsContainer: "#prevnext-testimonial",
				responsive: {
					350: {
						items: 1
					},

					500: {
						items: 2
					},
					600: {
						items: 3
					},
					900: {
						items: 5
					}
				},
			});
		}


		var destinationSlider = document.querySelectorAll('.destination-slider');

		if ( destinationSlider.length > 0 ) {
			var desSlider = tns({
				container: ".destination-slider",
				mouseDrag: true,
				items: 1,
				axis: "horizontal",
				swipeAngle: false,
				speed: 700,
				edgePadding: 50,
				nav: true,
				gutter: 30,
				autoplay: true,
				autoplayButtonOutput: false,
				controlsContainer: "#destination-controls",
				responsive: {
					350: {
						items: 1
					},

					500: {
						items: 2
					},
					600: {
						items: 3
					},
					900: {
						items: 5
					}
				},
			})
		}



	}
	tinyslier();


	var lightbox = function() {
		var lightboxVideo = GLightbox({
			selector: '.glightbox3'
		});
	};
	lightbox();



})();
// Safe element accessor
function safeQuerySelector(selector, parent = document) {
  const element = parent.querySelector(selector);
  if (!element) {
    console.warn(`Element not found: ${selector}`);
    return null;
  }
  return element;
}

// Safe event binding
function safeAddEventListener(element, event, handler) {
  if (!element) {
    console.warn('Cannot add event listener to null element');
    return;
  }
  element.addEventListener(event, handler);
}

// Safe style setter
function safeSetStyle(element, property, value) {
  if (!element) {
    console.warn('Cannot set style on null element');
    return;
  }
  element.style[property] = value;
}

// Initialize Rellax safely
function initRellax() {
  if (typeof Rellax === 'undefined') {
    console.warn('Rellax is not loaded');
    return;
  }
  const rellaxElement = safeQuerySelector('.rellax');
  if (rellaxElement) {
    new Rellax('.rellax');
  }
}

// Document ready handler
document.addEventListener('DOMContentLoaded', () => {
  initRellax();
});