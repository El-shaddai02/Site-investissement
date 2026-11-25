// Explain: WIKIZE AI chatbot widget with quick replies and WhatsApp fallback.
/* ===== WIKIZE — CHATBOT INTELLIGENT 24/7 ===== */
document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.getElementById('chatbotToggle');
    var panel = document.getElementById('chatbotPanel');
    var closeBtn = document.getElementById('chatbotClose');
    var log = document.getElementById('chatbotLog');
    var form = document.getElementById('chatbotForm');
    var input = document.getElementById('chatbotInput');
    var quick = document.getElementById('chatbotQuick');
    if (!toggle || !panel || !log || !form || !input) { return; }

    var history = [];
    var QUICK = [
        { label: 'Louer un vélo', q: 'Je veux louer un vélo, comment faire ?' },
        { label: 'Expliquer les niveaux', q: 'Explique-moi les niveaux d\'investissement WIKIZE.' },
        { label: 'Wallet & 1000 FCFA', q: 'Comment fonctionnent le wallet et les 1000 FCFA offerts ?' },
        { label: 'Retrait des fonds', q: 'Comment retirer mes fonds ?' },
        { label: 'Parler à un agent', q: 'Je veux parler à un agent humain.' }
    ];

    var SYSTEM = 'Tu es WIKIZE, assistant virtuel de WIKIZE, entreprise africaine de location de vélos, motos et voitures et de niveaux d\'investissement. Réponds en français, de façon brève (3 phrases max), chaleureuse et claire. Informations : inscription en 30 secondes avec 1000 FCFA offerts ; niveaux : N1 vélo 1500 FCFA investis / 300 de gain, N2 vélo 2500/500, N3 moto 3500/700, N4 moto 5000/900, N5 voiture spéciale 7000/1000, N6 voiture spéciale 10000/1500 ; retrait minimum 1000 FCFA traité sous 24 à 72 heures ; support WhatsApp +228 96 63 57 90, 7j/7 24h/24. Pour toute action concrète (réserver, payer), propose le lien WhatsApp ou les pages concernées.';

    function addMsg(text, who) {
        var d = document.createElement('div');
        d.className = 'chatbot-msg chatbot-msg--' + who;
        d.textContent = text;
        log.appendChild(d);
        log.scrollTop = log.scrollHeight;
        return d;
    }

    function renderQuick() {
        quick.innerHTML = '';
        QUICK.forEach(function (item) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'chatbot-quick__btn';
            b.textContent = item.label;
            b.addEventListener('click', function () { send(item.q); });
            quick.appendChild(b);
        });
    }

    function fallback(text) {
        var t = text.toLowerCase();
        if (t.indexOf('humain') !== -1 || t.indexOf('agent') !== -1 || t.indexOf('conseiller') !== -1) {
            return 'Bien sûr ! Écrivez-nous sur WhatsApp au +228 96 63 57 90 : un conseiller vous répond immédiatement, 7j/7.';
        }
        if (t.indexOf('vélo') !== -1 || t.indexOf('velo') !== -1) { return 'Nos vélos se louent à partir de 2 500 FCFA par jour. Ouvrez la page Vélos pour choisir, puis réservez sur WhatsApp en 1 minute.'; }
        if (t.indexOf('moto') !== -1) { return 'Nos motos se louent à partir de 7 000 FCFA par jour. Ouvrez la page Motos, choisissez votre modèle et réservez sur WhatsApp.'; }
        if (t.indexOf('voiture') !== -1) { return 'Nos voitures se louent à partir de 20 000 FCFA par jour. Ouvrez la page Voitures pour découvrir berlines, SUV et sportives.'; }
        if (t.indexOf('niveau') !== -1 || t.indexOf('invest') !== -1) { return 'Il y a 6 niveaux : N1 vélo 1500 FCFA (gain 300), N2 vélo 2500 (500), N3 moto 3500 (700), N4 moto 5000 (900), N5 voiture 7000 (1000), N6 voiture 10000 (1500). Voir la page Niveaux pour le détail.'; }
        if (t.indexOf('1000') !== -1 || t.indexOf('wallet') !== -1 || t.indexOf('bonus') !== -1) { return 'Créez votre compte : vous recevez automatiquement 1000 FCFA dans votre wallet, visibles dans votre tableau de bord dès la première connexion.'; }
        if (t.indexOf('retrait') !== -1 || t.indexOf('retirer') !== -1) { return 'Le retrait minimum est de 1000 FCFA et il est traité sous 24 à 72 heures. Ouvrez la page Retrait pour envoyer votre demande et suivre son statut.'; }
        if (t.indexOf('contact') !== -1 || t.indexOf('whatsapp') !== -1) { return 'Vous pouvez nous joindre sur WhatsApp au +228 96 63 57 90, par e-mail à Wikitogo@gmail.com, ou via le formulaire de contact.'; }
        return 'Je peux vous aider à choisir un vélo, comprendre les niveaux d\'investissement, utiliser votre wallet ou demander un retrait. Dites-moi ce que vous souhaitez !';
    }

    function send(text) {
        var message = String(text || '').trim();
        if (!message) { return; }
        addMsg(message, 'user');
        history.push({ role: 'user', content: message });
        var typing = addMsg('…', 'bot');

        var wantsHuman = message.toLowerCase().indexOf('humain') !== -1 || message.toLowerCase().indexOf('agent') !== -1;

        if (!window.PluginsSystem) { typing.textContent = fallback(message); return; }

        window.PluginsSystem.sendRequest('ai_text', {
            messages: history.slice(-8),
            system_prompt: SYSTEM,
            model: 'cheap',
            max_tokens: 350
        }).then(function (r) {
            var answer = (r && r.success && r.response) ? r.response : fallback(message);
            typing.textContent = answer;
            history.push({ role: 'assistant', content: answer });
            if (wantsHuman) {
                var wa = document.createElement('a');
                wa.className = 'chatbot-quick__btn';
                wa.style.marginTop = '.4rem';
                wa.href = 'https://wa.me/22896635790';
                wa.target = '_blank';
                wa.rel = 'noopener';
                wa.textContent = 'Ouvrir WhatsApp';
                log.appendChild(wa);
                log.scrollTop = log.scrollHeight;
            }
        }).catch(function () {
            typing.textContent = fallback(message);
        });
    }

    function openPanel() {
        panel.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
        if (!log.childElementCount) {
            addMsg('Bonjour 👋 Je suis WIKIZE, votre assistant. Vélo, moto, voiture, niveaux, wallet ou retrait : comment puis-je vous aider ?', 'bot');
            renderQuick();
        }
        input.focus();
    }

    function closePanel() {
        panel.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
    }

    toggle.addEventListener('click', function () {
        if (panel.classList.contains('is-open')) { closePanel(); } else { openPanel(); }
    });
    closeBtn.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closePanel(); } });
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        send(input.value);
        input.value = '';
    });
});