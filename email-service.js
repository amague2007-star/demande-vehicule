/* ONG ADKOUL — Notifications e-mail par EmailJS
   Version corrigée et complète — 17/11/2026
*/

// Vos vraies clés (récupérées de votre ancien code)
const EMAILJS_PUBLIC_KEY = 'SUbWMSdrTf7JugMrS';
const EMAILJS_SERVICE_ID = 'service_e6k2e76';

// L'adresse qui reçoit les alertes de la logistique
const EMAIL_LOGISTIQUE = 'amague2007@gmail.com';

const EMAIL_ERROR_CODES = {
  NETWORK: 'NETWORK',
  QUOTA: 'QUOTA',
  TEMPLATE_MISSING: 'TEMPLATE_MISSING',
  INVALID_KEY: 'INVALID_KEY',
  UNKNOWN: 'UNKNOWN'
};

let ADKOUL_EMAILJS_QUEUE = Promise.resolve();
let ADKOUL_EMAILJS_LAST_SEND = 0;
let ADKOUL_EMAILJS_INITIALIZED = false;

function adkoulChamp(valeur, defaut = '-') {
  const texte = String(valeur === undefined || valeur === null ? '' : valeur).trim();
  return texte || defaut;
}

if (typeof emailjs !== 'undefined') {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  ADKOUL_EMAILJS_INITIALIZED = true;
}

/**
 * Envoie un email via EmailJS.
 * @param {string} templateId - ID du template EmailJS
 * @param {string} destinataire - Adresse e-mail du destinataire
 * @param {object} params - Variables du template
 * @returns {Promise<{success: boolean, status?: number, error?: string, code?: string}>}
 */
