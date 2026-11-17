/* ONG ADKOUL — Notifications e-mail par EmailJS
   Restaure le service Gmail historique, sans modifier Supabase ou Microsoft 365
   Version corrigée et complète — 17/11/2026
*/

// ⚠️ Remplacer par vos vraies clés EmailJS (dashboard.emailjs.com)
const EMAILJS_PUBLIC_KEY = "VOTRE_PUBLIC_KEY_EMAILJS";
const EMAILJS_SERVICE_ID = "VOTRE_SERVICE_ID_EMAILJS";

// Code d'erreur normalisé pour l'appelant
const EMAIL_ERROR_CODES = {
  NETWORK: 'NETWORK',
  QUOTA: 'QUOTA',
  TEMPLATE_MISSING: 'TEMPLATE_MISSING',
  INVALID_KEY: 'INVALID_KEY',
  UNKNOWN: 'UNKNOWN'
};

if (typeof emailjs !== 'undefined') {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

/**
 * Envoie un email via EmailJS.
 * @param {string} templateId - ID du template EmailJS
 * @param {string} destinataire - Adresse e-mail du destinataire
 * @param {object} params - Variables du template (nom, destination, etc.)
 * @returns {Promise<{success: boolean, status?: number, error?: string, code?: string}>}
 */
async function envoyerEmail(templateId, destinataire, params = {}) {
  if (typeof emailjs === 'undefined') {
    return { success: false, code: EMAIL_ERROR_CODES.NETWORK, error: 'EmailJS SDK non chargé' };
  }
  if (!templateId || !destinataire) {
    return { success: false, code: EMAIL_ERROR_CODES.TEMPLATE_MISSING, error: 'templateId ou destinataire manquant' };
  }

  try {
    const res = await emailjs.send(EMAILJS_SERVICE_ID, templateId, {
      to_email: destinataire,
      ...params
    });

    const ok = res && (res.status === 200 || res.status === 201);
    if (ok) {
      return { success: true, status: res.status, text: res.text };
    }
    return {
      success: false,
      status: res?.status,
      error: res?.text || 'Réponse EmailJS non confirmée',
      code: EMAIL_ERROR_CODES.UNKNOWN
    };
  } catch (err) {
    console.error('[EmailJS] Erreur envoi :', err);
    const message = err?.text || err?.message || 'Erreur inconnue';

    let code = EMAIL_ERROR_CODES.UNKNOWN;
    const lower = String(message).toLowerCase();
    if (lower.includes('quota') || lower.includes('limit')) code = EMAIL_ERROR_CODES.QUOTA;
    else if (lower.includes('template')) code = EMAIL_ERROR_CODES.TEMPLATE_MISSING;
    else if (lower.includes('key') || lower.includes('auth')) code = EMAIL_ERROR_CODES.INVALID_KEY;
    else if (lower.includes('network') || lower.includes('fetch')) code = EMAIL_ERROR_CODES.NETWORK;

    return { success: false, code, error: message };
  }
}

// Exposition globale explicite (utilisée par admin.html via <script src>)
window.envoyerEmail = envoyerEmail;
window.EMAIL_ERROR_CODES = EMAIL_ERROR_CODES;
