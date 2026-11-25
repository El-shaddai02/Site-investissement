// Explain: Handles referral code, link generation, sharing, and referral list display.
/* ===== WIKIZE — PAGE PARRAINAGE (CODE, LIEN, COPIE, PARTAGE, FILLEULS) ===== */
document.addEventListener('DOMContentLoaded', function () {
    function el(id) { return document.getElementById(id); }
    function money(n) { return (Number(n) || 0).toLocaleString('fr-FR') + ' FCFA'; }

    var refApp = el('refApp');
    var refGuard = el('refGuard');
    if (!refApp && !refGuard) { return; }
    if (!window.WKStore) { return; }

    var user = window.WKStore.current();
    if (!user) {
        if (refGuard) { refGuard.style.display = 'flex'; }
        if (refApp) { refApp.style.display = 'none'; }
        return;
    }
    if (refGuard) { refGuard.style.display = 'none'; }

    var code = window.WKStore.referralCode(user);
    var relLink = window.WKStore.referralLink(user);
    var absLink = relLink;
    try {
        absLink = new window.URL(relLink, document.baseURI).href;
    } catch (e) {
        absLink = relLink;
    }

    if (refApp) {
        refApp.style.display = 'flex';
        if (el('refCode')) { el('refCode').textContent = code; }
        if (el('refLink')) { el('refLink').value = absLink; }
        var share = el('refShare');
        if (share) {
            var msg = 'Rejoins WIKIZE avec mon lien et reçois 1000 FCFA offerts : ' + absLink;
            share.setAttribute('href', 'https://wa.me/?text=' + encodeURIComponent(msg));
        }
    }

    /* --- COPIE DU LIEN --- */
    var copyBtn = el('refCopy');
    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            var input = el('refLink');
            var fb = el('refFeedback');
            function done(ok) {
                if (!fb) { return; }
                fb.textContent = ok
                    ? 'Lien copié ! Partagez-le pour gagner 500 FCFA par inscription.'
                    : 'Copie impossible : sélectionnez le lien puis copiez-le manuellement.';
                fb.classList.add('is-visible');
                fb.classList.toggle('is-error', !ok);
            }
            if (input && navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(input.value)
                    .then(function () { done(true); })
                    .catch(function () { input.select(); done(false); });
            } else if (input) {
                input.select();
                try { done(document.execCommand('copy')); } catch (e2) { done(false); }
            }
        });
    }

    /* --- STATISTIQUES ET LISTE DES FILLEULS --- */
    var mine = window.WKStore.referrals(user.email);
    if (el('refCount')) { el('refCount').textContent = String(mine.length); }
    if (el('refGain')) { el('refGain').textContent = money(window.WKStore.referralEarnings(user.email)); }

    var list = el('refList');
    if (list) {
        list.innerHTML = '';
        if (!mine.length) {
            var empty = document.createElement('p');
            empty.className = 'wk-hint';
            empty.textContent = 'Aucun filleul pour le moment. Partagez votre lien : chaque inscription vous rapporte 500 FCFA.';
            list.appendChild(empty);
        } else {
            mine.forEach(function (r) {
                var row = document.createElement('div');
                row.className = 'tx-row';

                var icon = document.createElement('span');
                icon.className = 'tx-row__icon';
                icon.innerHTML = '<i class="fa-solid fa-user-group"></i>';

                var main = document.createElement('div');
                main.className = 'tx-row__main';
                var title = document.createElement('strong');
                title.textContent = r.filleulName || 'Nouveau filleul';
                var meta = document.createElement('span');
                meta.textContent = (r.date || '') + ' — inscription validée';
                main.appendChild(title);
                main.appendChild(meta);

                var amount = document.createElement('span');
                amount.className = 'tx-row__amount is-plus';
                amount.textContent = '+' + money(r.amount);

                row.appendChild(icon);
                row.appendChild(main);
                row.appendChild(amount);
                list.appendChild(row);
            });
        }
    }

    /* --- DÉCONNEXION --- */
    document.querySelectorAll('[data-logout]').forEach(function (b) {
        b.addEventListener('click', function () {
            window.WKStore.logout();
            window.location.href = 'compte.html';
        });
    });
});