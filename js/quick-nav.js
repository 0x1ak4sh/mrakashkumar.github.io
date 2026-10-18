/**
 * Quick Nav - 0x1Ak4sh Portfolio
 * Quick card actions (copy email, jump to contact) and the terminal
 * command bar (open with the menu item, "/" or Ctrl+K).
 */
(function () {
    'use strict';

    var EMAIL = 'admin@mrakashkumar.in';
    var LINKS = {
        linkedin: 'https://www.linkedin.com/in/0x1ak4sh',
        github: 'https://github.com/0x1ak4sh',
        x: 'https://twitter.com/0x1ak4sh/',
        telegram: 'https://t.me/Ak4sh0x1'
    };

    // =============================================
    // Helpers
    // =============================================
    // Clipboard API first; falls back to execCommand when it is blocked.
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

    function goToSection(name) {
        closeSidebar();
        var link = document.querySelector('.top-menu a[href="#' + name + '"]');
        if (link) link.click();
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    // =============================================
    // Quick card
    // =============================================
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
            goToSection(gotoBtn.getAttribute('href').slice(1));
            return;
        }
        var cmdBtn = e.target.closest('.cmd-open');
        if (cmdBtn) {
            e.preventDefault();
            closeSidebar();
            openTerminal();
        }
    });

    // =============================================
    // Terminal
    // =============================================
    var term, out, input, sugg, cmdHistory = [], histIdx = -1, lastFocus = null;

    var COMMANDS = [
        { name: 'help', desc: 'list commands' },
        { name: 'whoami', desc: 'who is Akash' },
        { name: 'cv', desc: 'download my CV' },
        { name: 'certs', desc: 'my certifications' },
        { name: 'docente', desc: 'what I teach' },
        { name: 'projects', desc: 'go to projects' },
        { name: 'articles', desc: 'go to articles' },
        { name: 'resume', desc: 'go to resume' },
        { name: 'contact', desc: 'go to contact form' },
        { name: 'foothold', desc: '213 HackTheBox machines' },
        { name: 'email', desc: 'copy my email' },
        { name: 'socials', desc: 'linkedin, github, x, telegram' },
        { name: 'ls', desc: 'list projects and articles' },
        { name: 'clear', desc: 'clear the screen' },
        { name: 'exit', desc: 'close the terminal' }
    ];

    function content() {
        return window.SITE_CONTENT || [];
    }

    function build() {
        term = document.createElement('div');
        term.className = 'cmd-overlay';
        term.setAttribute('role', 'dialog');
        term.setAttribute('aria-modal', 'true');
        term.setAttribute('aria-label', 'Terminal');
        term.innerHTML =
            '<div class="cmd-window">' +
            '  <div class="cmd-bar">' +
            '    <span class="cmd-dots"><i></i><i></i><i></i></span>' +
            '    <span class="cmd-title">akash@0x1ak4sh: ~</span>' +
            '    <button type="button" class="cmd-close" aria-label="Close terminal">&times;</button>' +
            '  </div>' +
            '  <div class="cmd-out" aria-live="polite"></div>' +
            '  <form class="cmd-line" autocomplete="off">' +
            '    <label class="cmd-prompt" for="cmd-input">akash@0x1ak4sh:~$</label>' +
            '    <input id="cmd-input" class="cmd-input" type="text" spellcheck="false" autocapitalize="off" placeholder="type help">' +
            '  </form>' +
            '  <ul class="cmd-sugg" role="listbox"></ul>' +
            '</div>';
        document.body.appendChild(term);

        out = term.querySelector('.cmd-out');
        input = term.querySelector('.cmd-input');
        sugg = term.querySelector('.cmd-sugg');

        term.addEventListener('click', function (e) {
            if (e.target === term || e.target.closest('.cmd-close')) closeTerminal();
            var item = e.target.closest('.cmd-sugg li');
            if (item) run(item.getAttribute('data-cmd'));
            var chip = e.target.closest('[data-run]');
            if (chip) run(chip.getAttribute('data-run'));
        });

        term.querySelector('.cmd-line').addEventListener('submit', function (e) {
            e.preventDefault();
            var active = sugg.querySelector('li.is-active');
            run(active && input.value.trim() ? active.getAttribute('data-cmd') : input.value);
        });

        input.addEventListener('input', renderSuggestions);
        input.addEventListener('keydown', onKey);

        print(
            '<span class="c-accent">Welcome to 0x1Ak4sh.</span> Type a command or click one:<br>' +
            chips(['whoami', 'cv', 'certs', 'projects', 'contact', 'help'])
        );
    }

    function chips(list) {
        return '<span class="cmd-chips">' + list.map(function (c) {
            return '<button type="button" class="cmd-chip" data-run="' + c + '">' + c + '</button>';
        }).join('') + '</span>';
    }

    function print(html, echo) {
        if (echo !== undefined) {
            out.insertAdjacentHTML('beforeend',
                '<div class="cmd-echo"><span class="c-prompt">$</span> ' + escapeHtml(echo) + '</div>');
        }
        out.insertAdjacentHTML('beforeend', '<div class="cmd-res">' + html + '</div>');
        out.scrollTop = out.scrollHeight;
    }

    function openTerminal() {
        if (!term) build();
        lastFocus = document.activeElement;
        term.classList.add('is-open');
        document.documentElement.classList.add('cmd-lock');
        setTimeout(function () { input.focus(); }, 30);
    }

    function closeTerminal() {
        if (!term) return;
        term.classList.remove('is-open');
        document.documentElement.classList.remove('cmd-lock');
        sugg.innerHTML = '';
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    // Matches commands first, then project/article titles.
    function matches(q) {
        q = q.toLowerCase().trim();
        if (!q) return [];
        var res = [];
        COMMANDS.forEach(function (c) {
            if (c.name.indexOf(q) === 0) res.push({ cmd: c.name, label: c.name, hint: c.desc });
        });
        content().forEach(function (it) {
            var hay = (it.title + ' ' + (it.tags || []).join(' ')).toLowerCase();
            if (hay.indexOf(q) !== -1) {
                res.push({ cmd: 'open ' + it.slug, label: it.title, hint: it.type });
            }
        });
        return res.slice(0, 6);
    }

    function renderSuggestions() {
        var list = matches(input.value);
        sugg.innerHTML = list.map(function (m, i) {
            return '<li role="option" data-cmd="' + escapeHtml(m.cmd) + '"' + (i === 0 ? ' class="is-active"' : '') + '>' +
                '<span>' + escapeHtml(m.label) + '</span><em>' + escapeHtml(m.hint) + '</em></li>';
        }).join('');
    }

    function onKey(e) {
        var items = sugg.querySelectorAll('li');
        var active = sugg.querySelector('li.is-active');
        var idx = Array.prototype.indexOf.call(items, active);

        if (e.key === 'Escape') {
            closeTerminal();
        } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && items.length) {
            e.preventDefault();
            if (active) active.classList.remove('is-active');
            idx = e.key === 'ArrowDown' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
            items[idx].classList.add('is-active');
        } else if (e.key === 'ArrowUp' && cmdHistory.length) {
            e.preventDefault();
            histIdx = Math.min(histIdx + 1, cmdHistory.length - 1);
            input.value = cmdHistory[histIdx];
        } else if (e.key === 'Tab' && active) {
            e.preventDefault();
            input.value = active.getAttribute('data-cmd');
            renderSuggestions();
        }
    }

    function listContent(type) {
        return content().filter(function (it) { return !type || it.type === type; }).map(function (it) {
            return '<a class="cmd-link" href="' + it.url + '">' + escapeHtml(it.title) + '</a>';
        }).join('<br>');
    }

    function run(raw) {
        var cmd = String(raw || '').trim();
        input.value = '';
        sugg.innerHTML = '';
        if (!cmd) return;
        cmdHistory.unshift(cmd);
        histIdx = -1;

        var parts = cmd.toLowerCase().split(/\s+/);
        var name = parts[0];
        var arg = parts.slice(1).join(' ');

        switch (name) {
            case 'help':
                print(COMMANDS.map(function (c) {
                    return '<span class="c-accent cmd-col">' + c.name + '</span>' + c.desc;
                }).join('<br>') + '<br><span class="c-dim">Tip: start typing a project name to jump to it.</span>', cmd);
                break;
            case 'whoami':
                print('<span class="c-accent">Akash Kumar</span> (0x1Ak4sh)<br>' +
                    'Penetration tester, red teamer and docente di cybersecurity based in Milan, Italy.<br>' +
                    'CPENT &middot; CRTA &middot; PT1 &middot; eJPT<br>' +
                    '<span class="c-dim">Open to pentest, red team, cybersecurity instructor, trainer and tutor roles.</span>', cmd);
                break;
            case 'cv':
            case 'resume.pdf':
                print('Opening CV&hellip; <a class="cmd-link" href="/resume.pdf" target="_blank" rel="noopener">resume.pdf</a>', cmd);
                window.open('/resume.pdf', '_blank', 'noopener');
                break;
            case 'certs':
                print('CPENT &ndash; Certified Penetration Testing Professional (EC-Council)<br>' +
                    'CRTA &ndash; Certified Red Team Analyst (CyberWarFare Labs)<br>' +
                    'PT1 &ndash; Junior Penetration Tester (TryHackMe)<br>' +
                    'eJPT &ndash; Junior Penetration Tester (INE Security)', cmd);
                break;
            case 'docente':
            case 'teaching':
                print('Cybersecurity Instructor (Docente) at <span class="c-accent">ITS Academy D.E.MO.S.</span>, Molise<br>' +
                    '142 hours of training across cybersecurity, AI and cloud, including a 48-hour cybersecurity module.', cmd);
                break;
            case 'about':
            case 'resume':
            case 'projects':
            case 'articles':
            case 'contact':
                print('cd ~/' + name, cmd);
                setTimeout(function () { closeTerminal(); goToSection(name); }, 250);
                break;
            case 'foothold':
                print('Opening Foothold&hellip;', cmd);
                window.location.href = '/projects/foothold/';
                break;
            case 'email':
                copyText(EMAIL).then(function () {
                    print('Copied <span class="c-accent">' + EMAIL + '</span> to clipboard.', cmd);
                });
                break;
            case 'socials':
                print(Object.keys(LINKS).map(function (k) {
                    return '<span class="c-accent cmd-col">' + k + '</span><a class="cmd-link" href="' + LINKS[k] + '" target="_blank" rel="noopener">' + LINKS[k].replace(/^https:\/\/(www\.)?/, '') + '</a>';
                }).join('<br>'), cmd);
                break;
            case 'linkedin': case 'github': case 'x': case 'telegram':
                print('Opening ' + name + '&hellip;', cmd);
                window.open(LINKS[name], '_blank', 'noopener');
                break;
            case 'ls':
                if (arg === 'projects' || arg === 'articles') {
                    print(listContent(arg.slice(0, -1)), cmd);
                } else {
                    print('<span class="c-dim">projects/</span><br>' + listContent('project') +
                        '<br><span class="c-dim">articles/</span><br>' + listContent('article'), cmd);
                }
                break;
            case 'open':
                var item = content().filter(function (it) { return it.slug === arg; })[0];
                if (item) {
                    print('Opening ' + escapeHtml(item.title) + '&hellip;', cmd);
                    window.location.href = item.url;
                } else {
                    print('open: not found: ' + escapeHtml(arg), cmd);
                }
                break;
            case 'sudo':
                print('[sudo] password for recruiter: ********<br><span class="c-accent">Access granted.</span> Opening the contact form&hellip;', cmd);
                setTimeout(function () { closeTerminal(); goToSection('contact'); }, 900);
                break;
            case 'clear':
                out.innerHTML = '';
                break;
            case 'exit':
                closeTerminal();
                break;
            default:
                var m = matches(cmd);
                var hit = m.filter(function (x) { return x.cmd.indexOf('open ') === 0; })[0];
                if (hit) {
                    run(hit.cmd);
                } else {
                    print('command not found: ' + escapeHtml(name) + ' &mdash; type <button type="button" class="cmd-chip" data-run="help">help</button>', cmd);
                }
        }
    }

    // Keyboard shortcut: "/" or Ctrl/Cmd+K (ignored while typing in a field)
    document.addEventListener('keydown', function (e) {
        var tag = (e.target.tagName || '').toLowerCase();
        var typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
        if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (term && term.classList.contains('is-open')) closeTerminal(); else openTerminal();
        } else if (e.key === '/' && !typing) {
            e.preventDefault();
            openTerminal();
        }
    });

    // Open directly from a link: mrakashkumar.in/#terminal
    if (location.hash === '#terminal') {
        history.replaceState(null, '', location.pathname + location.search);
        window.addEventListener('load', function () { setTimeout(openTerminal, 400); });
    }
})();
