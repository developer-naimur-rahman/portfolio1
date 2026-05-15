/*  ---------------------------------------------------
    Template Name: Dreams
    Description: Dreams wedding template
    Author: Colorib
    Author URI: https://colorlib.com/
    Version: 1.0
    Created: Colorib
---------------------------------------------------------  */

'use strict';

(function ($) {

    /*------------------
        Preloader
    --------------------*/
    $(window).on('load', function () {
        $(".loader").fadeOut();
        $("#preloder").delay(200).fadeOut("slow");

        /*------------------
            Portfolio filter
        --------------------*/
        $('.portfolio__filter li').on('click', function () {
            $('.portfolio__filter li').removeClass('active');
            $(this).addClass('active');
        });
        if ($('.portfolio__gallery').length > 0) {
            var containerEl = document.querySelector('.portfolio__gallery');
            var mixer = mixitup(containerEl);
        }
    });

    /*------------------
        Background Set
    --------------------*/
    $('.set-bg').each(function () {
        var bg = $(this).data('setbg');
        $(this).css('background-image', 'url(' + bg + ')');
    });

    //Masonary
    $('.work__gallery').masonry({
        itemSelector: '.work__item',
        columnWidth: '.grid-sizer',
        gutter: 10
    });


    
    /*------------------
		Navigation
	--------------------*/
    $(".mobile-menu").slicknav({
        prependTo: '#mobile-menu-wrap',
        allowParentLinks: true
    });

    /*------------------
		Hero Slider
	--------------------*/
    $('.hero__slider').owlCarousel({
        loop: true,
        dots: true,
        mouseDrag: false,
        animateOut: 'fadeOut',
        animateIn: 'fadeIn',
        items: 1,
        margin: 0,
        smartSpeed: 1200,
        autoHeight: false,
        autoplay: true,
    });

    var dot = $('.hero__slider .owl-dot');
    dot.each(function () {
        var index = $(this).index() + 1;
        if (index < 10) {
            $(this).html('0').append(index);
        } else {
            $(this).html(index);
        }
    });

    /*------------------
        Testimonial Slider
    --------------------*/
    $(".testimonial__slider").owlCarousel({
        loop: true,
        margin: 0,
        items: 3,
        dots: true,
        dotsEach: 2,
        smartSpeed: 1200,
        autoHeight: false,
        autoplay: true,
        responsive: {
            992: {
                items: 3
            },
            768: {
                items: 2
            },
            320: {
                items: 1
            }
        }
    });

    /*------------------
        Latest Slider
    --------------------*/
    $(".latest__slider").owlCarousel({
        loop: true,
        margin: 0,
        items: 3,
        dots: true,
        dotsEach: 2,
        smartSpeed: 1200,
        autoHeight: false,
        autoplay: true,
        responsive: {
            992: {
                items: 3
            },
            768: {
                items: 2
            },
            320: {
                items: 1
            }
        }
    });

    /*------------------
        Logo Slider
    --------------------*/
    $(".logo__carousel").owlCarousel({
        loop: true,
        margin: 100,
        items: 6,
        dots: false,
        smartSpeed: 1200,
        autoHeight: false,
        autoplay: true,
        responsive: {
            992: {
                items: 5
            },
            768: {
                items: 4
            },
            480: {
                items: 3
            },
            320: {
                items: 2
            }
        }
    });

    /*------------------
        Video Popup
    --------------------*/
    $('.video-popup').magnificPopup({
        type: 'iframe'
    });

    /*------------------
        Counter
    --------------------*/
    $('.counter_num').each(function () {
        $(this).prop('Counter', 0).animate({
            Counter: $(this).text()
        }, {
            duration: 4000,
            easing: 'swing',
            step: function (now) {
                $(this).text(Math.ceil(now));
            }
        });
    });

})(jQuery);

// ==============================
// INTRO VIDEO PLAYER SCRIPT
// ==============================

const video = document.getElementById("introVideo");
const playBtn = document.getElementById("playBtn");
const progress = document.getElementById("progress");
const time = document.getElementById("time");
const volume = document.getElementById("volume");
const fullscreenBtn = document.getElementById("fullscreenBtn");

