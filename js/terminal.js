/**
 * Terminal - 0x1Ak4sh Portfolio
 * In-page terminal: boot sequence, neofetch with the brand logo, commands,
 * matrix effect and games (see terminal-games.js).
 * Public API: window.Term.open(), window.Term.close(), window.Term.isOpen()
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

    // Brand logo, generated from the 0x1Ak4sh mark
    var LOGO = [
        '          ▄▄',
        '         ▄██▄',
        '        ▄████▄',
        '       ▄██████▄',
        '      ▄████████▄',
        '     ▄████▀▀████▄',
        '    ▄████▀  ▀████▄',
        '   ▄████▀    ▀████▄',
        '  ▄████▀      ▀████▄',
        ' ▄████▀ ▄▄▄▄▄▄▄█████▄',
        '▄████▀ ▄█████████████▄',
        '▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀'
    ];
    var LOGO_BIG = [
        '             ▄▄',
        '            ████',
        '           ██████',
        '          ▄██████▄',
        '         ▄████████▄',
        '        ▄██████████▄',
        '       ▄█████▀▀█████▄',
        '      ▄█████▀  ▀█████▄',
        '     ▄█████▀    ▀█████▄',
        '    ▄█████▀      ▀█████▄',
        '   ▄█████▀        ▀█████▄',
        '  ▄█████▀  ▄▄▄▄▄▄▄▄██████▄',
        ' ▄█████▀  ████████████████▄',
        '▄██████  ██████████████████▄',
        '▀▀▀▀▀▀   ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀'
    ];

    var TIPS = [
        'Use a password manager. Reused passwords are the easiest way in.',
        'Turn on MFA everywhere, and prefer an app or a key over SMS.',
        'Check the sender domain, not the display name.',
        'Patch first, panic later. Most incidents start with old, known bugs.',
        'Long passphrases beat short complex passwords.',
        'Least privilege: nobody needs admin rights to read email.',
        'Logs you never read are just expensive storage.',
        'Backups only count if you have tested a restore.',
        'Review who can access your shared folders, then review it again.',
        'If it is on the internet, assume someone is looking at it.'
    ];

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var el = {};
    var st = {
        built: false, booted: false, open: false,
        queue: Promise.resolve(), skip: false,
        history: [], hIdx: -1, picked: false,
        game: null, effect: null, lastFocus: null, scrollY: 0
    };

    // =============================================
    // Helpers
    // =============================================
    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function content() { return window.SITE_CONTENT || []; }
    function wait(ms) {
        return new Promise(function (r) { setTimeout(r, st.skip || reduced ? 0 : ms); });
    }
    function chip(cmd, label) {
        return '<button type="button" class="cmd-chip" data-run="' + esc(cmd) + '">' + esc(label || cmd) + '</button>';
    }
    function chips(list) {
        return '<span class="cmd-chips">' + list.map(function (c) { return chip(c); }).join('') + '</span>';
    }
    function scrollDown() { el.screen.scrollTop = el.screen.scrollHeight; }
    function promptHtml() {
        return '<span class="c-prompt"><span class="p-user">akash@0x1ak4sh:</span>~$</span>';
    }

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

    function goToSection(name) {
        close();
        var link = document.querySelector('.top-menu a[href="#' + name + '"]');
        if (link) setTimeout(function () { link.click(); }, 50);
    }

    function findItem(q) {
        q = String(q || '').toLowerCase().trim();
        if (!q) return null;
        var list = content();
        for (var i = 0; i < list.length; i++) if (list[i].slug === q) return list[i];
        for (var j = 0; j < list.length; j++) if (list[j].title.toLowerCase().indexOf(q) !== -1) return list[j];
        return null;
    }

    // =============================================
    // Output (queued so animations never overlap)
    // =============================================
    function enqueue(fn) {
        st.queue = st.queue.then(fn).catch(function () { /* keep the queue alive */ });
        return st.queue;
    }

    function echo(cmd) {
        el.out.insertAdjacentHTML('beforeend',
            '<div class="cmd-echo">' + promptHtml() + ' ' + esc(cmd) + '</div>');
        scrollDown();
    }

    // Prints lines one by one (instant with reduced motion or after a skip key).
    function print(lines, opts) {
        opts = opts || {};
        if (!Array.isArray(lines)) lines = [lines];
        return enqueue(function () {
            var box = document.createElement('div');
            box.className = 'cmd-res' + (opts.cls ? ' ' + opts.cls : '');
            el.out.appendChild(box);
            var i = 0;
            function next() {
                if (i >= lines.length) return Promise.resolve(box);
                var line = document.createElement('div');
                line.className = 'cmd-l';
                line.innerHTML = lines[i++] || '&nbsp;';
                box.appendChild(line);
                scrollDown();
                return wait(opts.delay === undefined ? 22 : opts.delay).then(next);
            }
            return next();
        });
    }

    // Types plain text character by character into a new line.
    function type(text, cls, speed) {
        return enqueue(function () {
            var line = document.createElement('div');
            line.className = 'cmd-res cmd-l' + (cls ? ' ' + cls : '');
            el.out.appendChild(line);
            var i = 0;
            return new Promise(function (resolve) {
                (function step() {
                    if (st.skip || reduced) { line.textContent = text; scrollDown(); return resolve(line); }
                    line.textContent = text.slice(0, ++i);
                    scrollDown();
                    if (i >= text.length) return resolve(line);
                    setTimeout(step, speed || 18);
                })();
            });
        });
    }

    function busy(flag) {
        el.win.classList.toggle('is-busy', flag);
        if (!flag) st.skip = false;
    }

    // =============================================
    // Build
    // =============================================
    function build() {
        el.overlay = document.createElement('div');
        el.overlay.className = 'cmd-overlay';
        el.overlay.setAttribute('role', 'dialog');
        el.overlay.setAttribute('aria-modal', 'true');
        el.overlay.setAttribute('aria-label', 'Terminal');
        el.overlay.innerHTML =
            '<div class="cmd-window">' +
            '  <div class="cmd-bar">' +
            '    <span class="cmd-dots"><button type="button" class="cmd-dot-close" aria-label="Close terminal"></button><i></i><i></i></span>' +
            '    <span class="cmd-title">akash@0x1ak4sh: ~</span>' +
            '    <button type="button" class="cmd-close" aria-label="Close terminal">&times;</button>' +
            '  </div>' +
            '  <div class="cmd-screen">' +
            '    <div class="cmd-out" aria-live="polite"></div>' +
            '    <form class="cmd-line" autocomplete="off">' +
            '      <label class="cmd-prompt" for="cmd-input">' + promptHtml() + '</label>' +
            '      <input id="cmd-input" class="cmd-input" type="text" spellcheck="false" autocapitalize="off" autocorrect="off" enterkeyhint="go" placeholder="type help" aria-label="Terminal command">' +
            '    </form>' +
            '  </div>' +
            '  <ul class="cmd-sugg" role="listbox" aria-label="Suggestions"></ul>' +
            '</div>';
        document.body.appendChild(el.overlay);

        el.win = el.overlay.querySelector('.cmd-window');
        el.screen = el.overlay.querySelector('.cmd-screen');
        el.out = el.overlay.querySelector('.cmd-out');
        el.form = el.overlay.querySelector('.cmd-line');
        el.input = el.overlay.querySelector('.cmd-input');
        el.sugg = el.overlay.querySelector('.cmd-sugg');

        // Backdrop closes only for a click that starts and ends on it, and not
        // while the window is still animating open
        var downOnBackdrop = false;
        el.overlay.addEventListener('pointerdown', function (e) { downOnBackdrop = e.target === el.overlay; });
        el.overlay.addEventListener('click', function (e) {
            if (e.target.closest('.cmd-close, .cmd-dot-close')) { close(); return; }
            if (e.target === el.overlay) {
                if (downOnBackdrop && Date.now() - st.openedAt > 600) close();
                return;
            }
            var item = e.target.closest('.cmd-sugg li');
            if (item) { submit(item.getAttribute('data-cmd')); return; }
            var c = e.target.closest('[data-run]');
            if (c) { submit(c.getAttribute('data-run')); return; }
            // Tapping the screen focuses the prompt (not while selecting text or playing)
            if (e.target.closest('.cmd-screen') && !e.target.closest('a, button') && !st.game &&
                !(window.getSelection && String(window.getSelection()))) {
                el.input.focus({ preventScroll: true });
            }
        });

        el.form.addEventListener('submit', function (e) {
            e.preventDefault();
            var active = el.sugg.querySelector('li.is-active');
            // Enter runs what was typed; a suggestion only wins when picked with arrows/Tab
            submit(st.picked && active ? active.getAttribute('data-cmd') : el.input.value);
        });
        el.input.addEventListener('input', function () { st.picked = false; renderSuggestions(); });
        el.input.addEventListener('keydown', onKey);

        // Any key or tap during an animation fast-forwards it
        el.overlay.addEventListener('keydown', function () {
            if (el.win.classList.contains('is-busy')) st.skip = true;
        }, true);
        el.screen.addEventListener('pointerdown', function () {
            if (el.win.classList.contains('is-busy')) st.skip = true;
        });

        st.built = true;
    }

    // =============================================
    // Open / close (the page underneath stays put, also on iOS)
    // =============================================
    function lockPage(lock) {
        var b = document.body;
        if (lock) {
            st.scrollY = window.scrollY || window.pageYOffset || 0;
            document.documentElement.classList.add('cmd-lock');
            b.style.top = -st.scrollY + 'px';
        } else {
            document.documentElement.classList.remove('cmd-lock');
            b.style.top = '';
            window.scrollTo(0, st.scrollY);
        }
    }

    function open() {
        if (!st.built) build();
        if (st.open) { if (!st.game) el.input.focus({ preventScroll: true }); return; }
        st.open = true;
        st.openedAt = Date.now();
        st.lastFocus = document.activeElement;
        lockPage(true);
        el.overlay.classList.add('is-open');
        setTimeout(function () { if (!st.game) el.input.focus({ preventScroll: true }); }, 40);
        if (!st.booted) { st.booted = true; boot(); }
    }

    function close() {
        if (!st.open) return;
        stopGame();
        stopEffect();
        st.open = false;
        el.overlay.classList.remove('is-open');
        el.sugg.innerHTML = '';
        lockPage(false);
        if (st.lastFocus && st.lastFocus.focus) st.lastFocus.focus({ preventScroll: true });
    }

    // =============================================
    // Boot + neofetch
    // =============================================
    function boot() {
        busy(true);
        var ok = '[ <span class="c-ok">OK</span> ] ';
        print([
            ok + 'Booting <span class="c-accent">0x1sh</span> v1.0 on mrakashkumar.in',
            ok + 'Mounted /home/akash',
            ok + 'Loaded certifications: CPENT CRTA PT1 eJPT',
            ok + 'Started pentest.service',
            ok + 'Started docente.service',
            ok + 'Reached target: Milan, Italy'
        ], { delay: 90, cls: 'cmd-boot' });
        enqueue(function () { return wait(150); });
        neofetch();
        print(['Type <span class="c-accent">help</span> or tap a command: ' +
            chips(['whoami', 'cv', 'certs', 'snake', 'tetris', 'matrix', 'help'])]);
        enqueue(function () { busy(false); });
    }

    function neofetch() {
        var info = [
            '<span class="c-accent">akash</span>@<span class="c-accent">0x1ak4sh</span>',
            '<span class="c-dim">---------------</span>',
            '<span class="c-key">Role</span> Penetration Tester, Red Teamer',
            '<span class="c-key">Teaching</span> Docente di Cybersecurity',
            '<span class="c-key">Host</span> ITS Academy D.E.MO.S.',
            '<span class="c-key">Study</span> Università degli Studi di Milano',
            '<span class="c-key">Location</span> Milan, Italy',
            '<span class="c-key">Certs</span> CPENT, CRTA, PT1, eJPT',
            '<span class="c-key">Uptime</span> learning since 2018',
            '<span class="c-key">Shell</span> 0x1sh 1.0',
            '<span class="c-key">Open to</span> Pentest, Red Team, Instructor, Trainer, Tutor',
            '<span class="cmd-swatch"><i></i><i></i><i></i><i></i><i></i><i></i></span>'
        ];
        return enqueue(function () {
            var box = document.createElement('div');
            box.className = 'cmd-res cmd-fetch';
            box.innerHTML = '<pre class="cmd-logo" aria-label="0x1Ak4sh logo"></pre><div class="cmd-info"></div>';
            el.out.appendChild(box);
            var logo = box.querySelector('.cmd-logo'), inf = box.querySelector('.cmd-info');
            var n = Math.max(LOGO.length, info.length), i = 0;
            function step() {
                if (i >= n) return Promise.resolve();
                if (i < LOGO.length) logo.textContent += (i ? '\n' : '') + LOGO[i];
                if (i < info.length) inf.insertAdjacentHTML('beforeend', '<div class="cmd-l">' + info[i] + '</div>');
                i++;
                scrollDown();
                return wait(45).then(step);
            }
            return step();
        });
    }

    // Big logo drawn line by line with a glow sweep
    function banner() {
        busy(true);
        print(LOGO_BIG.map(function (l) { return '<span class="cmd-big">' + esc(l) + '</span>'; }), { delay: 55, cls: 'cmd-banner' });
        type('0x1Ak4sh · Akash Kumar · Penetration Tester & Docente di Cybersecurity', 'c-accent', 14);
        enqueue(function () { busy(false); });
    }

    // =============================================
    // Matrix rain over the terminal screen; any key or tap ends it
    // =============================================
    function stopEffect() {
        if (st.effect) { st.effect(); st.effect = null; }
    }

    function matrix() {
        return enqueue(function () {
            return new Promise(function (resolve) {
                if (reduced) return resolve();
                var cv = document.createElement('canvas');
                cv.className = 'cmd-matrix';
                el.win.appendChild(cv);
                var r = el.screen.getBoundingClientRect(), wr = el.win.getBoundingClientRect();
                var dpr = Math.min(window.devicePixelRatio || 1, 2);
                cv.style.top = (r.top - wr.top) + 'px';
                cv.style.height = r.height + 'px';
                cv.width = Math.round(r.width * dpr);
                cv.height = Math.round(r.height * dpr);
                var ctx = cv.getContext('2d');
                ctx.scale(dpr, dpr);
                var fs = 14, cols = Math.ceil(r.width / fs), drops = [];
                for (var i = 0; i < cols; i++) drops[i] = Math.random() * -30;
                var chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789ABCDEF';
                var raf, last = 0, done = false, timer;
                function frame(t) {
                    if (t - last > 45) {
                        last = t;
                        ctx.fillStyle = 'rgba(11,17,21,0.18)';
                        ctx.fillRect(0, 0, r.width, r.height);
                        ctx.font = fs + 'px monospace';
                        for (var c = 0; c < cols; c++) {
                            var y = drops[c] * fs;
                            ctx.fillStyle = Math.random() > 0.96 ? '#ffffff' : '#a4ff91';
                            ctx.fillText(chars[Math.floor(Math.random() * chars.length)], c * fs, y);
                            if (y > r.height && Math.random() > 0.975) drops[c] = 0;
                            drops[c]++;
                        }
                    }
                    raf = requestAnimationFrame(frame);
                }
                function end() {
                    if (done) return;
                    done = true;
                    cancelAnimationFrame(raf);
                    clearTimeout(timer);
                    window.removeEventListener('keydown', onAny, true);
                    cv.classList.add('is-out');
                    setTimeout(function () { cv.remove(); }, 300);
                    st.effect = null;
                    resolve();
                }
                function onAny(e) { e.preventDefault(); e.stopPropagation(); end(); }
                raf = requestAnimationFrame(frame);
                timer = setTimeout(end, 9000);
                window.addEventListener('keydown', onAny, true);
                cv.addEventListener('pointerdown', end);
                st.effect = end;
            });
        }).then(function () {
            return print(['<span class="c-dim">Wake up, recruiter&hellip; follow the white rabbit to the</span> ' + chip('contact')]);
        });
    }

    // Shakes the window (used for "rm -rf" jokes)
    function shake() {
        if (reduced) return;
        el.win.classList.remove('is-shake');
        void el.win.offsetWidth;
        el.win.classList.add('is-shake');
    }

    // =============================================
    // Games
    // =============================================
    function startGame(name) {
        if (!window.TermGames || !window.TermGames[name]) {
            print('Games are still loading, try again in a second.');
            return;
        }
        enqueue(function () {
            return new Promise(function (resolve) {
                var host = document.createElement('div');
                host.className = 'cmd-res cmd-game';
                el.out.appendChild(host);
                el.win.classList.add('is-playing');
                el.input.blur();
                scrollDown();
                st.game = window.TermGames[name](host, {
                    onExit: function (summary) {
                        st.game = null;
                        el.win.classList.remove('is-playing');
                        host.remove();
                        print(summary).then(function () {
                            if (st.open) el.input.focus({ preventScroll: true });
                        });
                        resolve();
                    }
                });
                setTimeout(scrollDown, 30);
            });
        });
    }

    function stopGame() {
        if (st.game) { st.game.destroy(); st.game = null; el.win.classList.remove('is-playing'); }
    }

    // =============================================
    // Commands
    // =============================================
    function projectCard(it) {
        return [
            '<span class="c-accent">' + esc(it.title) + '</span> <span class="c-dim">(' + esc(it.type) + ')</span>',
            esc(it.description),
            '<span class="c-dim">' + (it.tags || []).map(function (t) { return '#' + esc(t); }).join(' ') + '</span>',
            '<a class="cmd-link" href="' + it.url + '">Open ' + esc(it.type) + ' &rarr;</a>'
        ];
    }

    function listItems(type) {
        return content().filter(function (it) { return !type || it.type === type; }).map(function (it) {
            return chip('info ' + it.slug, it.title);
        });
    }

    var COMMANDS = {
        help: { group: 'info', desc: 'list commands', run: function () {
            var groups = { info: 'About me', go: 'Navigate', fun: 'Fun', sys: 'Shell' }, lines = [];
            Object.keys(groups).forEach(function (g) {
                lines.push('<span class="c-dim">' + groups[g] + '</span>');
                Object.keys(COMMANDS).forEach(function (k) {
                    var c = COMMANDS[k];
                    if (c.group === g && !c.hidden) lines.push(chip(k) + ' <span class="cmd-desc">' + c.desc + '</span>');
                });
            });
            lines.push('<span class="c-dim">Tip: start typing a project name, use Tab/arrows to pick, Enter to run.</span>');
            print(lines, { delay: 12 });
        } },
        whoami: { group: 'info', desc: 'who is Akash', run: function () {
            type('Akash Kumar (0x1Ak4sh)', 'c-accent', 22);
            print(['Penetration tester, red teamer and docente di cybersecurity based in Milan, Italy.',
                'CPENT · CRTA · PT1 · eJPT',
                '<span class="c-dim">Open to pentest, red team, cybersecurity instructor, trainer and tutor roles.</span>']);
        } },
        neofetch: { group: 'info', desc: 'system info, with my logo', run: function () { neofetch(); } },
        certs: { group: 'info', desc: 'my certifications', run: function () {
            print(['<span class="c-accent">CPENT</span>  Certified Penetration Testing Professional · EC-Council',
                '<span class="c-accent">CRTA</span>   Certified Red Team Analyst · CyberWarFare Labs',
                '<span class="c-accent">PT1</span>    Junior Penetration Tester · TryHackMe',
                '<span class="c-accent">eJPT</span>   Junior Penetration Tester · INE Security'], { delay: 60 });
        } },
        docente: { group: 'info', desc: 'what I teach', run: function () {
            print(['Cybersecurity Instructor (Docente) at <span class="c-accent">ITS Academy D.E.MO.S.</span>, Molise',
                '142 hours of training across cybersecurity, AI and cloud,',
                'including a 48-hour cybersecurity module: recon, Linux, Wi-Fi, web vulnerabilities, GRC.']);
        } },
        cv: { group: 'go', desc: 'download my CV', run: function () {
            print('Opening <a class="cmd-link" href="/resume.pdf" target="_blank" rel="noopener">resume.pdf</a>&hellip;');
            window.open('/resume.pdf', '_blank', 'noopener');
        } },
        about: { group: 'go', desc: 'go to about', run: function () { goToSection('about'); } },
        resume: { group: 'go', desc: 'go to resume', run: function () { goToSection('resume'); } },
        projects: { group: 'go', desc: 'go to projects', run: function () { goToSection('projects'); } },
        articles: { group: 'go', desc: 'go to articles', run: function () { goToSection('articles'); } },
        contact: { group: 'go', desc: 'go to contact form', run: function () { goToSection('contact'); } },
        ls: { group: 'go', desc: 'list projects and articles', run: function (arg) {
            if (arg === 'projects' || arg === 'articles') {
                print([listItems(arg.slice(0, -1)).join(' ')]);
            } else if (arg) {
                print('ls: cannot access \'' + esc(arg) + '\': try ' + chip('ls projects') + ' or ' + chip('ls articles'));
            } else {
                print(['<span class="c-dim">projects/</span>', listItems('project').join(' '),
                    '<span class="c-dim">articles/</span>', listItems('article').join(' '),
                    '<span class="c-dim">files:</span> about.txt  certs.txt  cv.pdf']);
            }
        } },
        info: { group: 'go', desc: 'details of a project', hidden: true, run: function (arg) {
            var it = findItem(arg);
            if (it) print(projectCard(it));
            else print('info: not found: ' + esc(arg) + '. Try ' + chip('ls'));
        } },
        open: { group: 'go', desc: 'open a project page', hidden: true, run: function (arg) {
            var it = findItem(arg);
            if (it) {
                print('Opening ' + esc(it.title) + '&hellip;');
                setTimeout(function () { window.location.href = it.url; }, 400);
            } else {
                print('open: not found: ' + esc(arg) + '. Try ' + chip('ls'));
            }
        } },
        foothold: { group: 'go', desc: '213 HackTheBox machines', run: function () {
            var it = findItem('foothold');
            if (it) print(projectCard(it));
        } },
        email: { group: 'go', desc: 'copy my email', run: function () {
            copyText(EMAIL).then(function () {
                print('Copied <span class="c-accent">' + EMAIL + '</span> to clipboard.');
            });
        } },
        socials: { group: 'go', desc: 'linkedin, github, x, telegram', run: function () {
            print(Object.keys(LINKS).map(function (k) {
                return '<span class="c-accent cmd-col">' + k + '</span><a class="cmd-link" href="' + LINKS[k] +
                    '" target="_blank" rel="noopener">' + LINKS[k].replace(/^https:\/\/(www\.)?/, '') + '</a>';
            }), { delay: 50 });
        } },
        snake: { group: 'fun', desc: 'play snake', run: function () { startGame('snake'); } },
        tetris: { group: 'fun', desc: 'play tetris', run: function () { startGame('tetris'); } },
        matrix: { group: 'fun', desc: 'enter the matrix', run: function () { matrix(); } },
        banner: { group: 'fun', desc: 'my logo, big', run: function () { banner(); } },
        fortune: { group: 'fun', desc: 'a random security tip', run: function () {
            type('> ' + TIPS[Math.floor(Math.random() * TIPS.length)], 'c-tip', 16);
        } },
        sudo: { group: 'fun', desc: 'try: sudo hire-me', run: function (arg) {
            if (/^hire/.test(arg)) {
                print(['[sudo] password for recruiter: ********', '<span class="c-accent">Access granted.</span> Opening the contact form&hellip;'], { delay: 300 });
                enqueue(function () { return wait(500); }).then(function () { goToSection('contact'); });
            } else if (/rm\s+-rf/.test(arg)) {
                shake();
                print('<span class="c-err">Permission denied.</span> Nice try. This incident will be reported to Akash.');
            } else {
                print('<span class="c-err">akash is not in the sudoers file.</span> Try ' + chip('sudo hire-me'));
            }
        } },
        date: { group: 'sys', desc: 'current date', run: function () { print(esc(new Date().toString())); } },
        echo: { group: 'sys', desc: 'print text', run: function (arg, raw) { print(esc(raw.replace(/^echo\s*/i, '')) || '&nbsp;'); } },
        pwd: { group: 'sys', desc: 'where am I', run: function () { print('/home/akash'); } },
        cat: { group: 'sys', desc: 'read a file', hidden: true, run: function (arg) {
            if (arg === 'about.txt') COMMANDS.whoami.run('');
            else if (arg === 'certs.txt') COMMANDS.certs.run('');
            else if (arg === 'cv.pdf') print('cat: cv.pdf is a binary file. Try ' + chip('cv'));
            else print('cat: ' + esc(arg || '') + ': No such file. Try ' + chip('ls'));
        } },
        cd: { group: 'sys', desc: 'change section', hidden: true, run: function (arg) {
            var a = (arg || '').replace(/^~?\/?/, '').replace(/\/$/, '');
            if (['about', 'resume', 'projects', 'articles', 'contact'].indexOf(a) !== -1) goToSection(a);
            else if (!a || a === '~') print('/home/akash');
            else print('cd: no such directory: ' + esc(arg));
        } },
        history: { group: 'sys', desc: 'commands you ran', run: function () {
            print(st.history.slice(1).reverse().map(function (h, i) { return (i + 1) + '  ' + esc(h); }).concat(st.history.length < 2 ? ['(empty)'] : []));
        } },
        clear: { group: 'sys', desc: 'clear the screen', run: function () {
            enqueue(function () { el.out.innerHTML = ''; });
        } },
        exit: { group: 'sys', desc: 'close the terminal', run: function () { close(); } }
    };
    var ALIASES = { '?': 'help', fetch: 'neofetch', 'resume.pdf': 'cv', game: 'snake', games: 'help', quit: 'exit', cls: 'clear', man: 'help', tip: 'fortune' };

    function submit(raw) {
        var cmd = String(raw || '').trim();
        el.input.value = '';
        el.sugg.innerHTML = '';
        st.picked = false;
        if (st.game) return;
        echo(cmd);
        if (!cmd) return;
        if (st.history[0] !== cmd) st.history.unshift(cmd);
        st.hIdx = -1;

        var parts = cmd.split(/\s+/);
        var name = parts[0].toLowerCase();
        var arg = parts.slice(1).join(' ').toLowerCase();
        name = ALIASES[name] || name;

        if (/^rm$/.test(name) && /-rf/.test(arg)) { COMMANDS.sudo.run('rm -rf'); return; }
        var c = COMMANDS[name];
        if (c) { c.run(arg, cmd); return; }

        var it = findItem(cmd);
        if (it) {
            print('command not found: ' + esc(name) + '. Did you mean ' + chip('info ' + it.slug, it.title) + '?');
        } else {
            print('command not found: ' + esc(name) + '. Type ' + chip('help'));
        }
    }

    // =============================================
    // Suggestions + keys
    // =============================================
    function matches(q) {
        q = q.toLowerCase().trim();
        if (!q) return [];
        var res = [];
        Object.keys(COMMANDS).forEach(function (k) {
            if (!COMMANDS[k].hidden && k.indexOf(q) === 0) res.push({ cmd: k, label: k, hint: COMMANDS[k].desc });
        });
        content().forEach(function (it) {
            var hay = (it.title + ' ' + (it.tags || []).join(' ')).toLowerCase();
            if (q.length > 1 && hay.indexOf(q) !== -1) res.push({ cmd: 'info ' + it.slug, label: it.title, hint: it.type });
        });
        return res.slice(0, 6);
    }

    function renderSuggestions() {
        var list = matches(el.input.value);
        el.sugg.innerHTML = list.map(function (m) {
            return '<li role="option" data-cmd="' + esc(m.cmd) + '"><span>' + esc(m.label) + '</span><em>' + esc(m.hint) + '</em></li>';
        }).join('');
    }

    function onKey(e) {
        var items = el.sugg.querySelectorAll('li');
        var active = el.sugg.querySelector('li.is-active');
        var idx = Array.prototype.indexOf.call(items, active);

        if (e.key === 'Escape') {
            if (items.length) { el.sugg.innerHTML = ''; } else { close(); }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (!items.length) return;
            if (active) active.classList.remove('is-active');
            idx = (idx + 1) % items.length;
            items[idx].classList.add('is-active');
            st.picked = true;
        } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && items.length) {
            e.preventDefault();
            if (active) active.classList.remove('is-active');
            idx = e.key === 'ArrowDown' ? (idx + 1) % items.length : (idx <= 0 ? items.length - 1 : idx - 1);
            items[idx].classList.add('is-active');
            st.picked = true;
        } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && st.history.length) {
            e.preventDefault();
            st.hIdx = e.key === 'ArrowUp' ? Math.min(st.hIdx + 1, st.history.length - 1) : Math.max(st.hIdx - 1, -1);
            el.input.value = st.hIdx >= 0 ? st.history[st.hIdx] : '';
        } else if ((e.key === 'l' || e.key === 'L') && e.ctrlKey) {
            e.preventDefault();
            COMMANDS.clear.run();
        }
    }

    window.Term = {
        open: open,
        close: close,
        toggle: function () { if (st.open) close(); else open(); },
        isOpen: function () { return st.open; }
    };
})();
