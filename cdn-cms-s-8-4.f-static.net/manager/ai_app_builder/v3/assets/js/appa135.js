// Explain: Global interactions: menu, counters, dark mode, welcome modal, booking.
/* ===== WIKIZE — INTERACTIONS GLOBALES (MENU, COMPTEURS, DARK MODE, POPUP, RÉSERVATION) ===== */
document.addEventListener('DOMContentLoaded', function () {

    /* --- DÉCALAGE DE LA BARRE FIXE --- */
    var topbar = document.getElementById('siteTopbar');
    function setOffset() {
        if (!topbar) { return; }
        var h = topbar.offsetHeight;
        document.documentElement.style.setProperty('--top-offset', h + 'px');
        document.body.style.paddingTop = h + 'px';
    }
    setOffset();
    window.addEventListener('resize', setOffset);
    window.addEventListener('load', setOffset);

    /* --- MENU MOBILE --- */
    var navToggle = document.getElementById('navToggle');
    var navPanel = document.getElementById('navPanel');
    function closeNav() {
        if (!navPanel) { return; }
        navPanel.classList.remove('is-open');
        if (navToggle) { navToggle.setAttribute('aria-expanded', 'false'); }
    }
    if (navToggle && navPanel) {
        navToggle.addEventListener('click', function () {
            var open = navPanel.classList.toggle('is-open');
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        navPanel.addEventListener('click', function (e) {
            if (e.target.tagName === 'A') { closeNav(); }
        });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeNav(); } });
        document.addEventListener('click', function (e) {
            if (!navPanel.contains(e.target) && !navToggle.contains(e.target)) { closeNav(); }
        });
    }

    /* --- SOUS-MENU « PLUS » --- */
    var dropTriggers = document.querySelectorAll('.nav-dropdown__trigger');
    dropTriggers.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            var li = btn.closest('.nav-dropdown');
            var open = li.classList.toggle('is-open');
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    });

    /* --- BARRE D'ANNONCE --- */
    var ann = document.getElementById('announcement');
    var annClose = document.getElementById('announcementClose');
    if (ann && annClose) {
        annClose.addEventListener('click', function () {
            ann.classList.add('is-hidden');
            setOffset();
        });
    }

    /* --- RETOUR EN HAUT --- */
    var backTop = document.getElementById('backToTop');
    if (backTop) {
        window.addEventListener('scroll', function () {
            backTop.classList.toggle('is-visible', window.scrollY > 500);
        }, { passive: true });
        backTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* --- APPARITION AU DÉFILEMENT --- */
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
            });
        }, { threshold: 0.12 });
        reveals.forEach(function (el) { io.observe(el); });
    } else {
        reveals.forEach(function (el) { el.classList.add('is-visible'); });
    }

    /* --- COMPTEURS ANIMÉS --- */
    function runCounter(el) {
        var target = parseFloat(el.getAttribute('data-count')) || 0;
        var suffix = el.getAttribute('data-suffix') || '';
        var duration = 1400;
        var start = null;
        function step(ts) {
            if (start === null) { start = ts; }
            var p = Math.min((ts - start) / duration, 1);
            el.textContent = Math.floor(p * target).toLocaleString('fr-FR') + suffix;
            if (p < 1) { window.requestAnimationFrame(step); }
            else { el.textContent = target.toLocaleString('fr-FR') + suffix; }
        }
        window.requestAnimationFrame(step);
    }
    var counters = document.querySelectorAll('[data-count]');
    if (counters.length && 'IntersectionObserver' in window) {
        var cio = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); }
            });
        }, { threshold: 0.4 });
        counters.forEach(function (c) { cio.observe(c); });
    } else {
        counters.forEach(runCounter);
    }

    /* --- MODE SOMBRE OPTIONNEL --- */
    var themeToggle = document.getElementById('themeToggle');
    if (localStorage.getItem('wikize_theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('wikize_theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('wikize_theme', 'dark');
            }
        });
    }

    /* --- MODALE DE BIENVENUE --- */
    var modal = document.getElementById('welcomeModal');
    function closeModal() {
        if (modal) { modal.classList.remove('is-open'); localStorage.setItem('wikize_welcome_seen', '1'); }
    }
    if (modal) {
        if (!localStorage.getItem('wikize_welcome_seen')) {
            window.setTimeout(function () { modal.classList.add('is-open'); }, 1400);
        }
        modal.querySelectorAll('[data-modal-close]').forEach(function (b) { b.addEventListener('click', closeModal); });
        modal.addEventListener('click', function (e) { if (e.target === modal) { closeModal(); } });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeModal(); } });
    }

    /* --- LIEN DE COMPTE DANS L'EN-TÊTE --- */
    var authLink = document.getElementById('navAuthLink');
    if (authLink && window.WKStore) {
        var user = window.WKStore.current();
        if (user && user.name) {
            authLink.setAttribute('href', 'wallet.html');
            authLink.innerHTML = '<i class="fa-solid fa-wallet"></i> ' + user.name.split(' ')[0];
        }
    }

    /* --- RECHERCHE DU HÉRO --- */
    var heroSearch = document.getElementById('heroSearch');
    if (heroSearch) {
        heroSearch.addEventListener('submit', function (e) {
            e.preventDefault();
            var type = heroSearch.querySelector('#hsType').value;
            var ville = heroSearch.querySelector('#hsVille').value;
            var date = heroSearch.querySelector('#hsDate').value;
            var parts = [];
            if (ville) { parts.push('app_ville=' + encodeURIComponent(ville)); }
            if (date) { parts.push('app_date=' + encodeURIComponent(date)); }
            window.location.href = type + '.html' + (parts.length ? '?' + parts.join('&') : '');
        });
    }

    /* --- PRÉ-REMPLISSAGE VILLE DEPUIS L'URL --- */
    var params = new URLSearchParams(window.location.search);
    var bkCity = document.getElementById('bkCity');
    if (bkCity && params.get('app_ville')) { bkCity.value = params.get('app_ville'); }

    /* --- RÉSERVATION WHATSAPP --- */
    var bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var msg = 'Bonjour WIKIZE, je souhaite louer un ' + bookingForm.vehicleType.value +
                ' du ' + (bookingForm.startDate.value || '...') + ' au ' + (bookingForm.endDate.value || '...') +
                ' à ' + (bookingForm.city.value || '...') +
                '. Nom : ' + (bookingForm.fullName.value || '...') +
                ' — WhatsApp : ' + (bookingForm.phone.value || '...');
            window.open('https://wa.me/22896635790?text=' + encodeURIComponent(msg), '_blank', 'noopener');
            var fb = document.getElementById('bookingFeedback');
            if (fb) {
                fb.textContent = 'Votre demande est prête : validez l\'envoi dans WhatsApp pour recevoir la confirmation.';
                fb.classList.add('is-visible');
                fb.classList.remove('is-error');
            }
            bookingForm.reset();
        });
        var devisBtn = document.getElementById('devisBtn');
        if (devisBtn) {
            devisBtn.addEventListener('click', function () {
                var msg = 'Bonjour WIKIZE, je souhaite recevoir un devis pour une location (type : ' +
                    (bookingForm.vehicleType.value || 'véhicule') + ', ville : ' + (bookingForm.city.value || '...') +
                    ', dates : ' + (bookingForm.startDate.value || '...') + ' → ' + (bookingForm.endDate.value || '...') + ').';
                window.open('https://wa.me/22896635790?text=' + encodeURIComponent(msg), '_blank', 'noopener');
            });
        }
    }

    /* --- ACCORDÉON FAQ --- */
    document.querySelectorAll('.js-faq').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var panel = document.getElementById(btn.getAttribute('aria-controls'));
            var open = btn.classList.toggle('is-open');
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (panel) { panel.classList.toggle('is-open', open); }
        });
    });

    /* --- BOUTONS DE PARTAGE --- */
    document.querySelectorAll('[data-share]').forEach(function (b) {
        b.addEventListener('click', function () {
            var net = b.getAttribute('data-share');
            var url = window.location.href;
            var text = 'WIKIZE — Roulez simplement. Location de vélos, motos et voitures.';
            if (net === 'whatsapp') {
                window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener');
            } else if (net === 'facebook') {
                window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank', 'noopener');
            }
        });
    });

    /* --- NEWSLETTER (NOTIFIE L'ÉQUIPE) --- */
    var nlForm = document.getElementById('newsletterForm');
    if (nlForm && window.MessagesSystem) {
        nlForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = nlForm.querySelector('input[type="email"]').value;
            if (!email) { return; }
            window.MessagesSystem.submit([{ label: 'Inscription newsletter', value: email, type: 'email' }], nlForm)
                .then(function (r) {
                    var fb = document.getElementById('newsletterFeedback');
                    if (fb) { fb.textContent = r.success ? 'Merci ! Vous êtes inscrit à la newsletter WIKIZE.' : 'Inscription impossible pour le moment.'; }
                    if (r.success) { nlForm.reset(); }
                })
                .catch(function () {
                    var fb = document.getElementById('newsletterFeedback');
                    if (fb) { fb.textContent = 'Connexion impossible. Réessayez dans un instant.'; }
                });
        });
    }
});