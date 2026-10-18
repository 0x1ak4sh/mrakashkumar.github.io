/**
 * Quick Nav - 0x1Ak4sh Portfolio
 * Quick card actions (copy email, jump to contact, open terminal) and the
 * terminal shortcuts ("/" or Ctrl+K, and links to /#terminal).
 * The terminal itself lives in terminal.js (window.Term).
 */
(function () {
    'use strict';

    function copyText(text) {
        function legacy() {
            var t = document.createElement('textarea');
            t.value = text;
            t.setAttribute('readonly', '');
            t.style.position = 'fixed';
            t.style.opacity = '0';
            document.body.appendChild(t);
            t.select();
            try { document.execCommand('copy'); } catch (e) { /* ignore */ }
            document.body.removeChild(t);
        }
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).catch(legacy);
        }
        legacy();
        return Promise.resolve();
    }

    function closeSidebar() {
        var close = document.querySelector('.content-sidebar .close');
        if (close && document.querySelector('.content-sidebar.active')) close.click();
    }

    function openTerminal() {
        closeSidebar();
        if (window.Term) window.Term.open();
    }

    document.addEventListener('click', function (e) {
        var copyBtn = e.target.closest('.qc-copy');
        if (copyBtn) {
            var label = copyBtn.querySelector('span');
            copyText(copyBtn.getAttribute('data-copy')).then(function () {
                label.textContent = 'Copied!';
                copyBtn.classList.add('is-done');
                setTimeout(function () {
                    label.textContent = 'Copy email';
                    copyBtn.classList.remove('is-done');
                }, 1800);
            });
            return;
        }
        var gotoBtn = e.target.closest('.qc-goto');
        if (gotoBtn) {
            e.preventDefault();
            closeSidebar();
            var link = document.querySelector('.top-menu a[href="' + gotoBtn.getAttribute('href') + '"]');
            if (link) link.click();
            return;
        }
        if (e.target.closest('.cmd-open')) {
            e.preventDefault();
            openTerminal();
        }
    });

    // "/" or Ctrl/Cmd+K (ignored while typing in a form field)
    document.addEventListener('keydown', function (e) {
        var tag = (e.target.tagName || '').toLowerCase();
        var typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
        if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (window.Term) window.Term.toggle();
        } else if (e.key === '/' && !typing && !(window.Term && window.Term.isOpen())) {
            e.preventDefault();
            openTerminal();
        }
    });

    // mrakashkumar.in/#terminal opens it straight away
    if (location.hash === '#terminal') {
        history.replaceState(null, '', location.pathname + location.search);
        window.addEventListener('load', function () { setTimeout(openTerminal, 400); });
    }
})();
