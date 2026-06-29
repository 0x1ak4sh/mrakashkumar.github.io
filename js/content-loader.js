/**
 * Content Loader - 0x1Ak4sh Portfolio Homepage
 * Renders projects in #projects-grid and articles in #articles-grid
 * Simple, no filters - just show the content cards directly.
 */
(function () {
    'use strict';

    // =============================================
    // CONTENT REGISTRY - Add new content here
    // =============================================
    var contentData = [
        // ---- PROJECTS ----
        {
            type: 'project',
            slug: 'hybrid-ad-lab',
            title: 'Hybrid Active Directory Enterprise Lab',
            description: 'A multi-cloud hybrid Active Directory lab spanning Vultr, AWS, and Azure. Features AD DS forest configuration, WireGuard mesh VPN network stitching, Exchange 2019 mail flow, and Azure Entra ID hybrid sync.',
            category: 'Setup Guide',
            language: 'Infrastructure',
            date: '2026-06-28',
            tags: ['active-directory', 'wireguard', 'exchange-server', 'azure-entra', 'multi-cloud'],
            image: '/projects/hybrid-ad-lab/img/AdHybridLab.png',
            url: '/projects/hybrid-ad-lab/'
        },
        {
            type: 'project',
            slug: 'honeypot-tpot-setup',
            title: 'Deploying T-Pot Honeypot on Vultr — 3M Attacks in 20 Days',
            description: 'I deployed T-Pot CE on a Vultr VPS and left it exposed for 20 days. Over 3 million attacks from all around the world — analysis, stats, and lessons learned.',
            category: 'Setup Guide',
            language: 'Infrastructure',
            date: '2026-06-20',
            tags: ['honeypot', 'vultr', 'detection', 'blueteam'],
            image: '/media/HomePageOfTPot.png',
            url: '/projects/honeypot-tpot-setup/'
        },
        {
            type: 'project',
            slug: 'beaconhub',
            title: 'Beacon Hub — Virtual Wi-Fi Pentesting Lab',
            description: 'A virtual Wi-Fi penetration testing lab that runs on your machine without any extra hardware. Create access points, capture handshakes, and practice wireless attacks inside a Linux VM.',
            category: 'Tool',
            language: 'Infrastructure',
            date: '2026-06-30',
            tags: ['wifi', 'pentesting', 'virtual-lab', 'vagrant'],
            image: '/media/beaconhub/logo.png',
            url: '/projects/beaconhub/'
        }
    ];

    // =============================================
    // INITIALIZATION
    // =============================================
    document.addEventListener('DOMContentLoaded', function () {
        renderGrid('projects-grid', 'project');
        renderGrid('articles-grid', 'article');
    });

    function renderGrid(gridId, type) {
        var grid = document.getElementById(gridId);
        if (!grid) return;

        var items = contentData.filter(function (item) {
            return item.type === type;
        });

        // Sort by date (newest first)
        items.sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });

        grid.innerHTML = '';

        if (items.length === 0) {
            grid.innerHTML = '<div class="no-content" style="padding:1rem;color:rgba(255,255,255,0.4);font-size:0.85rem;">Coming soon.</div>';
            return;
        }

        items.forEach(function (item) {
            var card = createCard(item);
            grid.appendChild(card);
        });

        // Make cards visible with staggered animation
        setTimeout(function () {
            var cards = grid.querySelectorAll('.content-card');
            cards.forEach(function (card, i) {
                setTimeout(function () {
                    card.classList.add('visible');
                }, i * 80);
            });
        }, 100);
    }

    function createCard(item) {
        var card = document.createElement('a');
        card.href = item.url;
        card.className = 'content-card';

        var badgeText = item.type === 'article' ? item.category : item.language;
        var metaRight = item.type === 'article' ? item.readTime : item.language;

        var imageHtml = '<div class="card-image" style="background-image: url(' + item.image + '); background-color: #0d1117;"></div>';

        card.innerHTML =
            imageHtml +
            '<div class="card-body">' +
            '  <div class="card-badge">' + badgeText + (item.difficulty ? ' <span style="opacity:0.5">/ ' + item.difficulty + '</span>' : '') + '</div>' +
            '  <div class="card-title">' + item.title + '</div>' +
            '  <div class="card-desc">' + item.description + '</div>' +
            '  <div class="card-footer">' +
            '    <span class="card-date">' + formatDate(item.date) + '</span>' +
            '    <span class="card-meta-right">' + metaRight + '</span>' +
            '  </div>' +
            '</div>';

        return card;
    }

    function formatDate(dateStr) {
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var parts = dateStr.split('-');
        return months[parseInt(parts[1]) - 1] + ' ' + parseInt(parts[2]) + ', ' + parts[0];
    }

})();
