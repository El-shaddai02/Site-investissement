// Explain: Levels page filters, sorting, gain calculator and wallet payment.
/* ===== WIKIZE — NIVEAUX : FILTRES, TRI, CALCULATEUR ET PAIEMENT WALLET ===== */
document.addEventListener('DOMContentLoaded', function () {
    function money(n) { return (Number(n) || 0).toLocaleString('fr-FR') + ' FCFA'; }

    /* --- FILTRES ET TRI --- */
    var grid = document.getElementById('levelsGrid');
    if (grid) {
        var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-level]'));
        var chips = document.querySelectorAll('[data-filter]');
        chips.forEach(function (chip) {
            chip.addEventListener('click', function () {
                chips.forEach(function (c) { c.classList.remove('is-active'); });
                chip.classList.add('is-active');
                var wanted = chip.getAttribute('data-filter');
                cards.forEach(function (card) {
                    var visible = (wanted === 'all') || (card.getAttribute('data-type') === wanted);
                    card.style.display = visible ? '' : 'none';
                });
            });
        });

        var sortSelect = document.getElementById('levelSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', function () {
                var mode = sortSelect.value;
                var sorted = cards.slice();
                sorted.sort(function (a, b) {
                    var pa = Number(a.dataset.price) || 0;
                    var pb = Number(b.dataset.price) || 0;
                    var ga = Number(a.dataset.gain) || 0;
                    var gb = Number(b.dataset.gain) || 0;
                    if (mode === 'price-asc') { return pa - pb; }
                    if (mode === 'price-desc') { return pb - pa; }
                    if (mode === 'gain-desc') { return gb - ga; }
                    return (Number(a.dataset.id) || 0) - (Number(b.dataset.id) || 0);
                });
                sorted.forEach(function (card) { grid.appendChild(card); });
            });
        }
    }

    /* --- CALCULATEUR --- */
    var calcSelect = document.getElementById('calcSelect');
    if (calcSelect) {
        function updateCalc() {
            var opt = calcSelect.options[calcSelect.selectedIndex];
            if (!opt) { return; }
            document.getElementById('calcInvest').textContent = money(opt.dataset.invest);
            document.getElementById('calcDuree').textContent = opt.dataset.duree || '—';
            document.getElementById('calcGain').textContent = '+ ' + money(opt.dataset.gain);
            document.getElementById('calcTotal').textContent = money(opt.dataset.total);
        }
        calcSelect.addEventListener('change', updateCalc);
        updateCalc();
    }

    /* --- PAIEMENT AVEC LE WALLET --- */
    document.querySelectorAll('.js-wallet-pay').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var label = btn.getAttribute('data-label') || 'Niveau';
            var price = Number(btn.getAttribute('data-price')) || 0;
            var gain = Number(btn.getAttribute('data-gain')) || 0;
            var res = window.WKStore.invest(label, price, gain);
            if (res.success) {
                btn.textContent = 'Investi — solde ' + money(res.balance);
                btn.classList.remove('btn-wk--primary');
                btn.classList.add('btn-wk--whatsapp');
                btn.disabled = true;
                window.setTimeout(function () { window.location.href = 'wallet.html'; }, 1200);
                return;
            }
            if (res.needAuth) {
                window.alert('Connectez-vous pour payer avec votre wallet. Vous recevrez 1000 FCFA offerts à l\'inscription.');
                window.location.href = 'compte.html';
                return;
            }
            window.alert(res.error);
        });
    });
});