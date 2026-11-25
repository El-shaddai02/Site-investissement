// Explain: Contact form validation, submission and confirmation email.
/* ===== WIKIZE — FORMULAIRE DE CONTACT (NOTIFICATION ÉQUIPE + E-MAIL DE CONFIRMATION) ===== */
document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('contactForm');
    if (!form) { return; }
    var feedback = document.getElementById('contactFeedback');
    var waLink = document.getElementById('contactWhatsApp');

    function show(msg, ok) {
        if (!feedback) { return; }
        feedback.textContent = msg;
        feedback.classList.add('is-visible');
        feedback.classList.toggle('is-error', !ok);
    }

    function confirmationEmail(name, email) {
        if (!window.PluginsSystem) { return; }
        var html = '<div style="font-family:Inter,Arial,sans-serif;color:#111827;">' +
            '<h2 style="color:#0A3D91;font-family:Poppins,Arial,sans-serif;">Bonjour ' + name + ',</h2>' +
            '<p>Merci d\'avoir contacté <strong>WIKIZE</strong>. Nous avons bien reçu votre message et notre équipe vous répond en moins de 24 heures.</p>' +
            '<p style="background:#F4F6FB;border-left:4px solid #FFC107;padding:12px;border-radius:8px;">Besoin d\'une réponse immédiate ? Écrivez-nous sur WhatsApp : <strong>+228 96 63 57 90</strong> (7j/7, 24h/24).</p>' +
            '<p style="color:#5B6478;font-size:13px;">WIKIZE — Roulez simplement.<br>Wikitogo@gmail.com</p></div>';
        window.PluginsSystem.sendRequest('send_email', {
            to: email,
            subject: 'WIKIZE — Merci pour votre message',
            body_html: html,
            reply_to: 'Wikitogo@gmail.com'
        }).catch(function () { /* la confirmation est optionnelle */ });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = form.fullName.value.trim();
        var phone = form.phone.value.trim();
        var email = form.email.value.trim();
        var message = form.message.value.trim();

        if (name.length < 3) { show('Indiquez votre nom complet.', false); return; }
        if (phone.replace(/[^0-9]/g, '').length < 8) { show('Numéro WhatsApp invalide.', false); return; }
        if (!/^\S+@\S+\.\S+$/.test(email)) { show('Adresse e-mail invalide.', false); return; }
        if (message.length < 5) { show('Écrivez votre message.', false); return; }

        if (!window.MessagesSystem) { show('Service momentanément indisponible. Écrivez-nous sur WhatsApp.', false); return; }

        window.MessagesSystem.submit([
            { label: 'Nom complet', value: name, type: 'text' },
            { label: 'WhatsApp', value: phone, type: 'tel' },
            { label: 'E-mail', value: email, type: 'email' },
            { label: 'Message', value: message, type: 'textarea' }
        ], form).then(function (r) {
            if (!r.success) { show(r.error || 'Envoi impossible pour le moment. Réessayez.', false); return; }
            if (window.WKStore) { window.WKStore.addMessage({ name: name, phone: phone, email: email, message: message }); }
            show('Merci ' + name + ' ! Votre message est bien reçu — réponse en moins de 24 h.', true);
            if (waLink) {
                waLink.setAttribute('href', 'https://wa.me/22896635790?text=' + encodeURIComponent('Bonjour WIKIZE, je suis ' + name + '. ' + message));
                waLink.classList.remove('hidden-wk');
            }
            confirmationEmail(name, email);
            form.reset();
        }).catch(function () {
            show('Connexion impossible. Réessayez ou écrivez-nous sur WhatsApp.', false);
        });
    });
});