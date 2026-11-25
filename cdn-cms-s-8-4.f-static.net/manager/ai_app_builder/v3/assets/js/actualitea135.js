// Explain: News page filtering by category and search over articles.
/* ===== WIKIZE — ACTUALITÉ : FILTRES PAR CATÉGORIE ET RECHERCHE ===== */
document.addEventListener('DOMContentLoaded', function () {
    var grid = document.getElementById('newsGrid');
    if (!grid) { return; }
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.news-card'));
    var chips = document.querySelectorAll('[data-news-filter]');
    var search = document.getElementById('newsSearch');
    var status = document.getElementById('newsStatus');

    function applyFilter() {
        var active = document.querySelector('[data-news-filter].is-active');
        var cat = active ? active.getAttribute('data-news-filter') : 'all';
        var q = search ? search.value.toLowerCase().trim() : '';
        var shown = 0;
        cards.forEach(function (card) {
            var okCat = (cat === 'all') || (card.getAttribute('data-cat') === cat);
            var okText = !q || (card.getAttribute('data-title') || '').toLowerCase().indexOf(q) !== -1;
            var visible = okCat && okText;
            card.style.display = visible ? '' : 'none';
            if (visible) { shown++; }
        });
        if (status) {
            status.textContent = shown ? shown + ' actualité(s) affichée(s).' : 'Aucune actualité ne correspond à votre recherche.';
        }
    }

    chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            chips.forEach(function (c) { c.classList.remove('is-active'); });
            chip.classList.add('is-active');
            applyFilter();
        });
    });

    if (search) {
        search.addEventListener('input', function () {
            var q = search.value.trim();
            if (q.length < 3 || !window.DataSystem) { applyFilter(); return; }
            window.DataSystem.dataSearch(['news_articles'], q).then(function (r) {
                if (!r || !r.success || !Array.isArray(r.results)) { applyFilter(); return; }
                var found = r.results.map(function (row) { return String(row.title || '').toLowerCase(); });
                cards.forEach(function (card) {
                    var title = (card.getAttribute('data-title') || '').toLowerCase();
                    var match = found.indexOf(title) !== -1;
                    card.style.display = match ? '' : 'none';
                });
                if (status) { status.textContent = r.count + ' résultat(s) pour « ' + q + ' ».'; }
            }).catch(function () { applyFilter(); });
        });
    }

    applyFilter();
});