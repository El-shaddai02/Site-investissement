// Explain: Admin login gate, dashboard tabs, credit, offers and withdrawal actions.
/* ===== WIKIZE — ESPACE ADMINISTRATION (TABLEAU DE BORD, OFFRES, RETRAITS) ===== */
document.addEventListener('DOMContentLoaded', function () {
    var ADMIN_NAME = 'Elshaddaï';
    var ADMIN_PASS = 'Elshaddaï2000@';
    var loginBox = document.getElementById('adminLoginBox');
    var dashboard = document.getElementById('adminDashboard');
    if (!loginBox || !dashboard) { return; }

    function el(id) { return document.getElementById(id); }
    function money(n) { return (Number(n) || 0).toLocaleString('fr-FR') + ' FCFA'; }
    function feedback(node, msg, ok) {
        if (!node) { return; }
        node.textContent = msg;
        node.classList.add('is-visible');
        node.classList.toggle('is-error', !ok);
    }

    if (sessionStorage.getItem('wikize_admin') === 'ok') { openDashboard(); }

    el('adminLoginForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var name = el('adminName').value.trim();
        var pass = el('adminPass').value;
        if (name === ADMIN_NAME && pass === ADMIN_PASS) {
            sessionStorage.setItem('wikize_admin', 'ok');
            feedback(el('adminFeedback'), 'Accès autorisé. Ouverture du tableau de bord…', true);
            openDashboard();
            return;
        }
        feedback(el('adminFeedback'), 'Accès refusé : nom ou mot de passe incorrect.', false);
        el('adminPass').value = '';
    });

    function openDashboard() {
        loginBox.classList.add('hidden-wk');
        dashboard.classList.remove('hidden-wk');
        renderAll();
    }

    el('adminLogout').addEventListener('click', function () {
        sessionStorage.removeItem('wikize_admin');
        window.location.reload();
    });

    /* --- ONGLETS --- */
    var tabBtns = document.querySelectorAll('[data-admin-tab]');
    tabBtns.forEach(function (b) {
        b.addEventListener('click', function () {
            var target = b.getAttribute('data-admin-tab');
            tabBtns.forEach(function (x) { x.classList.toggle('is-active', x === b); });
            document.querySelectorAll('[data-admin-view]').forEach(function (v) {
                v.classList.toggle('is-active', v.getAttribute('data-admin-view') === target);
            });
        });
    });

    /* --- RENDU GÉNÉRAL --- */
    function renderAll() {
        renderUsers();
        renderInvestments();
        renderWithdrawals();
        renderMessages();
        renderOffers();
        el('admUsers').textContent = String(window.WKStore.list('users').length);
        el('admInvest').textContent = String(window.WKStore.list('investments').length);
        el('admPending').textContent = String(window.WKStore.list('withdrawals').filter(function (w) { return w.status === 'en attente'; }).length);
        el('admMessages').textContent = String(window.WKStore.list('messages').length);
    }

    function emptyRow(tbody, cols, text) {
        tbody.innerHTML = '';
        var tr = document.createElement('tr');
        var td = document.createElement('td');
        td.colSpan = cols;
        td.className = 'wk-hint';
        td.textContent = text;
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    function renderUsers() {
        var tbody = el('admUsersBody');
        var users = window.WKStore.list('users');
        if (!users.length) { emptyRow(tbody, 5, 'Aucun inscrit pour le moment.'); return; }
        tbody.innerHTML = '';
        users.forEach(function (u) {
            var tr = document.createElement('tr');
            [u.name, u.phone, u.email, money(u.balance)].forEach(function (val) {
                var td = document.createElement('td');
                td.textContent = val;
                tr.appendChild(td);
            });
            var actions = document.createElement('td');
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'btn-wk btn-wk--accent btn-wk--sm';
            b.innerHTML = '<i class="fa-solid fa-plus"></i> Créditer';
            b.addEventListener('click', function () {
                el('creditEmail').value = u.email;
                el('creditAmount').focus();
            });
            actions.appendChild(b);
            tr.appendChild(actions);
            tbody.appendChild(tr);
        });
    }

    function renderInvestments() {
        var tbody = el('admInvestBody');
        var list = window.WKStore.list('investments');
        if (!list.length) { emptyRow(tbody, 6, 'Aucun investissement enregistré.'); return; }
        tbody.innerHTML = '';
        list.forEach(function (i) {
            var tr = document.createElement('tr');
            [i.date, i.name, i.label, money(i.amount), money(i.gain), i.status].forEach(function (val) {
                var td = document.createElement('td');
                td.textContent = val;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }

    function renderWithdrawals() {
        var tbody = el('admWithdrawBody');
        var list = window.WKStore.list('withdrawals');
        if (!list.length) { emptyRow(tbody, 6, 'Aucune demande de retrait.'); return; }
        tbody.innerHTML = '';
        list.forEach(function (w) {
            var tr = document.createElement('tr');
            [w.date, w.client, w.beneficiary, money(w.amount)].forEach(function (val) {
                var td = document.createElement('td');
                td.textContent = val;
                tr.appendChild(td);
            });
            var st = document.createElement('td');
            var pill = document.createElement('span');
            pill.className = 'status-pill ' + (w.status === 'en attente' ? 'status-pill--pending' : (w.status === 'refusé' ? 'status-pill--ko' : 'status-pill--ok'));
            pill.textContent = w.status;
            st.appendChild(pill);
            tr.appendChild(st);

            var acts = document.createElement('td');
            if (w.status === 'en attente') {
                var okBtn = document.createElement('button');
                okBtn.type = 'button';
                okBtn.className = 'btn-wk btn-wk--accent btn-wk--sm';
                okBtn.innerHTML = '<i class="fa-solid fa-check"></i> Valider';
                okBtn.addEventListener('click', function () {
                    window.WKStore.setWithdrawalStatus(w.id, 'payé');
                    renderAll();
                });
                var koBtn = document.createElement('button');
                koBtn.type = 'button';
                koBtn.className = 'btn-wk btn-wk--danger btn-wk--sm';
                koBtn.style.marginLeft = '.4rem';
                koBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Refuser';
                koBtn.addEventListener('click', function () {
                    window.WKStore.setWithdrawalStatus(w.id, 'refusé');
                    renderAll();
                });
                acts.appendChild(okBtn);
                acts.appendChild(koBtn);
            } else {
                acts.textContent = '—';
            }
            tr.appendChild(acts);
            tbody.appendChild(tr);
        });
    }

    function renderMessages() {
        var tbody = el('admMessagesBody');
        var list = window.WKStore.list('messages');
        if (!list.length) { emptyRow(tbody, 5, 'Aucun message reçu pour le moment.'); return; }
        tbody.innerHTML = '';
        list.forEach(function (m) {
            var tr = document.createElement('tr');
            [m.date, m.name, m.phone, m.email, m.message].forEach(function (val) {
                var td = document.createElement('td');
                td.textContent = val;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }

    function renderOffers() {
        var list = el('admOffersList');
        var offers = window.WKStore.list('offers');
        list.innerHTML = '';
        if (!offers.length) {
            list.innerHTML = '<p class="wk-hint">Aucune offre publiée.</p>';
            return;
        }
        offers.forEach(function (o) {
            var row = document.createElement('div');
            row.className = 'tx-row';
            var main = document.createElement('div');
            main.className = 'tx-row__main';
            var t = document.createElement('strong');
            t.textContent = o.title + ' — ' + o.type;
            var m = document.createElement('span');
            m.textContent = o.date + ' — ' + money(o.price);
            main.appendChild(t);
            main.appendChild(m);
            var del = document.createElement('button');
            del.type = 'button';
            del.className = 'btn-wk btn-wk--danger btn-wk--sm';
            del.innerHTML = '<i class="fa-solid fa-trash"></i> Supprimer';
            del.addEventListener('click', function () {
                window.WKStore.removeOffer(o.id);
                renderAll();
            });
            row.appendChild(main);
            row.appendChild(del);
            list.appendChild(row);
        });
    }

    /* --- CRÉDITER UN COMPTE --- */
    el('adminCreditForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var res = window.WKStore.credit(el('creditEmail').value.trim(), el('creditAmount').value);
        if (!res.success) { feedback(el('creditFeedback'), res.error, false); return; }
        feedback(el('creditFeedback'), 'Compte crédité avec succès.', true);
        el('creditAmount').value = '';
        renderAll();
    });

    /* --- PUBLIER UNE OFFRE --- */
    el('adminOfferForm').addEventListener('submit', function (e) {
        e.preventDefault();
        window.WKStore.addOffer({
            type: el('ofType').value,
            title: el('ofTitle').value.trim(),
            desc: el('ofDesc').value.trim(),
            price: el('ofPrice').value
        });
        feedback(el('offerFeedback'), 'Offre publiée : elle apparaît maintenant sur l\'accueil et la page Offres.', true);
        el('adminOfferForm').reset();
        renderAll();
    });

    /* --- LISTE DE DIFFUSION WHATSAPP --- */
    el('admBroadcastBtn').addEventListener('click', function () {
        var users = window.WKStore.list('users');
        var out = el('admBroadcastOut');
        if (!users.length) { out.textContent = 'Aucun inscrit à notifier pour le moment.'; return; }
        var message = 'Nouvelle offre WIKIZE : votre offre — voir ici : ' + window.location.origin + '/offres.html';
        var lines = users.map(function (u) {
            return (u.name || 'Client') + ' : https://wa.me/' + String(u.phone || '').replace(/[^0-9]/g, '');
        });
        out.textContent = message + '\n\n' + lines.join('\n');
    });
});