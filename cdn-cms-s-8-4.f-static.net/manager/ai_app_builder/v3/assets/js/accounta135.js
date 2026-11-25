// Explain: Handles register/login tabs, wallet dashboard rendering and withdrawals.
/* ===== WIKIZE — COMPTES, WALLET ET RETRAITS ===== */
document.addEventListener('DOMContentLoaded', function () {
    function el(id) { return document.getElementById(id); }
    function money(n) { return (Number(n) || 0).toLocaleString('fr-FR') + ' FCFA'; }
    function feedback(node, msg, ok) {
        if (!node) { return; }
        node.textContent = msg;
        node.classList.add('is-visible');
        node.classList.toggle('is-error', !ok);
    }
    function statusClass(status) {
        if (status === 'en attente') { return 'status-pill status-pill--pending'; }
        if (status === 'refusé') { return 'status-pill status-pill--ko'; }
        return 'status-pill status-pill--ok';
    }
    function txRow(tx) {
        var row = document.createElement('div');
        row.className = 'tx-row';
        var plus = tx.amount >= 0;
        var icon = document.createElement('span');
        icon.className = 'tx-row__icon';
        icon.innerHTML = plus ? '<i class="fa-solid fa-arrow-down"></i>' : '<i class="fa-solid fa-arrow-up"></i>';
        var main = document.createElement('div');
        main.className = 'tx-row__main';
        var title = document.createElement('strong');
        title.textContent = tx.label;
        var meta = document.createElement('span');
        meta.textContent = tx.date;
        main.appendChild(title);
        main.appendChild(meta);
        var amount = document.createElement('span');
        amount.className = 'tx-row__amount ' + (plus ? 'is-plus' : 'is-minus');
        amount.textContent = (plus ? '+' : '') + money(tx.amount);
        row.appendChild(icon);
        row.appendChild(main);
        row.appendChild(amount);
        return row;
    }

    /* ===== PAGE COMPTE : ONGLETS ===== */
    var tabBtns = document.querySelectorAll('[data-auth-tab]');
    tabBtns.forEach(function (b) {
        b.addEventListener('click', function () {
            var target = b.getAttribute('data-auth-tab');
            tabBtns.forEach(function (x) { x.classList.toggle('is-active', x === b); });
            document.querySelectorAll('[data-auth-view]').forEach(function (v) {
                v.classList.toggle('is-active', v.getAttribute('data-auth-view') === target);
            });
        });
    });

    /* ===== INSCRIPTION ===== */
    var regForm = el('registerForm');
    if (regForm) {
        /* --- PRÉ-REMPLISSAGE DU CODE PARRAIN DEPUIS LE LIEN (?app_ref=CODE) --- */
        var refFromUrl = new URLSearchParams(window.location.search).get('app_ref');
        if (refFromUrl && regForm.refCode) {
            regForm.refCode.value = refFromUrl;
            var refHintNode = el('refHint');
            if (refHintNode) {
                refHintNode.innerHTML = '<i class="fa-solid fa-gift"></i> Vous êtes invité par un ami : votre parrain recevra 500 FCFA.';
            }
        }
        regForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var fb = el('registerFeedback');
            var name = regForm.fullName.value.trim();
            var phone = regForm.phone.value.trim();
            var email = regForm.email.value.trim();
            var pass = regForm.password.value;
            if (name.length < 3) { feedback(fb, 'Indiquez votre nom complet.', false); return; }
            if (phone.replace(/[^0-9]/g, '').length < 8) { feedback(fb, 'Numéro WhatsApp invalide.', false); return; }
            if (!/^\S+@\S+\.\S+$/.test(email)) { feedback(fb, 'Adresse e-mail invalide.', false); return; }
            if (pass.length < 6) { feedback(fb, 'Mot de passe : 6 caractères minimum.', false); return; }
            var res = window.WKStore.register({
                name: name,
                phone: phone,
                email: email,
                password: pass,
                ref: regForm.refCode ? regForm.refCode.value : ''
            });
            if (!res.success) { feedback(fb, res.error, false); return; }
            feedback(fb, 'Bienvenue ' + name + ' ! Vous recevez 1000 FCFA offerts' + (res.referred ? ' et votre parrain reçoit 500 FCFA' : '') + '. Redirection vers votre wallet…', true);
            regForm.reset();
            window.setTimeout(function () { window.location.href = 'wallet.html'; }, 1500);
        });
    }

    /* ===== CONNEXION ===== */
    var loginForm = el('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var fb = el('loginFeedback');
            var res = window.WKStore.login(loginForm.email.value.trim(), loginForm.password.value);
            if (!res.success) { feedback(fb, res.error, false); return; }
            feedback(fb, 'Connexion réussie. Redirection vers votre wallet…', true);
            window.setTimeout(function () { window.location.href = 'wallet.html'; }, 900);
        });
    }

    /* ===== BOUTONS DE DÉCONNEXION ===== */
    document.querySelectorAll('[data-logout]').forEach(function (b) {
        b.addEventListener('click', function () {
            window.WKStore.logout();
            window.location.href = 'compte.html';
        });
    });

    /* ===== PAGE WALLET ===== */
    var walletRoot = el('walletApp');
    if (walletRoot) {
        var user = window.WKStore.current();
        if (!user) {
            window.location.href = 'compte.html';
            return;
        }
        el('walletName').textContent = user.name;
        el('walletPhone').textContent = 'WhatsApp : ' + (user.phone || 'non renseigné') + ' — ' + user.email;
        el('walletBalance').textContent = money(user.balance);

        var txs = Array.isArray(user.transactions) ? user.transactions : [];
        var invested = 0;
        var gains = 0;
        txs.forEach(function (t) {
            if (t.label.indexOf('Investissement') === 0) { invested += Math.abs(t.amount); }
            if (t.label.indexOf('Gain estimé') === 0) { gains += t.amount; }
        });
        el('statInvested').textContent = money(invested);
        el('statGains').textContent = money(gains);
        var pending = window.WKStore.list('withdrawals').filter(function (w) {
            return w.email === user.email && w.status === 'en attente';
        });
        el('statPending').textContent = String(pending.length);

        var history = el('walletHistory');
        history.innerHTML = '';
        if (!txs.length) {
            history.innerHTML = '<p class="wk-hint">Aucune opération pour le moment.</p>';
        } else {
            txs.forEach(function (t) { history.appendChild(txRow(t)); });
        }
    }

    /* ===== PAGE RETRAIT ===== */
    var wdForm = el('withdrawalForm');
    if (wdForm) {
        var currentUser = window.WKStore.current();
        if (!currentUser) {
            window.location.href = 'compte.html';
            return;
        }
        el('retraitBalance').textContent = money(currentUser.balance);
        wdForm.phone.value = currentUser.phone || '';
        wdForm.fullName.value = currentUser.name || '';

        function renderWithdrawals() {
            var list = el('withdrawalHistory');
            if (!list) { return; }
            var mine = window.WKStore.list('withdrawals').filter(function (w) { return w.email === currentUser.email; });
            list.innerHTML = '';
            if (!mine.length) {
                list.innerHTML = '<p class="wk-hint">Aucune demande de retrait pour le moment.</p>';
                return;
            }
            mine.forEach(function (w) {
                var row = document.createElement('div');
                row.className = 'tx-row';
                var icon = document.createElement('span');
                icon.className = 'tx-row__icon';
                icon.innerHTML = '<i class="fa-solid fa-money-bill-transfer"></i>';
                var main = document.createElement('div');
                main.className = 'tx-row__main';
                var t = document.createElement('strong');
                t.textContent = w.beneficiary;
                var m = document.createElement('span');
                m.textContent = w.date + ' — ' + w.phone;
                main.appendChild(t);
                main.appendChild(m);
                var right = document.createElement('span');
                right.style.textAlign = 'right';
                var amt = document.createElement('span');
                amt.className = 'tx-row__amount is-minus';
                amt.textContent = money(w.amount);
                var st = document.createElement('span');
                st.className = statusClass(w.status);
                st.style.display = 'block';
                st.style.marginTop = '.3rem';
                st.textContent = w.status;
                right.appendChild(amt);
                right.appendChild(st);
                row.appendChild(icon);
                row.appendChild(main);
                row.appendChild(right);
                list.appendChild(row);
            });
        }
        renderWithdrawals();

        wdForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var fb = el('withdrawalFeedback');
            var res = window.WKStore.withdraw({
                amount: wdForm.amount.value,
                phone: wdForm.phone.value,
                name: wdForm.fullName.value
            });
            if (!res.success) {
                feedback(fb, res.error, false);
                if (res.needAuth) { window.setTimeout(function () { window.location.href = 'compte.html'; }, 1200); }
                return;
            }
            feedback(fb, 'Votre demande de retrait a bien été enregistrée. Statut : en attente de validation.', true);
            el('retraitBalance').textContent = money(res.balance);
            wdForm.amount.value = '';
            window.setTimeout(function () { window.location.reload(); }, 1600);
        });
    }
});