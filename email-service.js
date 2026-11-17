/* ONG ADKOUL — Notifications e-mail par EmailJS
   Version finale et sécurisée — 17/11/2026
*/

const EMAILJS_PUBLIC_KEY = 'SUbWMSdrTf7JugMrS';
const EMAILJS_SERVICE_ID = 'service_e6k2e76';
const EMAILJS_TEMPLATE_ID = 'template_gd96rfl'; // Le template unique qui marche
const EMAIL_LOGISTIQUE = 'amague2007@gmail.com';

let ADKOUL_EMAILJS_QUEUE = Promise.resolve();
let ADKOUL_EMAILJS_LAST_SEND = 0;
let ADKOUL_EMAILJS_INITIALIZED = false;

// Initialisation au chargement
if (typeof emailjs !== 'undefined') {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  ADKOUL_EMAILJS_INITIALIZED = true;
}

function adkoulChamp(valeur, defaut = '-') {
  const texte = String(valeur === undefined || valeur === null ? '' : valeur).trim();
  return texte || defaut;
}

/**
 * Envoie un email via EmailJS de manière sécurisée et sans doublon.
 */
async function envoyerEmail(templateId, destinataire, params = {}) {
  if (typeof emailjs === 'undefined') {
    return { success: false, error: 'EmailJS SDK non chargé' };
  }
  if (!destinataire || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinataire.trim())) {
    return { success: false, error: 'Adresse email invalide.' };
  }

  // Préparation des textes selon le type de demande
  const nom = [params.nom, params.prenom].filter(Boolean).join(' ');
  const date = adkoulChamp(params.date);
  const heure = adkoulChamp(params.heure, '');
  let subject = 'Notification ONG ADKOUL';
  let message = 'Nouvelle notification.';

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
    // Cas par défaut (ex: template_gd96rfl)
    subject = adkoulChamp(params.subject, 'Notification ONG ADKOUL');
    message = adkoulChamp(params.message, 'Nouvelle notification ONG ADKOUL.');
  }

  // File d'attente (Anti-spam EmailJS)
  const tache = ADKOUL_EMAILJS_QUEUE.then(async () => {
    try {
      if (!ADKOUL_EMAILJS_INITIALIZED) {
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
        ADKOUL_EMAILJS_INITIALIZED = true;
      }
      
      // Pause de 1,1 sec pour éviter l'erreur "Too Many Requests"
      const attente = Math.max(0, 1100 - (Date.now() - ADKOUL_EMAILJS_LAST_SEND));
      if (attente) await new Promise(resoudre => setTimeout(resoudre, attente));
      
      ADKOUL_EMAILJS_LAST_SEND = Date.now();
      
      // Envoi via le template unique (celui qui fonctionne)
      const resultat = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID, 
        { 
          to_email: destinataire.trim(), 
          subject: subject, 
          message: message 
        }
      );

      if (resultat && (resultat.status === 200 || resultat.status === 201)) {
        return { success: true, status: resultat.status };
      }
      return { success: false, error: resultat?.text || 'Réponse EmailJS non confirmée' };
    } catch (err) {
      console.error('[EmailJS] Erreur envoi :', err);
      return { success: false, error: err?.text || err?.message || 'Erreur inconnue' };
    }
  });
  
  ADKOUL_EMAILJS_QUEUE = tache.then(() => undefined, () => undefined);
  return tache;
}

window.envoyerEmail = envoyerEmail;
window.EMAIL_LOGISTIQUE = EMAIL_LOGISTIQUE;
