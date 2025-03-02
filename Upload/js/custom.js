(function() {
	'use strict';

	AOS.init({
		duration: 800,
		easing: 'slide',
		once: true
	});

  var rellax = new Rellax('.rellax');

  var siteMenuClone = function() {
    setTimeout(function() {
      try {
        var counter = 0;
        $('.site-mobile-menu .has-children').each(function(){
          var $this = $(this);

          $this.prepend('<span class="arrow-collapse collapsed">');

          $this.find('.arrow-collapse').attr({
            'data-toggle' : 'collapse',
            'data-target' : '#collapseItem' + counter,
          });

          $this.find('> ul').attr({
            'class' : 'collapse',
            'id' : 'collapseItem' + counter,
          });

          counter++;
        });
      } catch (e) {
        console.log(['Element not found: .site-mobile-menu .has-children']);
      }

      $('body').on('click', '.arrow-collapse', function(e) {
        var $this = $(this);
        if ( $this.closest('li').find('.collapse').hasClass('show') ) {
          $this.removeClass('active');
        } else {
          $this.addClass('active');
        }
        e.preventDefault();  
      });

      $(window).resize(function() {
        var $this = $(this),
          w = $this.width();

        if ( w > 768 ) {
          if ( $('body').hasClass('offcanvas-menu') ) {
            $('body').removeClass('offcanvas-menu');
          }
        }
      });

      $('body').on('click', '.js-menu-toggle', function(e) {
        var $this = $(this);
        e.preventDefault();

        if ( $('body').hasClass('offcanvas-menu') ) {
          $('body').removeClass('offcanvas-menu');
          $this.removeClass('active');
        } else {
          $('body').addClass('offcanvas-menu');
          $this.addClass('active');
        }
      });

      // click outside offcanvas
      $(document).mouseup(function(e) {
        var container = $(".site-mobile-menu");
        if (!container.is(e.target) && container.has(e.target).length === 0) {
          if ( $('body').hasClass('offcanvas-menu') ) {
            $('body').removeClass('offcanvas-menu');
          }
        }
      });
    }, 100);
  };
  siteMenuClone();

  var counter = function() {
    $('#about-section').waypoint( function( direction ) {
      if( direction === 'down' && !$(this.element).hasClass('ftco-animated') ) {
        var comma_separator_number_step = $.animateNumber.numberStepFactories.separator(',')
        $('.number > span').each(function(){
          var $this = $(this),
            num = $this.data('number');
          $this.animateNumber(
            {
              number: num,
              numberStep: comma_separator_number_step
            }, 7000
          );
        });
      }
    } , { offset: '95%' } );
  }
  counter();

  var contentWayPoint = function() {
    var i = 0;
    $('.ftco-animate').waypoint( function( direction ) {
      if( direction === 'down' && !$(this.element).hasClass('ftco-animated') ) {
        i++;
        $(this.element).addClass('item-animate');
        setTimeout(function(){
          $('body .ftco-animate.item-animate').each(function(k){
            var el = $(this);
            setTimeout( function () {
              var effect = el.data('animate-effect');
              if ( effect === 'fadeIn') {
                el.addClass('fadeIn ftco-animated');
              } else if ( effect === 'fadeInLeft') {
                el.addClass('fadeInLeft ftco-animated');
              } else if ( effect === 'fadeInRight') {
                el.addClass('fadeInRight ftco-animated');
              } else {
                el.addClass('fadeInUp ftco-animated');
              }
              el.removeClass('item-animate');
            },  k * 50, 'easeInOutExpo' );
          });
        }, 100);
      }
    } , { offset: '95%' } );
  };
  contentWayPoint();

  $('[data-toggle="popover"]').popover();
  $('[data-toggle="tooltip"]').tooltip();

  // Initialize Bootstrap accordions
  function initAccordions() {
    $('[data-bs-toggle="collapse"]').on('click', function() {
      var target = $(this).data('bs-target') || $(this).attr('href');

      // Toggle the aria-expanded attribute
      var isExpanded = $(this).attr('aria-expanded') === 'true';
      $(this).attr('aria-expanded', !isExpanded);

      // Handle the collapse state
      $(target).toggleClass('show');

      return false;
    });
  }

  // Initialize accordion behavior on page load
  $(document).ready(function() {
    initAccordions();
  });

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

  // Initialize Bootstrap components
  if (typeof bootstrap !== 'undefined') {
    // Use native Bootstrap initialization for tooltips, popovers, etc.
    // but NOT for accordions (handled by accordion-manager.js)
  }

  var dropdowns = document.querySelectorAll('.has-children > a');


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