// Play / Pause
playBtn.addEventListener("click", () => {
  if (video.paused) {
    video.play();
    playBtn.textContent = "⏸";
  } else {
    video.pause();
    playBtn.textContent = "▶";
  }
});

// Update Progress Bar
video.addEventListener("timeupdate", () => {
  const value = (video.currentTime / video.duration) * 100;
  progress.value = value;

  let mins = Math.floor(video.currentTime / 60);
  let secs = Math.floor(video.currentTime % 60);
  if (secs < 10) secs = "0" + secs;
  time.textContent = `${mins}:${secs}`;
});

// Seek Video
progress.addEventListener("input", () => {
  video.currentTime = (progress.value * video.duration) / 100;
});

// Volume Control
volume.addEventListener("input", () => {
  video.volume = volume.value;
});

// Fullscreen Mode
fullscreenBtn.addEventListener("click", () => {
  if (video.requestFullscreen) video.requestFullscreen();
});


document.addEventListener("DOMContentLoaded", function () {
  const dropdownToggles = document.querySelectorAll(".dropdown-toggle");

  dropdownToggles.forEach(toggle => {
    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      this.parentElement.classList.toggle("open");
    });
  });
});

// Fiverr slider: load testimonials from JSON and initialize Owl carousel
$(document).ready(function() {
    function initFiverrSlider() {
        if ($('.fiverr-slider').length > 0) {
            $('.fiverr-slider').owlCarousel({
                loop: true,
                margin: 20,
                items: 1,
                dots: true,
                nav: false,
                autoplay: true,
                autoplayTimeout: 5000,
                smartSpeed: 800,
                responsive: {
                    0: { items: 1 },
                    768: { items: 1 },
                    992: { items: 1 }
                }
            });
        }
    }

    function renderTestimonials(list) {
        var $container = $('.fiverr-slider');
        $container.empty();
        list.forEach(function(item) {
            var stars = '★★★★★'.slice(0, item.rating);
            var card;
            // Prefer full review screenshot if provided
            if (item.screenshot) {
                card = '\n<div class="fiverr-card">\n  <div class="fiverr-card-inner screenshot-layout">\n    <div class="fiverr-screenshot"><img src="' + item.screenshot + '" alt="' + (item.name || 'Review screenshot') + '"></div>\n    <div class="fiverr-content">\n      <h4 class="fiverr-name">' + (item.name || '') + '</h4>\n      <div class="fiverr-rating">' + stars + '</div>\n      <p class="fiverr-text">"' + (item.text || '') + '"</p>\n      <a class="fiverr-link" href="' + (item.link || '#') + '" target="_blank">View on Fiverr</a>\n    </div>\n  </div>\n</div>\n';
            } else {
                card = '\n<div class="fiverr-card">\n  <div class="fiverr-card-inner">\n    <div class="fiverr-photo"><img src="' + (item.image || 'img/testimonial/placeholder.png') + '" alt="' + (item.name || 'Client') + '"></div>\n    <div class="fiverr-content">\n      <h4 class="fiverr-name">' + (item.name || '') + '</h4>\n      <div class="fiverr-rating">' + stars + '</div>\n      <p class="fiverr-text">"' + (item.text || '') + '"</p>\n      <a class="fiverr-link" href="' + (item.link || '#') + '" target="_blank">View on Fiverr</a>\n    </div>\n  </div>\n</div>\n';
            }
            $container.append(card);
        });
        initFiverrSlider();
    }

    // Try to fetch testimonials JSON; if it fails, keep static HTML placeholders
    fetch('static/fiverr-testimonials.json').then(function(resp) {
        if (!resp.ok) throw new Error('No testimonials JSON');
        return resp.json();
    }).then(function(json) {
        if (Array.isArray(json) && json.length) {
            renderTestimonials(json);
        } else {
            initFiverrSlider();
        }
    }).catch(function() {
        initFiverrSlider();
    });
});