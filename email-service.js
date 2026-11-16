/* =====================================================
   ONG ADKOUL — Service d'envoi d'e-mails centralisé
   Fichier : email-service.js
   ===================================================== */

const EMAILJS_PUBLIC_KEY = "SUbWMSdrTf7JugMrS";
const EMAILJS_SERVICE_ID = "service_e6k2e76";

// ⚠️ ADRESSE DE LA LOGISTIQUE (Reçoit les nouvelles demandes)
const EMAIL_LOGISTIQUE = "amague2007@gmail.com";
// Initialisation UNE SEULE FOIS
if (typeof emailjs !== 'undefined') {
  emailjs.init(EMAILJS_PUBLIC_KEY);
} else {
  console.warn("⚠️ EmailJS n'est pas chargé. Vérifiez le CDN dans le <head>.");
}

/**
 * Envoie un e-mail via EmailJS avec gestion d'erreur silencieuse
 * @param {string} templateId - ID du template EmailJS (ex: 'template_demande_recue')
 * @param {string} destinataire - Adresse email du destinataire
 * @param {object} variables - Variables à injecter dans le template
 * @returns {Promise<{success:boolean, error?:any}>}
 */
async function envoyerEmail(templateId, destinataire, variables) {
  // 1. Vérification basique du destinataire
  if (!destinataire || !destinataire.includes('@')) {
    console.warn(`⚠️ Email non envoyé (destinataire invalide) :`, destinataire);
    return { success: false, error: 'Destinataire invalide' };
  }

  // 2. Vérification que EmailJS est bien chargé
  if (typeof emailjs === 'undefined') {
    console.error("❌ Impossible d'envoyer l'e-mail : la bibliothèque EmailJS n'est pas chargée.");
    return { success: false, error: 'EmailJS non chargé' };
  }

  try {
    // 3. Envoi de l'e-mail
    const response = await emailjs.send(EMAILJS_SERVICE_ID, templateId, {
      to_email: destinataire, // Destinataire principal
      email: destinataire,    // Sécurité : certains templates utilisent {{email}}
      ...variables
    });

    console.log(`✅ Email envoyé à ${destinataire} (template: ${templateId})`, response.status);
    return { success: true };

  } catch (err) {
    // 4. Gestion de l'erreur (ne bloque pas l'application si l'e-mail échoue)
    console.error(`❌ Échec de l'envoi de l'e-mail ${templateId} pour ${destinataire}:`, err);
    return { success: false, error: err };
  }
}
