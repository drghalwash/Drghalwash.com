(function(){

	'use strict'


	var siteMenuClone = function() {
		var jsCloneNavs = document.querySelectorAll('.js-clone-nav');
		var siteMobileMenuBody = document.querySelector('.site-mobile-menu-body');
		


		jsCloneNavs.forEach(nav => {
			var navCloned = nav.cloneNode(true);
			navCloned.setAttribute('class', 'site-nav-wrap');
			siteMobileMenuBody.appendChild(navCloned);
		});

		setTimeout(function(){

			var hasChildrens = document.querySelector('.site-mobile-menu').querySelectorAll(' .has-children');

			var counter = 0;
			hasChildrens.forEach( hasChild => {
				
				var refEl = hasChild.querySelector('a');

				var newElSpan = document.createElement('span');
				newElSpan.setAttribute('class', 'arrow-collapse collapsed');

				// prepend equivalent to jquery
				hasChild.insertBefore(newElSpan, refEl);

				var arrowCollapse = hasChild.querySelector('.arrow-collapse');
				arrowCollapse.setAttribute('data-toggle', 'collapse');
				arrowCollapse.setAttribute('data-target', '#collapseItem' + counter);

				var dropdown = hasChild.querySelector('.dropdown');
				dropdown.setAttribute('class', 'collapse');
				dropdown.setAttribute('id', 'collapseItem' + counter);

				counter++;
			});

		}, 1000);


		// Click js-menu-toggle

		var menuToggle = document.querySelectorAll(".js-menu-toggle");
		var mTog;
		menuToggle.forEach(mtoggle => {
			mTog = mtoggle;
			mtoggle.addEventListener("click", (e) => {
				if ( document.body.classList.contains('offcanvas-menu') ) {
					document.body.classList.remove('offcanvas-menu');
					mtoggle.classList.remove('active');
					mTog.classList.remove('active');
				} else {
					document.body.classList.add('offcanvas-menu');
					mtoggle.classList.add('active');
					mTog.classList.add('active');
				}
			});
		})



		var specifiedElement = document.querySelector(".site-mobile-menu");
		var mt, mtoggleTemp;
		document.addEventListener('click', function(event) {
			var isClickInside = specifiedElement.contains(event.target);
			menuToggle.forEach(mtoggle => {
				mtoggleTemp = mtoggle
				mt = mtoggle.contains(event.target);
			})

			if (!isClickInside && !mt) {
				if ( document.body.classList.contains('offcanvas-menu') ) {
					document.body.classList.remove('offcanvas-menu');
					mtoggleTemp.classList.remove('active');
				}
			}

		});

	}; 
	siteMenuClone();
 // Select the navbar, logo, links, and toggle spans
 const navbar = document.querySelector(".unique-navbar");
 const logo = document.querySelector(".distinct-logo img");
 const links = document.querySelectorAll(".uncommon-link");
 const toggleSpans = document.querySelectorAll(".menu-toggle .toggle-lines span");

 // Paths for the original and scrolled state logos
 const originalLogoSrc = "/images/white-logo.png"; // Replace with the path to your original logo
 const scrolledLogoSrc = "/images/black-logo.png"; // Replace with the path to your scrolled state logo

 // Function to handle scroll behavior
 function handleScroll() {
	 if (window.scrollY > 0) {
		 // Add scrolled class when the user scrolls down
		 navbar.classList.add("scrolled");

		 // Update logo for scrolled state
		 logo.src = scrolledLogoSrc;

		 // Update link colors
		 links.forEach((link) => {
			 link.style.color = "#OA6E87"; // Dark links for scrolled state
		 });

		 // Update toggle span colors
		 toggleSpans.forEach((span) => {
			 span.style.backgroundColor = "#OA6E87"; // Black for scrolled state
		 });
	 } else {
		 // Remove scrolled class when at the top of the page
		 navbar.classList.remove("scrolled");

		 // Ensure the logo is white when at the top
		 logo.src = originalLogoSrc;

		 // Reset link colors to inherit the default color
		 links.forEach((link) => {
			 link.style.color = "#OA6E87";
		 });

		 // Reset toggle span colors
		 toggleSpans.forEach((span) => {
			 span.style.backgroundColor = "#OA6E87"; // White for default state
		 });
	 }
 }

 // Ensure the logo is white when the page loads
 window.addEventListener("DOMContentLoaded", () => {
	 if (window.scrollY === 0) {
		 logo.src = originalLogoSrc;
	 }
 });

 // Attach the scroll event listener
 window.addEventListener("scroll", handleScroll);

})()
