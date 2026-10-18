/**
 * Terminal Games - 0x1Ak4sh Portfolio
 * Snake and Tetris for the in-page terminal. Each game renders into a host
 * element, handles keyboard + touch, and calls api.onExit(summaryHtml).
 */
(function () {
    'use strict';

    var ACCENT = '#a4ff91', BG = '#0b1115', GRID = 'rgba(255,255,255,0.04)', TEXT = 'rgba(255,255,255,0.85)';

    function getBest(key) {
        try { return parseInt(localStorage.getItem(key), 10) || 0; } catch (e) { return 0; }
    }
    function setBest(key, v) {
        try { localStorage.setItem(key, String(v)); } catch (e) { /* storage blocked */ }
    }

    // Shared shell: HUD, canvas, touch buttons, keyboard capture, swipe.
    function shell(host, opts) {
        host.innerHTML =
            '<div class="g-hud"><span class="g-title">' + opts.title + '</span><span class="g-stats"></span></div>' +
            '<div class="g-stage"><canvas class="g-canvas"></canvas><div class="g-msg" hidden></div></div>' +
            '<div class="g-pad' + (opts.padClass ? ' ' + opts.padClass : '') + '">' + opts.buttons.map(function (b) {
                return '<button type="button" class="g-btn" data-act="' + b[0] + '" aria-label="' + b[2] + '">' + b[1] + '</button>';
            }).join('') + '</div>' +
            '<div class="g-help">' + opts.help + '</div>';
        var cv = host.querySelector('canvas');
        var ctx = cv.getContext('2d');
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var s = {
            host: host, cv: cv, ctx: ctx,
            stats: host.querySelector('.g-stats'),
            msg: host.querySelector('.g-msg'),
            size: function (w, h) {
                cv.width = Math.round(w * dpr);
                cv.height = Math.round(h * dpr);
                cv.style.width = w + 'px';
                cv.style.height = h + 'px';
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            },
            message: function (html) {
                if (html) { s.msg.innerHTML = html; s.msg.hidden = false; } else { s.msg.hidden = true; }
            }
        };

        function onKey(e) {
            var act = opts.keys[e.key] || opts.keys[e.key.toLowerCase()];
            if (e.key === 'Escape') act = 'quit';
            if (!act) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            opts.onAction(act);
        }
        window.addEventListener('keydown', onKey, true);

        // Buttons react on pointerdown for snappy touch; hold to repeat moves
        var repeat;
        host.querySelector('.g-pad').addEventListener('pointerdown', function (e) {
            var b = e.target.closest('.g-btn');
            if (!b) return;
            e.preventDefault();
            var act = b.getAttribute('data-act');
            opts.onAction(act);
            if (opts.repeatable && opts.repeatable.indexOf(act) !== -1) {
                clearInterval(repeat);
                var t0 = setTimeout(function () { repeat = setInterval(function () { opts.onAction(act); }, 70); }, 220);
                var stop = function () { clearTimeout(t0); clearInterval(repeat); window.removeEventListener('pointerup', stop); window.removeEventListener('pointercancel', stop); };
                window.addEventListener('pointerup', stop);
                window.addEventListener('pointercancel', stop);
            }
        });

        // Swipes and taps on the canvas
        var sx = 0, sy = 0, st0 = 0;
        cv.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; st0 = Date.now(); });
        cv.addEventListener('pointerup', function (e) {
            var dx = e.clientX - sx, dy = e.clientY - sy, ad = Math.max(Math.abs(dx), Math.abs(dy));
            if (ad < 18 && Date.now() - st0 < 300) { opts.onAction('tap'); return; }
            if (ad < 24) return;
            if (Math.abs(dx) > Math.abs(dy)) opts.onAction(dx > 0 ? 'right' : 'left');
            else opts.onAction(dy > 0 ? 'swipedown' : 'up');
        });

        s.destroy = function () {
            window.removeEventListener('keydown', onKey, true);
            clearInterval(repeat);
        };
        return s;
    }

    function availWidth(host) {
        return Math.max(220, Math.min(host.clientWidth || 300, 560));
    }

    // =============================================
    // Snake
    // =============================================
    function snake(host, api) {
        var BEST = '0x1sh-snake-best';
        var narrow = availWidth(host) < 420;
        var COLS = narrow ? 16 : 22, ROWS = narrow ? 16 : 15;
        var cell = Math.floor(Math.min(availWidth(host) / COLS, (window.innerHeight * 0.42) / ROWS));
        cell = Math.max(12, Math.min(cell, 22));
        var W = COLS * cell, H = ROWS * cell;
        var g, raf, last = 0, alive = true;

        var sh = shell(host, {
            title: 'SNAKE',
            help: '<kbd>&larr;</kbd><kbd>&uarr;</kbd><kbd>&darr;</kbd><kbd>&rarr;</kbd> or WASD &middot; <kbd>P</kbd> pause &middot; <kbd>Esc</kbd> quit &middot; swipe on phones',
            padClass: 'g-dpad',
            buttons: [['up', '&#9650;', 'Up'], ['left', '&#9664;', 'Left'], ['down', '&#9660;', 'Down'], ['right', '&#9654;', 'Right'], ['pause', '&#10074;&#10074;', 'Pause'], ['quit', '&times;', 'Quit']],
            keys: { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', p: 'pause', ' ': 'pause', r: 'restart', q: 'quit' },
            onAction: action
        });
        sh.size(W, H);

        function reset() {
            var mx = Math.floor(COLS / 2), my = Math.floor(ROWS / 2);
            g = { body: [[mx, my], [mx - 1, my], [mx - 2, my]], dir: [1, 0], queue: [], food: null, score: 0, speed: 130, over: false, paused: false, ready: false, best: getBest(BEST) };
            placeFood();
            sh.message('SNAKE<small>press an arrow key, swipe or tap to start</small>');
            hud();
        }
        function placeFood() {
            var free = [];
            for (var x = 0; x < COLS; x++) for (var y = 0; y < ROWS; y++) {
                if (!g.body.some(function (p) { return p[0] === x && p[1] === y; })) free.push([x, y]);
            }
            g.food = free[Math.floor(Math.random() * free.length)];
        }
        function hud() {
            sh.stats.innerHTML = 'score <b>' + g.score + '</b> &middot; best <b>' + Math.max(g.best, g.score) + '</b>';
        }
        function turn(dx, dy) {
            var lastDir = g.queue.length ? g.queue[g.queue.length - 1] : g.dir;
            if (lastDir[0] === -dx && lastDir[1] === -dy) return;
            if (lastDir[0] === dx && lastDir[1] === dy) return;
            if (g.queue.length < 3) g.queue.push([dx, dy]);
        }
        function action(a) {
            if (a === 'quit') return finish();
            if (g.over) { if (a === 'restart' || a === 'tap' || a === 'pause') reset(); return; }
            if (!g.ready) {
                g.ready = true;
                sh.message('');
                if (a === 'up') g.dir = [0, -1];
                else if (a === 'down' || a === 'swipedown') g.dir = [0, 1];
                return;
            }
            if (a === 'pause' || a === 'tap') { g.paused = !g.paused; sh.message(g.paused ? 'PAUSED<small>tap or press P to resume</small>' : ''); return; }
            if (g.paused) return;
            if (a === 'left') turn(-1, 0);
            else if (a === 'right') turn(1, 0);
            else if (a === 'up') turn(0, -1);
            else if (a === 'down' || a === 'swipedown') turn(0, 1);
        }
        function step() {
            if (g.queue.length) g.dir = g.queue.shift();
            var h = g.body[0], nx = h[0] + g.dir[0], ny = h[1] + g.dir[1];
            var hitWall = nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS;
            var grow = g.food && nx === g.food[0] && ny === g.food[1];
            var bodyCheck = grow ? g.body : g.body.slice(0, -1);
            var hitSelf = bodyCheck.some(function (p) { return p[0] === nx && p[1] === ny; });
            if (hitWall || hitSelf) {
                g.over = true;
                if (g.score > g.best) { g.best = g.score; setBest(BEST, g.score); }
                hud();
                sh.message('GAME OVER<small>score ' + g.score + ' &middot; tap, R or P to play again &middot; Esc to quit</small>');
                return;
            }
            g.body.unshift([nx, ny]);
            if (grow) {
                g.score++;
                g.speed = Math.max(60, 130 - g.score * 3);
                if (g.body.length >= COLS * ROWS) { g.over = true; sh.message('YOU WIN<small>Esc to quit</small>'); return; }
                placeFood();
                hud();
            } else {
                g.body.pop();
            }
        }
        function draw(t) {
            var c = sh.ctx;
            c.fillStyle = BG;
            c.fillRect(0, 0, W, H);
            c.strokeStyle = GRID;
            c.lineWidth = 1;
            for (var x = 1; x < COLS; x++) { c.beginPath(); c.moveTo(x * cell + 0.5, 0); c.lineTo(x * cell + 0.5, H); c.stroke(); }
            for (var y = 1; y < ROWS; y++) { c.beginPath(); c.moveTo(0, y * cell + 0.5); c.lineTo(W, y * cell + 0.5); c.stroke(); }
            if (g.food) {
                var pulse = 0.75 + 0.25 * Math.sin(t / 160);
                c.fillStyle = '#ff5f57';
                c.shadowColor = '#ff5f57';
                c.shadowBlur = 10 * pulse;
                var fp = cell * (1 - 0.6 * pulse) / 2;
                c.fillRect(g.food[0] * cell + fp, g.food[1] * cell + fp, cell - 2 * fp, cell - 2 * fp);
                c.shadowBlur = 0;
            }
            g.body.forEach(function (p, i) {
                c.fillStyle = i === 0 ? '#e8ffe2' : ACCENT;
                c.globalAlpha = i === 0 ? 1 : Math.max(0.45, 1 - i / (g.body.length + 6));
                c.fillRect(p[0] * cell + 1, p[1] * cell + 1, cell - 2, cell - 2);
            });
            c.globalAlpha = 1;
        }
        function loop(t) {
            if (!alive) return;
            if (g.ready && !g.over && !g.paused && t - last >= g.speed) { last = t; step(); }
            draw(t);
            raf = requestAnimationFrame(loop);
        }
        function finish() {
            if (!alive) return;
            destroy();
            api.onExit('snake: score <span class="c-accent">' + g.score + '</span> &middot; best ' + Math.max(g.best, g.score) +
                ' &middot; <button type="button" class="cmd-chip" data-run="snake">play again</button>');
        }
        function destroy() {
            alive = false;
            cancelAnimationFrame(raf);
            sh.destroy();
        }

        reset();
        raf = requestAnimationFrame(loop);
        return { destroy: destroy };
    }

    // =============================================
    // Tetris
    // =============================================
    var SHAPES = {
        I: { c: '#7fdbff', m: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]] },
        O: { c: '#ffe066', m: [[1, 1], [1, 1]] },
        T: { c: '#c792ea', m: [[0, 1, 0], [1, 1, 1], [0, 0, 0]] },
        S: { c: ACCENT, m: [[0, 1, 1], [1, 1, 0], [0, 0, 0]] },
        Z: { c: '#ff6b6b', m: [[1, 1, 0], [0, 1, 1], [0, 0, 0]] },
        J: { c: '#5c9dff', m: [[1, 0, 0], [1, 1, 1], [0, 0, 0]] },
        L: { c: '#ffa94d', m: [[0, 0, 1], [1, 1, 1], [0, 0, 0]] }
    };

    function tetris(host, api) {
        var BEST = '0x1sh-tetris-best';
        var COLS = 10, ROWS = 20, SIDE = 5;
        var cell = Math.floor(Math.min(availWidth(host) / (COLS + SIDE), (window.innerHeight * 0.46) / ROWS));
        cell = Math.max(11, Math.min(cell, 22));
        var W = (COLS + SIDE) * cell, H = ROWS * cell;
        var g, raf, last = 0, alive = true, bag = [];

        var sh = shell(host, {
            title: 'TETRIS',
            help: '<kbd>&larr;</kbd><kbd>&rarr;</kbd> move &middot; <kbd>&uarr;</kbd> rotate &middot; <kbd>&darr;</kbd> soft drop &middot; <kbd>Space</kbd> hard drop &middot; <kbd>P</kbd> pause &middot; <kbd>Esc</kbd> quit',
            buttons: [['left', '&#9664;', 'Move left'], ['rotate', '&#10227;', 'Rotate'], ['right', '&#9654;', 'Move right'], ['down', '&#9660;', 'Soft drop'], ['drop', '&#10515;', 'Hard drop'], ['pause', '&#10074;&#10074;', 'Pause'], ['quit', '&times;', 'Quit']],
            keys: { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'rotate', ArrowDown: 'down', ' ': 'drop', a: 'left', d: 'right', w: 'rotate', x: 'rotate', s: 'down', p: 'pause', r: 'restart', q: 'quit' },
            repeatable: ['left', 'right', 'down'],
            onAction: action
        });
        sh.size(W, H);

        function nextType() {
            if (!bag.length) bag = Object.keys(SHAPES).sort(function () { return Math.random() - 0.5; });
            return bag.pop();
        }
        function spawn() {
            var t = g.next || nextType();
            g.next = nextType();
            var m = SHAPES[t].m.map(function (r) { return r.slice(); });
            g.cur = { t: t, m: m, x: Math.floor((COLS - m[0].length) / 2), y: t === 'I' ? -1 : 0 };
            if (collides(g.cur.m, g.cur.x, g.cur.y)) {
                g.over = true;
                if (g.score > g.best) { g.best = g.score; setBest(BEST, g.score); }
                sh.message('GAME OVER<small>score ' + g.score + ' &middot; tap, R or P to play again &middot; Esc to quit</small>');
            }
        }
        function reset() {
            g = { board: [], score: 0, lines: 0, level: 0, over: false, paused: false, ready: false, best: getBest(BEST), next: null, cur: null };
            for (var y = 0; y < ROWS; y++) { g.board.push(new Array(COLS).fill(null)); }
            bag = [];
            spawn();
            sh.message('TETRIS<small>press any key or tap to start</small>');
            hud();
        }
        function hud() {
            sh.stats.innerHTML = 'score <b>' + g.score + '</b> &middot; lines <b>' + g.lines + '</b> &middot; lvl <b>' + (g.level + 1) + '</b>';
        }
        function collides(m, ox, oy) {
            for (var y = 0; y < m.length; y++) for (var x = 0; x < m[y].length; x++) {
                if (!m[y][x]) continue;
                var bx = ox + x, by = oy + y;
                if (bx < 0 || bx >= COLS || by >= ROWS) return true;
                if (by >= 0 && g.board[by][bx]) return true;
            }
            return false;
        }
        function rotate(m) {
            var n = m.length, r = [];
            for (var y = 0; y < n; y++) { r.push([]); for (var x = 0; x < n; x++) r[y].push(m[n - 1 - x][y]); }
            return r;
        }
        function lock() {
            var c = g.cur, top = false;
            c.m.forEach(function (row, y) {
                row.forEach(function (v, x) {
                    if (!v) return;
                    if (c.y + y < 0) { top = true; return; }
                    g.board[c.y + y][c.x + x] = SHAPES[c.t].c;
                });
            });
            if (top) {
                g.over = true;
                if (g.score > g.best) { g.best = g.score; setBest(BEST, g.score); }
                sh.message('GAME OVER<small>score ' + g.score + ' &middot; tap, R or P to play again &middot; Esc to quit</small>');
                hud();
                return;
            }
            var cleared = 0;
            for (var y = ROWS - 1; y >= 0; y--) {
                if (g.board[y].every(Boolean)) {
                    g.board.splice(y, 1);
                    g.board.unshift(new Array(COLS).fill(null));
                    cleared++;
                    y++;
                }
            }
            if (cleared) {
                g.score += [0, 100, 300, 500, 800][cleared] * (g.level + 1);
                g.lines += cleared;
                g.level = Math.floor(g.lines / 10);
                g.flash = { t: performance.now(), n: cleared };
            }
            hud();
            spawn();
        }
        function move(dx) {
            if (!collides(g.cur.m, g.cur.x + dx, g.cur.y)) g.cur.x += dx;
        }
        function softDrop() {
            if (!collides(g.cur.m, g.cur.x, g.cur.y + 1)) { g.cur.y++; g.score += 1; hud(); return true; }
            lock();
            return false;
        }
        function hardDrop() {
            var n = 0;
            while (!collides(g.cur.m, g.cur.x, g.cur.y + 1)) { g.cur.y++; n++; }
            g.score += n * 2;
            lock();
        }
        function tryRotate() {
            if (g.cur.t === 'O') return;
            var r = rotate(g.cur.m), kicks = [0, -1, 1, -2, 2];
            for (var i = 0; i < kicks.length; i++) {
                if (!collides(r, g.cur.x + kicks[i], g.cur.y)) { g.cur.m = r; g.cur.x += kicks[i]; return; }
            }
        }
        function action(a) {
            if (a === 'quit') return finish();
            if (g.over) { if (a === 'restart' || a === 'tap' || a === 'pause') reset(); return; }
            if (!g.ready) { g.ready = true; sh.message(''); last = performance.now(); return; }
            if (a === 'pause') { g.paused = !g.paused; sh.message(g.paused ? 'PAUSED<small>press P to resume</small>' : ''); return; }
            if (g.paused) { if (a === 'tap') { g.paused = false; sh.message(''); } return; }
            if (a === 'left') move(-1);
            else if (a === 'right') move(1);
            else if (a === 'rotate' || a === 'up' || a === 'tap') tryRotate();
            else if (a === 'down') softDrop();
            else if (a === 'drop' || a === 'swipedown') hardDrop();
        }
        function ghostY() {
            var y = g.cur.y;
            while (!collides(g.cur.m, g.cur.x, y + 1)) y++;
            return y;
        }
        function block(c, x, y, color, alpha) {
            c.globalAlpha = alpha || 1;
            c.fillStyle = color;
            c.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
            c.fillStyle = 'rgba(255,255,255,0.18)';
            c.fillRect(x * cell + 1, y * cell + 1, cell - 2, Math.max(2, cell * 0.18));
            c.globalAlpha = 1;
        }
        function draw(t) {
            var c = sh.ctx, bw = COLS * cell;
            c.fillStyle = BG;
            c.fillRect(0, 0, W, H);
            c.strokeStyle = GRID;
            for (var x = 1; x < COLS; x++) { c.beginPath(); c.moveTo(x * cell + 0.5, 0); c.lineTo(x * cell + 0.5, H); c.stroke(); }
            for (var y = 1; y < ROWS; y++) { c.beginPath(); c.moveTo(0, y * cell + 0.5); c.lineTo(bw, y * cell + 0.5); c.stroke(); }
            c.strokeStyle = 'rgba(164,255,145,0.35)';
            c.strokeRect(0.5, 0.5, bw - 1, H - 1);

            g.board.forEach(function (row, y) { row.forEach(function (col, x) { if (col) block(c, x, y, col); }); });

            if (g.cur && !g.over) {
                var gy = ghostY(), col = SHAPES[g.cur.t].c;
                g.cur.m.forEach(function (row, y) {
                    row.forEach(function (v, x) {
                        if (!v) return;
                        if (gy + y >= 0) { c.strokeStyle = col; c.globalAlpha = 0.35; c.strokeRect((g.cur.x + x) * cell + 1.5, (gy + y) * cell + 1.5, cell - 3, cell - 3); c.globalAlpha = 1; }
                        if (g.cur.y + y >= 0) block(c, g.cur.x + x, g.cur.y + y, col);
                    });
                });
            }

            if (g.flash && t - g.flash.t < 260) {
                c.fillStyle = 'rgba(164,255,145,' + (0.25 * (1 - (t - g.flash.t) / 260)) + ')';
                c.fillRect(0, 0, bw, H);
            }

            // Side panel: next piece + best
            var px = bw + cell * 0.6;
            c.fillStyle = TEXT;
            c.font = Math.max(10, Math.round(cell * 0.6)) + 'px monospace';
            c.fillText('NEXT', px, cell * 1.2);
            var nm = SHAPES[g.next].m, nc = SHAPES[g.next].c, ms = cell * 0.8;
            nm.forEach(function (row, y) {
                row.forEach(function (v, x) {
                    if (!v) return;
                    c.fillStyle = nc;
                    c.fillRect(px + x * ms, cell * 1.8 + y * ms, ms - 2, ms - 2);
                });
            });
            c.fillStyle = 'rgba(255,255,255,0.5)';
            c.fillText('BEST', px, cell * 6.5);
            c.fillStyle = ACCENT;
            c.fillText(String(Math.max(g.best, g.score)), px, cell * 7.5);
        }
        function loop(t) {
            if (!alive) return;
            var speed = Math.max(90, 700 - g.level * 60);
            if (g.ready && !g.over && !g.paused && t - last >= speed) {
                last = t;
                if (!collides(g.cur.m, g.cur.x, g.cur.y + 1)) g.cur.y++; else lock();
            }
            draw(t);
            raf = requestAnimationFrame(loop);
        }
        function finish() {
            if (!alive) return;
            destroy();
            api.onExit('tetris: score <span class="c-accent">' + g.score + '</span> &middot; lines ' + g.lines + ' &middot; best ' + Math.max(g.best, g.score) +
                ' &middot; <button type="button" class="cmd-chip" data-run="tetris">play again</button>');
        }
        function destroy() {
            alive = false;
            cancelAnimationFrame(raf);
            sh.destroy();
        }

        reset();
        raf = requestAnimationFrame(loop);
        return { destroy: destroy };
    }

    window.TermGames = { snake: snake, tetris: tetris };
})();
