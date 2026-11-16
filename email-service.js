/* =====================================================
   ONG ADKOUL — Service d'envoi d'e-mails (via Supabase & Resend)
   Fichier : email-service.js
   ===================================================== */

const SUPABASE_URL = "https://mvmzhdvkeromtljnvrow.supabase.co";
const SUPABASE_KEY = "sb_publishable_Wd7mDCVh2xZd-mjUxWFxPQ_tjJkdsdh";

// ⚠️ ADRESSE DE LA LOGISTIQUE (Reçoit les alertes)
const EMAIL_LOGISTIQUE = "amague2007@gmail.com";

/**
 * Envoie un e-mail en appelant la fonction Edge de Supabase
 * @param {string} templateId - Type de message (ex: 'template_demande_recue')
 * @param {string} destinataire - Adresse email du destinataire
 * @param {object} variables - Variables à injecter dans le message
 * @returns {Promise<{success:boolean, error?:any}>}
 */
async function envoyerEmail(templateId, destinataire, variables) {
  // 1. Vérification basique du destinataire
  if (!destinataire || !destinataire.includes('@')) {
    console.warn(`⚠️ Email non envoyé (destinataire invalide) :`, destinataire);
    return { success: false, error: 'Destinataire invalide' };
  }

  let subject = "";
  let html = "";

  // 2. Construction du message selon le type
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
    subject = `✅ Votre véhicule est affecté`;
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
    subject = `❌ Votre demande a été refusée`;
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
    // Pour la validation RH finale
    subject = variables.subject || "Notification ONG ADKOUL";
    html = variables.message ? variables.message.replace(/\n/g, '<br>') : "Nouvelle notification.";
  }

  // 3. Envoi via la fonction Edge de Supabase
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        to: destinataire,
        subject: subject,
        html: html
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error("Erreur Supabase : " + errorText);
    }

    console.log(`✅ Email envoyé à ${destinataire} via Supabase/Resend`);
    return { success: true };

  } catch (err) {
    console.error(`❌ Échec email pour ${destinataire}:`, err);
    return { success: false, error: err };
  }
}
