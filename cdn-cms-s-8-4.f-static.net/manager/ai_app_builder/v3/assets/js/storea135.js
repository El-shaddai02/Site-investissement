// Explain: LocalStorage database for users, wallet, withdrawals, offers, messages, referrals.
/* ===== WIKIZE — BASE LOCALE (COMPTES, WALLET, RETRAITS, OFFRES, MESSAGES) ===== */
window.WKStore = (function () {
    var KEY = 'wikize_db_v1';
    var EMPTY = { users: [], investments: [], withdrawals: [], messages: [], offers: [], referrals: [] };

    function load() {
        try {
            var raw = JSON.parse(localStorage.getItem(KEY) || '{}');
            return {
                users: Array.isArray(raw.users) ? raw.users : [],
                investments: Array.isArray(raw.investments) ? raw.investments : [],
                withdrawals: Array.isArray(raw.withdrawals) ? raw.withdrawals : [],
                messages: Array.isArray(raw.messages) ? raw.messages : [],
                offers: Array.isArray(raw.offers) ? raw.offers : [],
                referrals: Array.isArray(raw.referrals) ? raw.referrals : []
            };
        } catch (e) {
            return JSON.parse(JSON.stringify(EMPTY));
        }
    }

    function save(db) {
        try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* stockage indisponible */ }
    }

    function uid(prefix) {
        return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function stamp() {
        var d = new Date();
        return d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    function findUser(db, email) {
        var target = String(email || '').toLowerCase();
        for (var i = 0; i < db.users.length; i++) {
            if (db.users[i].email.toLowerCase() === target) { return db.users[i]; }
        }
        return null;
    }

    /* --- CODE DE PARRAINAGE DÉTERMINISTE (EX : WK1A2B3) --- */
    function codeOf(user) {
        if (!user) { return ''; }
        var seed = String(user.id || '') + String(user.email || '');
        var hash = 0;
        for (var i = 0; i < seed.length; i++) { hash = (hash * 31 + seed.charCodeAt(i)) % 1679616; }
        return 'WK' + ('00000' + hash.toString(36).toUpperCase()).slice(-5);
    }

    /* --- RETROUVER UN PARRAIN À PARTIR DE SON CODE --- */
    function findByCode(db, code) {
        var target = String(code || '').trim().toUpperCase();
        if (!target) { return null; }
        for (var i = 0; i < db.users.length; i++) {
            if (codeOf(db.users[i]) === target) { return db.users[i]; }
        }
        return null;
    }

    function sessions() {
        try { return JSON.parse(localStorage.getItem('wikize_session') || 'null'); } catch (e) { return null; }
    }

    function pushTx(user, tx) {
        if (!Array.isArray(user.transactions)) { user.transactions = []; }
        user.transactions.unshift(tx);
    }

    return {
        /* --- AUTHENTIFICATION --- */
        register: function (data) {
            var db = load();
            if (findUser(db, data.email)) { return { success: false, error: 'Un compte utilise déjà cette adresse e-mail.' }; }
            var user = {
                id: uid('user'),
                name: String(data.name || '').trim(),
                phone: String(data.phone || '').trim(),
                email: String(data.email || '').trim(),
                password: String(data.password || ''),
                balance: 1000,
                created: stamp(),
                transactions: []
            };
            pushTx(user, { id: uid('tx'), date: stamp(), label: "Bonus d'inscription WIKIZE", amount: 1000, status: 'validé' });

            /* --- PARRAINAGE : LE PARRAIN REÇOIT 500 FCFA À L'INSCRIPTION DU FILLEUL --- */
            var sponsor = null;
            var refCode = String(data.ref || '').trim().toUpperCase();
            if (refCode) {
                sponsor = findByCode(db, refCode);
                if (sponsor && String(sponsor.email).toLowerCase() === String(user.email).toLowerCase()) {
                    sponsor = null;
                }
            }
            if (sponsor) {
                user.referredBy = sponsor.email;
                user.referralCodeUsed = refCode;
                sponsor.balance = (Number(sponsor.balance) || 0) + 500;
                pushTx(sponsor, { id: uid('tx'), date: stamp(), label: 'Bonus de parrainage — ' + user.name, amount: 500, status: 'validé' });
                db.referrals.unshift({
                    id: uid('ref'),
                    date: stamp(),
                    sponsorEmail: sponsor.email,
                    sponsorName: sponsor.name,
                    filleulEmail: user.email,
                    filleulName: user.name,
                    amount: 500,
                    status: 'validé'
                });
            }

            db.users.push(user);
            save(db);
            localStorage.setItem('wikize_session', JSON.stringify({ email: user.email }));
            return { success: true, user: user, referred: !!sponsor, sponsorName: sponsor ? sponsor.name : '' };
        },

        login: function (email, password) {
            var db = load();
            var user = findUser(db, email);
            if (!user || user.password !== String(password || '')) {
                return { success: false, error: 'E-mail ou mot de passe incorrect.' };
            }
            localStorage.setItem('wikize_session', JSON.stringify({ email: user.email }));
            return { success: true, user: user };
        },

        logout: function () {
            localStorage.removeItem('wikize_session');
        },

        current: function () {
            var s = sessions();
            if (!s || !s.email) { return null; }
            return findUser(load(), s.email);
        },

        /* --- WALLET --- */
        invest: function (label, amount, gain) {
            var user = this.current();
            if (!user) { return { success: false, error: 'Connectez-vous pour investir depuis votre wallet.', needAuth: true }; }
            var db = load();
            var fresh = findUser(db, user.email);
            if (!fresh) { return { success: false, error: 'Compte introuvable.' }; }
            if (fresh.balance < amount) {
                return { success: false, error: 'Solde insuffisant (' + fresh.balance + ' FCFA). Rechargez votre wallet pour investir sur ce niveau.' };
            }
            fresh.balance = fresh.balance - amount;
            pushTx(fresh, { id: uid('tx'), date: stamp(), label: 'Investissement — ' + label, amount: -amount, status: 'validé' });
            pushTx(fresh, { id: uid('tx'), date: stamp(), label: 'Gain estimé — ' + label, amount: gain, status: 'en attente' });
            fresh.balance = fresh.balance + gain;
            db.investments.unshift({ id: uid('inv'), date: stamp(), email: fresh.email, name: fresh.name, label: label, amount: amount, gain: gain, status: 'en cours' });
            save(db);
            return { success: true, balance: fresh.balance };
        },

        withdraw: function (data) {
            var user = this.current();
            if (!user) { return { success: false, error: 'Connectez-vous pour demander un retrait.', needAuth: true }; }
            var amount = Number(data.amount) || 0;
            var db = load();
            var fresh = findUser(db, user.email);
            if (!fresh) { return { success: false, error: 'Compte introuvable.' }; }
            if (amount < 1000) { return { success: false, error: 'Le montant minimum de retrait est de 1000 FCFA.' }; }
            if (amount > fresh.balance) { return { success: false, error: 'Le montant dépasse votre solde disponible (' + fresh.balance + ' FCFA).' }; }
            if (!data.phone || String(data.phone).replace(/[^0-9]/g, '').length < 8) { return { success: false, error: 'Numéro Mobile Money / WhatsApp invalide.' }; }
            if (!data.name || String(data.name).trim().length < 3) { return { success: false, error: 'Indiquez le nom complet du bénéficiaire.' }; }

            fresh.balance = fresh.balance - amount;
            pushTx(fresh, { id: uid('tx'), date: stamp(), label: 'Demande de retrait', amount: -amount, status: 'en attente' });
            db.withdrawals.unshift({
                id: uid('wd'),
                date: stamp(),
                email: fresh.email,
                client: fresh.name,
                beneficiary: String(data.name).trim(),
                phone: String(data.phone).trim(),
                amount: amount,
                status: 'en attente'
            });
            save(db);
            return { success: true, balance: fresh.balance };
        },

        setWithdrawalStatus: function (id, status) {
            var db = load();
            for (var i = 0; i < db.withdrawals.length; i++) {
                if (db.withdrawals[i].id === id) {
                    var before = db.withdrawals[i].status;
                    db.withdrawals[i].status = status;
                    if (status === 'refusé' && before !== 'refusé') {
                        var u = findUser(db, db.withdrawals[i].email);
                        if (u) {
                            u.balance = u.balance + db.withdrawals[i].amount;
                            pushTx(u, { id: uid('tx'), date: stamp(), label: 'Retrait refusé — remboursé', amount: db.withdrawals[i].amount, status: 'validé' });
                        }
                    }
                    break;
                }
            }
            save(db);
        },

        credit: function (email, amount) {
            var db = load();
            var u = findUser(db, email);
            if (!u) { return { success: false, error: 'Aucun compte ne correspond à cet e-mail.' }; }
            var val = Number(amount) || 0;
            if (val <= 0) { return { success: false, error: 'Montant invalide.' }; }
            u.balance = u.balance + val;
            pushTx(u, { id: uid('tx'), date: stamp(), label: 'Rechargement du wallet', amount: val, status: 'validé' });
            save(db);
            return { success: true };
        },

        addMessage: function (m) {
            var db = load();
            db.messages.unshift({ id: uid('msg'), date: stamp(), name: m.name, phone: m.phone, email: m.email, message: m.message });
            save(db);
        },

        addOffer: function (o) {
            var db = load();
            db.offers.unshift({
                id: uid('off'),
                date: stamp(),
                type: o.type,
                title: o.title,
                desc: o.desc,
                price: Number(o.price) || 0,
                image: o.image || 'https://files.cdn-files-a.com/admin/system_photos_stock/normal_696120e3b4056.jpg?ratio=16:9&format=avif'
            });
            save(db);
        },

        removeOffer: function (id) {
            var db = load();
            db.offers = db.offers.filter(function (o) { return o.id !== id; });
            save(db);
        },

        /* --- PARRAINAGE : CODE PERSONNEL, LIEN À PARTAGER ET FILLEULS --- */
        referralCode: function (user) { return codeOf(user); },

        referralLink: function (user) {
            if (!user) { return ''; }
            return 'compte.html?app_ref=' + encodeURIComponent(codeOf(user));
        },

        referrals: function (email) {
            var target = String(email || '').toLowerCase();
            return load().referrals.filter(function (r) {
                return String(r.sponsorEmail || '').toLowerCase() === target;
            });
        },

        referralEarnings: function (email) {
            var total = 0;
            this.referrals(email).forEach(function (r) { total += Number(r.amount) || 0; });
            return total;
        },

        list: function (what) {
            var db = load();
            return Array.isArray(db[what]) ? db[what] : [];
        }
    };
})();