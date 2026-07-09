/**
 * Foothold — 365 Days of Hacking
 * Main JavaScript for the HackTheBox machine browser
 * 0x1Ak4sh | mrakashkumar.in
 */

(function () {
    'use strict';

    // ── State ───────────────────────────────────────────────────────────────
    let allMachines = [];
    let filteredMachines = [];
    let displayedCount = 0;
    const PAGE_SIZE = 30;

    const state = {
        search: '',
        diff: 'all',
        os: 'all',
        tag: null,
    };

    // ── DOM refs ────────────────────────────────────────────────────────────
    const $grid = document.getElementById('machinesGrid');
    const $search = document.getElementById('searchInput');
    const $searchClear = document.getElementById('searchClear');
    const $noResults = document.getElementById('noResults');
    const $resultNum = document.getElementById('resultNum');
    const $loadMoreWrap = document.getElementById('loadMoreWrap');
    const $loadMoreBtn = document.getElementById('loadMoreBtn');
    const $modalOverlay = document.getElementById('modalOverlay');
    const $modalClose = document.getElementById('modalClose');
    const $randomBtn = document.getElementById('randomBtn');
    const $toast = document.getElementById('toast');
    let toastTimer;

    // ── Boot ────────────────────────────────────────────────────────────────
    async function init() {
        try {
            const resp = await fetch('machines.json');
            allMachines = await resp.json();
        } catch (e) {
            console.error('Failed to load machines.json', e);
            allMachines = getDemoMachines();
        }

        updateStats();
        renderFeatured(pickRandom(allMachines));
        buildTagCloud();
        applyFilters();
        bindEvents();
        animateCounters();
    }

    // ── Stats ───────────────────────────────────────────────────────────────
    function updateStats() {
        document.getElementById('machineCount').textContent = allMachines.length;
        document.getElementById('statTotal').textContent = allMachines.length;
        document.getElementById('statEasy').textContent = allMachines.filter(m => m.difficulty === 'Easy').length;
        document.getElementById('statMedium').textContent = allMachines.filter(m => m.difficulty === 'Medium').length;
        document.getElementById('statHard').textContent = allMachines.filter(m => m.difficulty === 'Hard').length;
    }

    function animateCounters() {
        document.querySelectorAll('.stat-num').forEach(el => {
            const target = parseInt(el.textContent, 10);
            if (isNaN(target)) return;
            let current = 0;
            const step = Math.ceil(target / 40);
            const timer = setInterval(() => {
                current = Math.min(current + step, target);
                el.textContent = current;
                if (current >= target) clearInterval(timer);
            }, 30);
        });
    }

    // ── Featured Machine ────────────────────────────────────────────────────
    function renderFeatured(machine) {
        if (!machine) return;
        const featAvatar = document.getElementById('featAvatar');
        if (machine.avatar && featAvatar) {
            featAvatar.src = machine.avatar;
            featAvatar.alt = machine.name;
            featAvatar.style.display = '';
        } else if (featAvatar) {
            featAvatar.style.display = 'none';
        }

        document.getElementById('featDay').textContent = `Day ${String(machine.day).padStart(3, '0')}`;
        document.getElementById('featName').textContent = machine.name;

        const diffEl = document.getElementById('featDiff');
        diffEl.textContent = machine.difficulty;
        diffEl.className = 'badge-diff ' + (machine.difficulty || 'unknown').toLowerCase();

        document.getElementById('featSummary').textContent =
            machine.summary || 'No summary available for this machine.';

        const tagsEl = document.getElementById('featTags');
        tagsEl.innerHTML = machine.tags.slice(0, 4).map(t =>
            `<span class="tag-chip">${t}</span>`).join('');

        const linkEl = document.getElementById('featLink');
        linkEl.onclick = (e) => { e.preventDefault(); openModal(machine); };

        // Clicking the whole card opens modal too
        document.getElementById('featuredMachine').onclick = () => openModal(machine);
    }

    function pickRandom(arr) {
        if (!arr.length) return null;
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // ── Tag Cloud ───────────────────────────────────────────────────────────
    function buildTagCloud() {
        const tagCount = {};
        allMachines.forEach(m => m.tags.forEach(t => tagCount[t] = (tagCount[t] || 0) + 1));
        const sorted = Object.entries(tagCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);

        const $cloud = document.getElementById('tagCloud');
        $cloud.innerHTML = sorted.map(([tag, count]) =>
            `<button class="pill tag-filter-pill" data-tag="${tag}" title="${count} machines">
                ${tag} <span style="opacity:0.5;font-family:var(--mono);font-size:0.65rem;">${count}</span>
            </button>`
        ).join('');

        $cloud.querySelectorAll('.tag-filter-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.dataset.tag;
                if (state.tag === tag) {
                    state.tag = null;
                    btn.classList.remove('active');
                } else {
                    $cloud.querySelectorAll('.tag-filter-pill').forEach(b => b.classList.remove('active'));
                    state.tag = tag;
                    btn.classList.add('active');
                }
                applyFilters();
            });
        });
    }

    // ── Filter ──────────────────────────────────────────────────────────────
    function applyFilters() {
        const q = state.search.toLowerCase();
        filteredMachines = allMachines.filter(m => {
            // Search
            if (q) {
                const haystack = [
                    m.name, m.summary, ...m.tags, ...m.cves,
                ].join(' ').toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            // Difficulty
            if (state.diff !== 'all' && m.difficulty !== state.diff) return false;
            // OS
            if (state.os !== 'all' && m.os !== state.os) return false;
            // Tag
            if (state.tag && !m.tags.includes(state.tag)) return false;
            return true;
        });

        $resultNum.textContent = filteredMachines.length;
        displayedCount = 0;
        $grid.innerHTML = '';
        renderNextPage();
    }

    function renderNextPage() {
        const slice = filteredMachines.slice(displayedCount, displayedCount + PAGE_SIZE);
        displayedCount += slice.length;

        if (filteredMachines.length === 0) {
            $noResults.style.display = 'flex';
            $noResults.style.flexDirection = 'column';
            $noResults.style.alignItems = 'center';
            $loadMoreWrap.style.display = 'none';
        } else {
            $noResults.style.display = 'none';
        }

        slice.forEach((machine, idx) => {
            const card = createCard(machine);
            card.style.animationDelay = `${idx * 0.04}s`;
            $grid.appendChild(card);
        });

        $loadMoreWrap.style.display = displayedCount < filteredMachines.length ? 'block' : 'none';
    }

    // ── Machine Card ────────────────────────────────────────────────────────
    function createCard(machine) {
        const card = document.createElement('div');
        card.className = 'machine-card';
        card.setAttribute('data-id', machine.day);

        const diffClass = (machine.difficulty || 'unknown').toLowerCase();
        const osIcon = machine.os === 'Windows' ? 'fab fa-windows' :
                       machine.os === 'FreeBSD' ? 'fas fa-server' :
                       machine.os === 'Android' ? 'fab fa-android' : 'fab fa-linux';

        const tagsHTML = machine.tags.slice(0, 3).map(t =>
            `<span class="tag-chip" data-tag="${t}">${t}</span>`
        ).join('');

        const cvesHTML = machine.cves.length
            ? `<span class="card-cves" title="${machine.cves.join(', ')}">${machine.cves[0]}${machine.cves.length > 1 ? ' +' + (machine.cves.length - 1) : ''}</span>`
            : '';

        const summaryText = machine.summary
            ? machine.summary
            : `Machine #${machine.day} — Click to view details.`;

        const avatarHTML = machine.avatar
            ? `<img class="card-avatar" src="${escHtml(machine.avatar)}" alt="${escHtml(machine.name)}" loading="lazy">`
            : `<div class="card-avatar card-avatar-placeholder"><i class="fas fa-shield-halved"></i></div>`;

        card.innerHTML = `
            <div class="card-top">
                ${avatarHTML}
                <div class="card-header">
                    <div>
                        <div class="card-day">Day ${String(machine.day).padStart(3, '0')}</div>
                        <div class="card-name">${escHtml(machine.name)}</div>
                    </div>
                    <span class="badge-diff ${diffClass}">${machine.difficulty}</span>
                </div>
            </div>
            <p class="card-summary ${machine.summary ? '' : 'empty'}">${escHtml(summaryText)}</p>
            <div class="card-tags">${tagsHTML}</div>
            <div class="card-footer">
                ${cvesHTML}
                <span class="card-os"><i class="${osIcon}"></i> ${machine.os}</span>
                <span class="card-cta"><i class="fas fa-arrow-right"></i> Details</span>
            </div>
        `;

        // Click card → open modal
        card.addEventListener('click', (e) => {
            if (e.target.closest('.tag-chip')) {
                const tag = e.target.closest('.tag-chip').dataset.tag;
                filterByTag(tag);
                return;
            }
            openModal(machine);
        });

        return card;
    }

    function filterByTag(tag) {
        if (state.tag === tag) {
            state.tag = null;
        } else {
            state.tag = tag;
        }
        // Update tag cloud UI
        document.querySelectorAll('.tag-filter-pill').forEach(b => {
            b.classList.toggle('active', b.dataset.tag === state.tag);
        });
        // Scroll to filter
        document.getElementById('filterSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
        applyFilters();
    }

    // ── Modal ───────────────────────────────────────────────────────────────
    function openModal(machine) {
        const mAvatar = document.getElementById('mAvatar');
        if (machine.avatar && mAvatar) {
            mAvatar.src = machine.avatar;
            mAvatar.alt = machine.name;
            mAvatar.style.display = '';
        } else if (mAvatar) {
            mAvatar.style.display = 'none';
        }

        document.getElementById('mDay').textContent = `Day ${String(machine.day).padStart(3, '0')}`;
        document.getElementById('mName').textContent = machine.name;

        const diffEl = document.getElementById('mDiff');
        diffEl.textContent = machine.difficulty;
        diffEl.className = 'badge-diff ' + (machine.difficulty || 'unknown').toLowerCase();

        const osIcon = machine.os === 'Windows' ? 'fab fa-windows' :
                       machine.os === 'FreeBSD' ? 'fas fa-server' :
                       machine.os === 'Android' ? 'fab fa-android' : 'fab fa-linux';
        document.getElementById('mOS').innerHTML = `<i class="${osIcon}"></i> ${machine.os}`;

        // CVEs
        const cvesEl = document.getElementById('mCVEs');
        if (machine.cves && machine.cves.length) {
            cvesEl.style.display = 'flex';
            cvesEl.innerHTML = machine.cves.map(c =>
                `<span class="cve-chip"><i class="fas fa-bug"></i> ${escHtml(c)}</span>`
            ).join('');
        } else {
            cvesEl.style.display = 'none';
        }

        document.getElementById('mSummary').textContent =
            machine.summary || 'No summary available for this machine. The detailed writeup was posted as a Twitter thread during the 365 Days of Hacking challenge.';

        document.getElementById('mTags').innerHTML = machine.tags.map(t =>
            `<span class="tag-chip filter-active">${escHtml(t)}</span>`
        ).join('');

        // Machine links
        const htbLink = document.getElementById('mHTBLink');
        if (machine.slug) {
            htbLink.href = 'https://www.hackthebox.com/machines/' + machine.slug;
            htbLink.style.display = '';
        } else {
            htbLink.style.display = 'none';
        }

        const tweetLink = document.getElementById('mTweetLink');
        if (machine.name) {
            const q = encodeURIComponent('from:@0x1ak4sh "365 Days of Hacking" "' + machine.name + '"');
            tweetLink.href = 'https://x.com/search?q=' + q + '&src=typed_query&f=live';
            tweetLink.style.display = '';
        } else {
            tweetLink.style.display = 'none';
        }

        $modalOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        $modalOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    // ── Events ──────────────────────────────────────────────────────────────
    function bindEvents() {
        // Search
        $search.addEventListener('input', () => {
            state.search = $search.value;
            $searchClear.style.display = state.search ? 'block' : 'none';
            applyFilters();
        });

        $searchClear.addEventListener('click', () => {
            $search.value = '';
            state.search = '';
            $searchClear.style.display = 'none';
            $search.focus();
            applyFilters();
        });

        // Difficulty pills
        document.querySelectorAll('#diffFilter .pill').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#diffFilter .pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.diff = btn.dataset.diff;
                applyFilters();
            });
        });

        // OS pills
        document.querySelectorAll('#osFilter .pill').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#osFilter .pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.os = btn.dataset.os;
                applyFilters();
            });
        });

        // Load more
        $loadMoreBtn.addEventListener('click', () => {
            renderNextPage();
        });

        // Random button
        $randomBtn.addEventListener('click', () => {
            const machine = pickRandom(allMachines);
            renderFeatured(machine);
            // Scroll to featured
            document.querySelector('.foothold-hero').scrollIntoView({ behavior: 'smooth' });
            showToast(`🎲 Random: ${machine.name}`);
        });

        // Modal close
        $modalClose.addEventListener('click', closeModal);
        $modalOverlay.addEventListener('click', (e) => {
            if (e.target === $modalOverlay) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });

        // Nav scroll effect
        const nav = document.getElementById('mainNav');
        window.addEventListener('scroll', () => {
            nav.classList.toggle('scrolled', window.scrollY > 20);
            updateReadingProgress();
        }, { passive: true });
    }

    // ── Reading Progress ────────────────────────────────────────────────────
    function updateReadingProgress() {
        const scrolled = window.scrollY;
        const total = document.body.scrollHeight - window.innerHeight;
        const pct = total > 0 ? (scrolled / total) * 100 : 0;
        document.getElementById('readingProgress').style.width = pct + '%';
    }

    // ── Toast ───────────────────────────────────────────────────────────────
    function showToast(msg) {
        $toast.textContent = msg;
        $toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => $toast.classList.remove('show'), 2500);
    }

    // ── Global reset ─────────────────────────────────────────────────────
    window.resetFilters = function () {
        state.search = '';
        state.diff = 'all';
        state.os = 'all';
        state.tag = null;
        $search.value = '';
        $searchClear.style.display = 'none';
        document.querySelectorAll('#diffFilter .pill').forEach(b => b.classList.toggle('active', b.dataset.diff === 'all'));
        document.querySelectorAll('#osFilter .pill').forEach(b => b.classList.toggle('active', b.dataset.os === 'all'));
        document.querySelectorAll('.tag-filter-pill').forEach(b => b.classList.remove('active'));
        applyFilters();
    };

    // ── Image Lightbox ──────────────────────────────────────────────────
    function initImageLightbox() {
        const img = document.getElementById('storyImg');
        const lb = document.getElementById('imgLightbox');
        const lbContent = document.getElementById('imgLightboxContent');
        const lbClose = document.getElementById('imgLightboxClose');
        if (!img || !lb || !lbContent || !lbClose) return;

        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
            lbContent.src = img.src;
            lbContent.alt = img.alt;
            lb.classList.add('open');
            document.body.style.overflow = 'hidden';
        });

        function closeLb() {
            lb.classList.remove('open');
            document.body.style.overflow = '';
        }

        lbClose.addEventListener('click', closeLb);
        lb.addEventListener('click', (e) => {
            if (e.target === lb) closeLb();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeLb();
        });
    }
    initImageLightbox();

    // ── Escape HTML ─────────────────────────────────────────────────────────
    function escHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── Demo fallback data ──────────────────────────────────────────────────
    function getDemoMachines() {
        return [
            { day: 1, name: "Netmon", difficulty: "Easy", os: "Windows", tags: ["CVE Exploit", "Command Injection", "Network Exploitation"], cves: ["CVE-2018-9276"], summary: "Discovered PRTG Network Monitor credentials in default config locations. Exploited CVE-2018-9276 command injection to gain a reverse shell and root flag.", slug: "netmon" },
            { day: 1, name: "Precious", difficulty: "Easy", os: "Linux", tags: ["CVE Exploit", "Command Injection", "Privilege Escalation"], cves: ["CVE-2022-25765"], summary: "Exploited pdfkit CVE-2022-25765 for initial access, then leveraged a Ruby bundle update misconfiguration for root.", slug: "precious" },
            { day: 2, name: "Wifinetic", difficulty: "Easy", os: "Linux", tags: ["Network Exploitation", "Privilege Escalation"], cves: [], summary: "Exploited misconfigured OpenWRT wireless network. Used WPS PIN cracking via reaver to escalate to root.", slug: "wifinetic" },
            { day: 3, name: "CozyHosting", difficulty: "Easy", os: "Linux", tags: ["Web Exploitation", "Command Injection", "Privilege Escalation"], cves: [], summary: "Found Spring Boot Actuator endpoint leaking session cookies. Used OS command injection in hostname field. Cracked PostgreSQL hash to get SSH access. SSH sudo privilege escalation to root.", slug: "cozyhosting" },
            { day: 4, name: "Analytics", difficulty: "Easy", os: "Linux", tags: ["CVE Exploit", "Container Escape"], cves: ["CVE-2023-38646", "CVE-2023-32629"], summary: "Exploited Metabase CVE-2023-38646 pre-auth RCE for initial shell. Gained root via GameOver(lay) kernel exploit CVE-2023-32629.", slug: "analytics" },
            { day: 13, name: "Clicker", difficulty: "Medium", os: "Linux", tags: ["CRLF Injection", "LFI/RFI", "Privilege Escalation"], cves: [], summary: "Mounted NFS shares. Exploited CRLF injection to set admin role. PHP code injection via nickname parameter. Copied SSH key for user access. Used perl_startup for root.", slug: "clicker" },
        ];
    }

    // ── Start ───────────────────────────────────────────────────────────────
    // ── Mobile: Tag cloud toggle ─────────────────────────────────
    function initMobileToggle() {
        const toggle = document.getElementById('tagCloudToggle');
        const wrap = document.getElementById('tagCloudWrap');
        const btn = toggle?.querySelector('.tag-toggle-btn');
        if (!toggle || !wrap || !btn) return;

        // Show if user has js off — hidden by css
        wrap.style.display = 'none';

        btn.addEventListener('click', () => {
            const isOpen = wrap.style.display !== 'none';
            wrap.style.display = isOpen ? 'none' : 'flex';
            btn.classList.toggle('open', !isOpen);
        });
    }
    initMobileToggle();

    document.addEventListener('DOMContentLoaded', init);
})();
