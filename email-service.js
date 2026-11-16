/* =====================================================
   ONG ADKOUL — Service d'envoi d'e-mails centralisé
   ===================================================== */

const EMAILJS_PUBLIC_KEY = "SUbWMSdrTf7JugMrS";
const EMAILJS_SERVICE_ID = "service_e6k2e76";

// ⚠️ À PERSONNALISER : adresse de la logistique
const EMAIL_LOGISTIQUE = "logistique@ong-adkoul.org";

// Initialisation UNE SEULE FOIS
if (typeof emailjs !== 'undefined') {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

/**
 * Envoie un e-mail via EmailJS avec gestion d'erreur silencieuse
 * @param {string} templateId - ID du template EmailJS
 * @param {string} destinataire - Adresse email du destinataire
 * @param {object} variables - Variables du template
 * @returns {Promise<{success:boolean, error?:any}>}
 */
async function envoyerEmail(templateId, destinataire, variables) {
  if (!destinataire || !destinataire.includes('@')) {
    console.warn('⚠️ Email non envoyé : destinataire invalide', destinataire);
    return { success: false, error: 'Destinataire invalide' };
  }
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, templateId, {
      to_email: destinataire,
      ...variables
    });
    console.log(`✅ Email envoyé à ${destinataire} (${templateId})`);
    return { success: true };
  } catch (err) {
    console.error(`❌ Échec email ${templateId} pour ${destinataire}:`, err);
    return { success: false, error: err };
  }
}
