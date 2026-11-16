/* =====================================================
   ONG ADKOUL — Service d'envoi d'e-mails (Supabase / Resend)
   Fichier : email-service.js
   Correction du 16 novembre 2026 :
   - Endpoint réel : smart-endpoint
   - Clé publique envoyée dans apikey
   - Noms isolés pour éviter le doublon de const avec les formulaires
   - Erreurs HTTP et erreurs de réponse affichées dans la console
   ===================================================== */

// Les noms sont spécifiques au service email afin de ne pas entrer en conflit
// avec les constantes SUPABASE_URL et SUPABASE_KEY d'ordre-mission.html.
const ADKOUL_EMAIL_SUPABASE_URL = 'https://mvmzhdvkeromtljnvrow.supabase.co';
const ADKOUL_EMAIL_SUPABASE_KEY = 'sb_publishable_Wd7mDCVh2xZd-mjUxWFxPQ_tjJkdsdh';

// Adresse de notification du service Logistique.
const EMAIL_LOGISTIQUE = 'amague2007@gmail.com';

/**
 * Demande un envoi email à la fonction Edge Supabase.
 * @returns {Promise<{success:boolean, error?:string}>}
 * success=true signifie que la fonction a accepté la requête ;
 * la livraison effective dépend du prestataire d'envoi.
 */
async function envoyerEmail(templateId, destinataire, variables = {}) {
  if (!destinataire || typeof destinataire !== 'string' || !destinataire.includes('@')) {
    console.warn('Email non demandé : destinataire invalide.', destinataire);
    return { success: false, error: 'Destinataire invalide' };
  }

  let subject = '';
  let html = '';

  if (templateId === 'template_demande_recue') {
    subject = `📩 Nouvelle demande — ${variables.type_demande}`;
    html = `<h2>Bonjour ${variables.nom} ${variables.prenom || ''},</h2>
            <p>Votre demande (${variables.type_demande}) a bien été reçue par nos services.</p>
            <ul>
              <li><strong>Destination :</strong> ${variables.destination || '-'}</li>
              <li><strong>Date :</strong> ${variables.date || '-'} ${variables.heure || ''}</li>
              <li><strong>Motif :</strong> ${variables.motif || '-'}</li>
            </ul>
            <p>Cordialement,<br>Le service Logistique - ONG ADKOUL</p>`;
  } else if (templateId === 'template_vehicule') {
    subject = '✅ Votre véhicule est affecté';
    html = `<h2>Bonjour ${variables.nom},</h2>
            <p>Votre demande de sortie de véhicule a été <strong>validée</strong>.</p>
            <ul>
              <li><strong>Chauffeur :</strong> ${variables.chauffeur}</li>
              <li><strong>Véhicule :</strong> ${variables.vehicule}</li>
              <li><strong>Destination :</strong> ${variables.destination}</li>
              <li><strong>Date :</strong> ${variables.date} ${variables.heure ? 'à ' + variables.heure : ''}</li>
            </ul>
            <p>Cordialement,<br>Le service Logistique - ONG ADKOUL</p>`;
  } else if (templateId === 'template_refus') {
    subject = '❌ Votre demande a été refusée';
    html = `<h2>Bonjour ${variables.nom},</h2>
            <p>Nous sommes au regret de vous informer que votre demande pour la destination <strong>${variables.destination}</strong> a été refusée.</p>
            <p><strong>Motif :</strong> ${variables.motif_refus}</p>
            <p>Cordialement,<br>Le service Logistique - ONG ADKOUL</p>`;
  } else if (templateId === 'template_ordre_attente_rh') {
    subject = `📄 Dossier à valider — ${variables.agent}`;
    html = `<h2>Nouveau dossier à valider</h2>
            <p>L'agent <strong>${variables.agent}</strong> (${variables.poste}) attend votre validation.</p>
            <ul>
              <li><strong>Destination :</strong> ${variables.destination}</li>
              <li><strong>Projet :</strong> ${variables.projet}</li>
              <li><strong>Dates :</strong> du ${variables.date_depart} au ${variables.date_retour}</li>
            </ul>`;
  } else {
    subject = variables.subject || 'Notification ONG ADKOUL';
    html = variables.message ? String(variables.message).replace(/\n/g, '<br>') : 'Nouvelle notification.';
  }

  try {
    const response = await fetch(`${ADKOUL_EMAIL_SUPABASE_URL}/functions/v1/smart-endpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ADKOUL_EMAIL_SUPABASE_KEY
      },
      body: JSON.stringify({ to: destinataire, subject, html })
    });

    const rawResponse = await response.text();
    let body = null;
    try { body = rawResponse ? JSON.parse(rawResponse) : null; } catch (_) { /* réponse texte */ }

    if (!response.ok || (body && (body.success === false || body.error))) {
      const detail = body && body.error
        ? (typeof body.error === 'string' ? body.error : JSON.stringify(body.error))
        : (rawResponse || response.statusText || 'Réponse sans détail');
      throw new Error(`HTTP ${response.status} — ${detail}`);
    }

    console.info(`Email accepté par smart-endpoint (${response.status}) pour ${destinataire}.`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Échec de la notification email pour ${destinataire} :`, message);
    return { success: false, error: message };
  }
}
