/**
 * Main Theme Script - 0x1Ak4sh Portfolio
 * Handles navigation, animations, skills, lightbox, cursor, and typed text.
 * Cleaned from RyanCV theme - removed WordPress/Elementor dependencies.
 */
(function ($) {
    'use strict';

    // Preloader
    $(window).on("load", function () {
        var preload = $('.preloader');
        preload.find('.spinner').fadeOut(function () {
            preload.fadeOut(function () {
                if ($.fn.isotope) {
                    $('.grid-items').isotope('reloadItems').isotope();
                }
            });
        });
    });

    $(function () {
        var width = $(window).width();
        var header_offset_top = 15;
        if (width <= 540) {
            header_offset_top = 136;
        }

        var container = $('.container');
        var card_items = $('.card-inner');
        var animation_in = container.data('animation-in');
        var animation_out = container.data('animation-out');
        var menu_items = $('.top-menu li');

        // ---- One-Page Navigation ----
        if ($('.top-menu-onepage').length) {
            $('.top-menu').on('click', 'a', function () {
                var width = $(window).width();
                var id = $(this).attr('href');
                if (id == '') id = '#home';
                var card_item = $('#card-' + id.replace('#', ''));
                var h = parseFloat(card_item.offset().top);
                var menu_item = $(this).closest('li');

                if (id != '#home') {
                    window.location.hash = id;
                } else {
                    history.replaceState(null, null, ' ');
                }

                if (width >= 1121) {
                    if (!menu_item.hasClass('current-menu-item')) {
                        menu_items.removeClass('current-menu-item');
                        container.find(card_items).removeClass('animated ' + animation_in);

                        if ($(container).hasClass('opened')) {
                            container.find(card_items).addClass('animated ' + animation_out);
                        }

                        menu_item.addClass('current-menu-item');
                        container.addClass('opened');
                        container.find(card_item).removeClass('animated ' + animation_out);
                        container.find(card_item).addClass('animated ' + animation_in);
                        $(card_items).addClass('hidden');
                        $(card_item).removeClass('hidden');
                        $(card_item).addClass('active');

                        if ($.fn.isotope) {
                            $('.grid-items').isotope('reloadItems').isotope();
                            for (var i = 0; i <= 1000; i += 100) {
                                setTimeout(function () {
                                    $('.grid-items').isotope('reloadItems').isotope();
                                }, i);
                            }
                        }

                        skillsDotted_resize();
                    }
                }

                if (width < 1121) {
                    $('body,html').animate({ scrollTop: h - header_offset_top }, 800);
                }

                return false;
            });
        }

        // ---- Window Resize ----
        $(window).on('resize', function () {
            var width = $(window).width();

            if (width < 1121) {
                $('.card-inner').removeClass('hidden fadeOutLeft rotateOutUpLeft rollOut jackOutTheBox fadeOut fadeOutUp animated');
            } else {
                if ($('.top-menu li.current-menu-item a').length) {
                    var current_id = $('.top-menu li.current-menu-item a').attr('href');
                    if (current_id && current_id.startsWith('#')) {
                        var current_tab = $('#card-' + current_id.replace('#', ''));
                        current_tab.addClass('current-menu-item');
                    }
                }
            }

            setTimeout(skillsDotted_resize, 750);
        });

        function skillsDotted_resize() {
            var skills_dotted = $('.skills-list.dotted .progress');
            var skills_dotted_w = skills_dotted.width();
            if (skills_dotted.length) {
                skills_dotted.find('.percentage .da').css({ 'width': skills_dotted_w + 1 });
            }
        }

        // ---- Hash Navigation on Load ----
        var url_hash = location.hash;
        var sectionElem = $('#card-' + url_hash.replace('#', ''));

        if (sectionElem.length && $('.top-menu-onepage').length) {
            menu_items.removeClass('current-menu-item');
            $('.top-menu li a[href="' + url_hash + '"]').parent('li').addClass('current-menu-item');

            if (width >= 1121) {
                container.find(card_items).removeClass('animated ' + animation_in);
                if ($(container).hasClass('opened')) {
                    container.find(card_items).addClass('animated ' + animation_out);
                }
                container.addClass('opened');
                sectionElem.removeClass('animated ' + animation_out);
                sectionElem.addClass('animated ' + animation_in);
                $(card_items).addClass('hidden');
                sectionElem.removeClass('hidden');
                sectionElem.addClass('active');
            } else {
                $('body,html').animate({
                    scrollTop: parseFloat(sectionElem.offset().top) - header_offset_top
                }, 500);
            }
        }

        // ---- Profile Links -> Menu Navigation ----
        $('.lnks').on('click', '.lnk[href*="#"]', function () {
            var lnk_url = $(this).attr('href');
            var lnk_idx = lnk_url.indexOf("#");
            var lnk_hash = lnk_idx != -1 ? lnk_url.substring(lnk_idx + 1) : "";
            if ($('.top-menu a[href="#' + lnk_hash + '"]').length) {
                $('.top-menu a[href="#' + lnk_hash + '"]').trigger('click');
            }
        });

        // ---- Mobile Scroll Tracking ----
        if ((width < 1121) && $('.top-menu-onepage').length) {
            $(window).on('scroll', function () {
                var scrollPos = $(window).scrollTop();
                $('.top-menu ul li a').each(function () {
                    var currLink = $(this);
                    var currHref = currLink.attr('href');
                    if (currHref == '') currHref = '#home';
                    if (currHref.charAt(0) == "#") {
                        var refElement = $('#card-' + currHref.replace('#', ''));
                        if (refElement.length && refElement.offset().top - header_offset_top - 2 <= scrollPos) {
                            $('.top-menu ul li').removeClass("current-menu-item");
                            currLink.closest('li').addClass("current-menu-item");
                        }
                    }
                });
            });
        }

        // ---- Fixed Header on Small Mobile ----
        if (width <= 560) {
            $(window).on('scroll', function () {
                if ($(window).scrollTop() > 46) {
                    $('.header').addClass('fixed');
                } else {
                    $('.header').removeClass('fixed');
                }
            });
        }

        // ---- Sidebar Toggle ----
        $('header, .profile').on('click', '.menu-btn', function () {
            $('.s_overlay').fadeIn();
            $('.content-sidebar').addClass('active');
            $('body,html').addClass('sidebar-open');
            return false;
        });

        $('.content-sidebar, .container').on('click', '.close, .s_overlay', function () {
            $('.s_overlay').fadeOut();
            $('.content-sidebar').removeClass('active');
            $('body,html').removeClass('sidebar-open');
        });

        // ---- Typed.js ----
        if (typeof Typed !== 'undefined') {
            $('.r-typed').each(function () {
                var $this = $(this)[0];
                var $string = $(this).prev('.typing-title')[0];
                new Typed($this, {
                    stringsElement: $string,
                    backDelay: 3500,
                    typeSpeed: 80,
                    backSpeed: 20,
                    loop: true
                });
            });
        }

        // ---- Isotope Grid ----
        if ($.fn.isotope && $.fn.imagesLoaded) {
            var $container = $('.grid-items');
            $container.imagesLoaded(function () {
                $container.isotope({ itemSelector: '.grid-item' });
            });

            $('.filter-button-group').on('click', '.f_btn', function () {
                var filterValue = $(this).find('input').val();
                $container.isotope({ filter: filterValue });
                $('.filter-button-group .f_btn').removeClass('active');
                $(this).addClass('active');
            });
        }

        // ---- Magnific Popup ----
        if ($.fn.magnificPopup) {
            $('.has-popup-image').magnificPopup({
                type: 'image',
                closeOnContentClick: true,
                mainClass: 'popup-box',
                image: { verticalFit: true }
            });

            $('.has-popup-video').magnificPopup({
                type: 'iframe',
                preloader: false,
                fixedContentPos: false,
                mainClass: 'popup-box',
                callbacks: {
                    markupParse: function (template, values, item) {
                        template.find('iframe').attr('allow', 'autoplay');
                    }
                }
            });

            // Certificate image lightbox
            $('a.lnk-2').each(function () {
                var href = $(this).attr('href');
                if (/\.(png|jpg|jpeg|gif|webp)$/i.test(href)) {
                    $(this).magnificPopup({
                        type: 'image',
                        closeOnContentClick: true,
                        mainClass: 'popup-box',
                        image: { verticalFit: true }
                    });
                }
            });

            $('.has-popup-gallery').on('click', function () {
                var gallery = $(this).attr('href');
                $(gallery).magnificPopup({
                    delegate: 'a',
                    type: 'image',
                    closeOnContentClick: false,
                    mainClass: 'mfp-fade',
                    removalDelay: 160,
                    fixedContentPos: false,
                    gallery: { enabled: true }
                }).magnificPopup('open');
                return false;
            });
        }

        // ---- Service Items Border Fix ----
        var serv_num = $('.service-items .service-item').length;
        if (serv_num % 2 == 0) {
            $('.service-items .service-item').eq(serv_num - 1).parent().removeClass('border-line-h');
            $('.service-items .service-item').eq(serv_num - 2).parent().removeClass('border-line-h');
        } else if (serv_num > 0) {
            $('.service-items .service-item').eq(serv_num - 1).parent().removeClass('border-line-h');
        }

        // ---- Title First-Word Styling ----
        $('.content .title').each(function () {
            var title = $(this).text().split(' ');
            if (title.length > 1) {
                var firstWord = title[0];
                var replaceWord = '<span class="first-word">' + firstWord + '</span>';
                var newString = $(this).html().replace(firstWord, replaceWord);
                $(this).html(newString);
            } else {
                $(this).html('<span class="first-letter">' + $(this).html() + '</span>');
            }
        });

        // ---- Swiper Carousel ----
        if (typeof Swiper !== 'undefined') {
            var prop_loop = $('.revs-carousel .swiper-container').data('swiper-loop');
            var prop_delay = $('.revs-carousel .swiper-container').data('swiper-delay');
            var prop_autoplay = $('.revs-carousel .swiper-container').data('swiper-autoplay');
            var objAutoplay = 0;
            if (prop_autoplay) {
                objAutoplay = { disableOnInteraction: false, delay: prop_delay };
            }

            new Swiper('.revs-carousel .swiper-container', {
                spaceBetween: 0,
                slidesPerView: 1,
                observer: true,
                observeParents: true,
                autoplay: objAutoplay,
                loop: prop_loop,
                pagination: { el: '.revs-carousel .swiper-pagination', clickable: true }
            });

            new Swiper('.ryan-slideshow', {
                slidesPerView: 1,
                effect: 'fade',
                parallax: true,
                autoplay: true,
                speed: 1400
            });
        }

        // ---- Embed Container for iframes ----
        $('.single-post-text, .post-box').each(function () {
            $(this).find('iframe').wrap('<div class="embed-container"></div>');
        });

        // ---- No Sticky Menu Check ----
        if (!$('.top-menu ul').length) {
            $('.container').addClass('no-sticky-menu');
        }

        // ---- Skills Initialization ----
        function skills() {
            var skills_dotted = $('.skills-list.dotted .progress');
            var skills_dotted_w = skills_dotted.width();
            if (skills_dotted.length) {
                skills_dotted.append('<span class="dg"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></span>');
                skills_dotted.find('.percentage').append('<span class="da"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></span>');
                skills_dotted.find('.percentage .da').css({ 'width': skills_dotted_w });
            }
        }
        setTimeout(skills, 1000);

        var skills_circles = $('.skills-list.circles .progress');
        if (skills_circles.length) {
            skills_circles.append('<div class="slice"><div class="bar"></div><div class="fill"></div></div>');
        }

        // ---- Custom Cursor ----
        initCursor();
    });

    function initCursor() {
        var mouseX = window.innerWidth / 2;
        var mouseY = window.innerHeight / 2;

        var cursor = {
            el: $('.cursor'),
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            w: 30,
            h: 30,
            update: function () {
                var l = this.x - this.w / 2;
                var t = this.y - this.h / 2;
                this.el.css({ 'transform': 'translate3d(' + l + 'px,' + t + 'px, 0)' });
            }
        };

        $(window).mousemove(function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        $('a, .swiper-pagination, .swiper-button-prev, .swiper-button-next, button, .button, .btn, .lnk').hover(
            function () { $('.cursor').addClass("cursor-zoom"); },
            function () { $('.cursor').removeClass("cursor-zoom"); }
        );

        setInterval(move, 1000 / 60);

        function move() {
            cursor.x = lerp(cursor.x, mouseX, 0.1);
            cursor.y = lerp(cursor.y, mouseY, 0.1);
            cursor.update();
        }

        function lerp(start, end, amt) {
            return (1 - amt) * start + amt * end;
        }
    }

})(jQuery);