async function envoyerEmail(templateId, destinataire, params = {}) {
  if (typeof emailjs === 'undefined') {
    return { success: false, code: EMAIL_ERROR_CODES.NETWORK, error: 'EmailJS SDK non chargé' };
  }
  if (!templateId || !destinataire) {
    return { success: false, code: EMAIL_ERROR_CODES.TEMPLATE_MISSING, error: 'templateId ou destinataire manquant' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinataire.trim())) {
    return { success: false, error: 'Adresse email du destinataire invalide.' };
  }

  // Préparation du message selon le template
  const nom = [params.nom, params.prenom].filter(Boolean).join(' ');
  const date = adkoulChamp(params.date);
  const heure = adkoulChamp(params.heure, '');
  let subject = '';
  let message = '';

  if (templateId === 'template_demande_recue') {
    subject = `Nouvelle demande — ${adkoulChamp(params.type_demande)}`;
    message = `Bonjour ${adkoulChamp(nom, 'cher collègue')},\n\nVotre demande (${adkoulChamp(params.type_demande)}) a été enregistrée.\nDestination : ${adkoulChamp(params.destination)}\nDate : ${date}${heure ? ' à ' + heure : ''}\nMotif : ${adkoulChamp(params.motif)}\n\nCordialement,\nService Logistique — ONG ADKOUL`;
  } else if (templateId === 'template_vehicule') {
    subject = 'Votre véhicule est affecté — ONG ADKOUL';
    message = `Bonjour ${adkoulChamp(params.nom, 'cher collègue')},\n\nVotre demande de sortie de véhicule a été validée.\nChauffeur : ${adkoulChamp(params.chauffeur)}\nVéhicule : ${adkoulChamp(params.vehicule)}\nDestination : ${adkoulChamp(params.destination)}\nDate : ${date}${heure ? ' à ' + heure : ''}\n\nCordialement,\nService Logistique — ONG ADKOUL`;
  } else if (templateId === 'template_refus') {
    subject = 'Votre demande de véhicule — ONG ADKOUL';
    message = `Bonjour ${adkoulChamp(params.nom, 'cher collègue')},\n\nVotre demande concernant ${adkoulChamp(params.destination)} a été refusée.\nMotif : ${adkoulChamp(params.motif_refus)}\nDate : ${date}\n\nCordialement,\nService Logistique — ONG ADKOUL`;
  } else if (templateId === 'template_ordre_attente_rh') {
    subject = `Ordre de mission à valider — ${adkoulChamp(params.agent)}`;
    message = `Nouvelle demande d'ordre de mission à valider.\nAgent : ${adkoulChamp(params.agent)}\nPoste : ${adkoulChamp(params.poste)}\nDestination : ${adkoulChamp(params.destination)}\nProjet : ${adkoulChamp(params.projet)}\nDépart : ${adkoulChamp(params.date_depart)}\nRetour : ${adkoulChamp(params.date_retour)}\n\nService Logistique — ONG ADKOUL`;
  } else if (templateId === 'template_creation_user') {
    subject = 'Votre compte de gestion ONG ADKOUL a été créé';
    message = `Bonjour ${adkoulChamp(params.nom)},\n\nVotre compte a été créé.\nIdentifiant : ${adkoulChamp(params.email)}\nRôle : ${adkoulChamp(params.role)}\nAccès : ${adkoulChamp(params.lien_connexion)}\n\nDemandez vos informations d'accès via un canal sécurisé.\nONG ADKOUL`;
  } else {
    subject = adkoulChamp(params.subject, 'Notification ONG ADKOUL');
    message = adkoulChamp(params.message, 'Nouvelle notification ONG ADKOUL.');
  }

  // File d'attente pour éviter les erreurs "Too Many Requests" d'EmailJS
  const tache = ADKOUL_EMAILJS_QUEUE.then(async () => {
    try {
      if (!ADKOUL_EMAILJS_INITIALIZED) {
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
        ADKOUL_EMAILJS_INITIALIZED = true;
      }
      const attente = Math.max(0, 1100 - (Date.now() - ADKOUL_EMAILJS_LAST_SEND));
      if (attente) await new Promise(resoudre => setTimeout(resoudre, attente));
      
      ADKOUL_EMAILJS_LAST_SEND = Date.now();
      
      const resultat = await emailjs.send(
        EMAILJS_SERVICE_ID,
        templateId, // On utilise le templateId passé en paramètre (plus flexible)
        { 
          to_email: destinataire.trim(), 
          subject: subject, 
          message: message,
          ...params // On ajoute les autres variables au cas où
        }
      );

      const ok = resultat && (resultat.status === 200 || resultat.status === 201);
      if (ok) {
        console.info('EmailJS a accepté un email pour :', destinataire, resultat.status);
        return { success: true, status: resultat.status, text: resultat.text };
      }
      return {
        success: false,
        status: resultat?.status,
        error: resultat?.text || 'Réponse EmailJS non confirmée',
        code: EMAIL_ERROR_CODES.UNKNOWN
      };

    } catch (err) {
      console.error('[EmailJS] Erreur envoi :', err);
      const msgError = err?.text || err?.message || 'Erreur inconnue';
      
      let code = EMAIL_ERROR_CODES.UNKNOWN;
      const lower = String(msgError).toLowerCase();
      if (lower.includes('quota') || lower.includes('limit')) code = EMAIL_ERROR_CODES.QUOTA;
      else if (lower.includes('template')) code = EMAIL_ERROR_CODES.TEMPLATE_MISSING;
      else if (lower.includes('key') || lower.includes('auth')) code = EMAIL_ERROR_CODES.INVALID_KEY;
      else if (lower.includes('network') || lower.includes('fetch')) code = EMAIL_ERROR_CODES.NETWORK;

      return { success: false, code, error: msgError };
    }
  });
  
  ADKOUL_EMAILJS_QUEUE = tache.then(() => undefined, () => undefined);
  return tache;
}

window.envoyerEmail = envoyerEmail;
window.EMAIL_ERROR_CODES = EMAIL_ERROR_CODES;
window.EMAIL_LOGISTIQUE = EMAIL_LOGISTIQUE;
