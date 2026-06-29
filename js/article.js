/**
 * Article/Project Page Script - 0x1Ak4sh Portfolio
 * Handles: TOC highlighting, copy buttons, reading progress,
 * collapsible outputs, code tabs, share menu, back-to-top, Mermaid init
 */
(function () {
    'use strict';

    // Wait for DOM
    document.addEventListener('DOMContentLoaded', function () {
        initReadingProgress();
        initTOC();
        initCopyButtons();
        initCollapsibleOutputs();
        initCodeTabs();
        initShareButtons();
        initBackToTop();
        initNavScroll();
        initMermaid();
        initImageZoom();
        initScrollReveal();
    });

    // ---- Reading Progress Bar ----
    function initReadingProgress() {
        var progressBar = document.querySelector('.reading-progress');
        if (!progressBar) return;

        window.addEventListener('scroll', function () {
            var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            var docHeight = document.documentElement.scrollHeight - window.innerHeight;
            var progress = (scrollTop / docHeight) * 100;
            progressBar.style.width = Math.min(progress, 100) + '%';
        });
    }

    // ---- Table of Contents - Active Highlighting ----
    function initTOC() {
        var tocLinks = document.querySelectorAll('.toc-list a');
        var headings = [];

        if (!tocLinks.length) return;

        // Gather all headings referenced by TOC
        tocLinks.forEach(function (link) {
            var id = link.getAttribute('href');
            if (id && id.startsWith('#')) {
                var heading = document.getElementById(id.substring(1));
                if (heading) headings.push(heading);
            }
        });

        if (!headings.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var id = entry.target.getAttribute('id');
                    tocLinks.forEach(function (link) {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === '#' + id) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, {
            rootMargin: '-80px 0px -70% 0px',
            threshold: 0
        });

        headings.forEach(function (heading) {
            observer.observe(heading);
        });

        // Smooth scroll for TOC links
        tocLinks.forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                var targetId = this.getAttribute('href').substring(1);
                var target = document.getElementById(targetId);
                if (target) {
                    var offset = 80;
                    var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({ top: top, behavior: 'smooth' });
                    history.replaceState(null, null, '#' + targetId);
                }
            });
        });
    }

    // ---- Copy Buttons for Command Blocks ----
    function initCopyButtons() {
        var copyBtns = document.querySelectorAll('.cmd-copy');

        copyBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var cmdBlock = this.closest('.cmd-block') || this.closest('.code-block');
                var codeEl = cmdBlock.querySelector('.cmd-body code, pre code');
                if (!codeEl) return;

                var text = codeEl.textContent;
                // Remove prompt characters for cleaner copy
                text = text.replace(/^[\$#>]\s?/gm, '').trim();

                navigator.clipboard.writeText(text).then(function () {
                    btn.classList.add('copied');
                    var originalHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check"></i> Copied';
                    setTimeout(function () {
                        btn.classList.remove('copied');
                        btn.innerHTML = originalHTML;
                    }, 2000);
                }).catch(function () {
                    // Fallback for older browsers
                    var textarea = document.createElement('textarea');
                    textarea.value = text;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    btn.classList.add('copied');
                    var originalHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check"></i> Copied';
                    setTimeout(function () {
                        btn.classList.remove('copied');
                        btn.innerHTML = originalHTML;
                    }, 2000);
                });
            });
        });
    }

    // ---- Collapsible Command Outputs ----
    function initCollapsibleOutputs() {
        var toggles = document.querySelectorAll('.cmd-output-toggle');

        toggles.forEach(function (toggle) {
            toggle.addEventListener('click', function () {
                var content = this.nextElementSibling;
                this.classList.toggle('expanded');
                content.classList.toggle('show');
            });
        });
    }

    // ---- Code Tabs ----
    function initCodeTabs() {
        var tabGroups = document.querySelectorAll('.code-tabs');

        tabGroups.forEach(function (group) {
            var buttons = group.querySelectorAll('.code-tab-btn');
            var contents = group.querySelectorAll('.code-tab-content');

            buttons.forEach(function (btn, index) {
                btn.addEventListener('click', function () {
                    buttons.forEach(function (b) { b.classList.remove('active'); });
                    contents.forEach(function (c) { c.classList.remove('active'); });
                    btn.classList.add('active');
                    contents[index].classList.add('active');
                });
            });
        });
    }

    // ---- Share Buttons ----
    function initShareButtons() {
        var shareButtons = document.querySelectorAll('.share-btn');

        shareButtons.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                var action = this.dataset.action;
                var url = encodeURIComponent(window.location.href);
                var title = encodeURIComponent(document.title);

                switch (action) {
                    case 'twitter':
                        window.open('https://twitter.com/intent/tweet?url=' + url + '&text=' + title, '_blank', 'width=600,height=400');
                        break;
                    case 'linkedin':
                        window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + url, '_blank', 'width=600,height=400');
                        break;
                    case 'telegram':
                        window.open('https://t.me/share/url?url=' + url + '&text=' + title, '_blank', 'width=600,height=400');
                        break;
                    case 'copy':
                        e.preventDefault();
                        navigator.clipboard.writeText(window.location.href).then(function () {
                            btn.innerHTML = '<i class="fas fa-check"></i> Link Copied!';
                            setTimeout(function () {
                                btn.innerHTML = '<i class="fas fa-link"></i> Copy Link';
                            }, 2000);
                        });
                        break;
                }
            });
        });
    }

    // ---- Back to Top Button ----
    function initBackToTop() {
        var btn = document.querySelector('.back-to-top');
        if (!btn) return;

        window.addEventListener('scroll', function () {
            if (window.pageYOffset > 400) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        });

        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ---- Nav Scroll Effect ----
    function initNavScroll() {
        var nav = document.querySelector('.article-nav');
        if (!nav) return;

        window.addEventListener('scroll', function () {
            if (window.pageYOffset > 20) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });
    }

    // ---- Mermaid.js Initialization ----
    function initMermaid() {
        if (typeof mermaid !== 'undefined') {
            mermaid.initialize({
                startOnLoad: true,
                theme: 'dark',
                themeVariables: {
                    primaryColor: '#1d252c',
                    primaryTextColor: '#e6edf3',
                    primaryBorderColor: '#a4ff91',
                    lineColor: '#a4ff91',
                    secondaryColor: '#0d1117',
                    tertiaryColor: '#0b1115',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '14px'
                }
            });
        }
    }

    // ---- Image Click-to-Zoom (uses Magnific Popup if available) ----
    function initImageZoom() {
        if (typeof jQuery !== 'undefined' && jQuery.fn.magnificPopup) {
            jQuery('.article-content img').each(function () {
                var $img = jQuery(this);
                if (!$img.parent('a').length) {
                    $img.wrap('<a href="' + $img.attr('src') + '" class="img-zoom"></a>');
                }
            });
            jQuery('.img-zoom').magnificPopup({
                type: 'image',
                closeOnContentClick: true,
                mainClass: 'popup-box',
                image: { verticalFit: true }
            });
        }
    }

    // ---- Scroll Reveal for Elements ----
    function initScrollReveal() {
        var elements = document.querySelectorAll('.content-card, .feature-card, .related-card');
        if (!elements.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        elements.forEach(function (el, index) {
            el.style.transitionDelay = (index % 6) * 0.08 + 's';
            observer.observe(el);
        });
    }

})();
