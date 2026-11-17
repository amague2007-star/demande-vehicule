/* ONG ADKOUL — Notifications e-mail par EmailJS (préparation du 16/11/2026)
   Restaure le service Gmail historique, sans modifier Supabase ou Microsoft 365.
   À utiliser seulement après vérification du modèle EmailJS template_gd96rfl.
   Les identifiants ci-dessous sont des identifiants PUBLICS, issus de l'ancien code GitHub.
*/

const ADKOUL_EMAILJS_PUBLIC_KEY = 'SUbWMSdrTf7JugMrS';
const ADKOUL_EMAILJS_SERVICE_ID = 'service_e6k2e76';
const ADKOUL_EMAILJS_TEMPLATE_ID = 'template_gd96rfl';
const EMAIL_LOGISTIQUE = 'amague2007@gmail.com';

let ADKOUL_EMAILJS_QUEUE = Promise.resolve();
let ADKOUL_EMAILJS_LAST_SEND = 0;
let ADKOUL_EMAILJS_INITIALIZED = false;

function adkoulChamp(valeur, defaut = '-') {
  const texte = String(valeur === undefined || valeur === null ? '' : valeur).trim();
  return texte || defaut;
}

/**
 * Fonction compatible avec les appels existants de vehicule.html,
 * ordre-mission.html et admin.html.
 * success:true = EmailJS a accepté la demande d'envoi ; pas de garantie de réception.
 */
async function envoyerEmail(templateId, destinataire, variables = {}) {
  if (typeof destinataire !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinataire.trim())) {
    return { success: false, error: 'Adresse email du destinataire invalide.' };
  }

  const nom = [variables.nom, variables.prenom].filter(Boolean).join(' ');
  const date = adkoulChamp(variables.date);
  const heure = adkoulChamp(variables.heure, '');
  let subject = '';
  let message = '';

  if (templateId === 'template_demande_recue') {
    subject = `Nouvelle demande — ${adkoulChamp(variables.type_demande)}`;
    message = `Bonjour ${adkoulChamp(nom, 'cher collègue')},\n\nVotre demande (${adkoulChamp(variables.type_demande)}) a été enregistrée.\nDestination : ${adkoulChamp(variables.destination)}\nDate : ${date}${heure ? ' à ' + heure : ''}\nMotif : ${adkoulChamp(variables.motif)}\n\nCordialement,\nService Logistique — ONG ADKOUL`;
  } else if (templateId === 'template_vehicule') {
    subject = 'Votre véhicule est affecté — ONG ADKOUL';
    message = `Bonjour ${adkoulChamp(variables.nom, 'cher collègue')},\n\nVotre demande de sortie de véhicule a été validée.\nChauffeur : ${adkoulChamp(variables.chauffeur)}\nVéhicule : ${adkoulChamp(variables.vehicule)}\nDestination : ${adkoulChamp(variables.destination)}\nDate : ${date}${heure ? ' à ' + heure : ''}\n\nCordialement,\nService Logistique — ONG ADKOUL`;
  } else if (templateId === 'template_refus') {
    subject = 'Votre demande de véhicule — ONG ADKOUL';
    message = `Bonjour ${adkoulChamp(variables.nom, 'cher collègue')},\n\nVotre demande concernant ${adkoulChamp(variables.destination)} a été refusée.\nMotif : ${adkoulChamp(variables.motif_refus)}\nDate : ${date}\n\nCordialement,\nService Logistique — ONG ADKOUL`;
  } else if (templateId === 'template_ordre_attente_rh') {
    subject = `Ordre de mission à valider — ${adkoulChamp(variables.agent)}`;
    message = `Nouvelle demande d'ordre de mission à valider.\nAgent : ${adkoulChamp(variables.agent)}\nPoste : ${adkoulChamp(variables.poste)}\nDestination : ${adkoulChamp(variables.destination)}\nProjet : ${adkoulChamp(variables.projet)}\nDépart : ${adkoulChamp(variables.date_depart)}\nRetour : ${adkoulChamp(variables.date_retour)}\n\nService Logistique — ONG ADKOUL`;
  } else if (templateId === 'template_creation_user') {
    subject = 'Votre compte de gestion ONG ADKOUL a été créé';
    // Ne jamais inclure le mot de passe fourni par le formulaire dans un email.
    message = `Bonjour ${adkoulChamp(variables.nom)},\n\nVotre compte a été créé.\nIdentifiant : ${adkoulChamp(variables.email)}\nRôle : ${adkoulChamp(variables.role)}\nAccès : ${adkoulChamp(variables.lien_connexion)}\n\nDemandez vos informations d'accès via un canal sécurisé.\nONG ADKOUL`;
  } else {
    // Couvre notamment 'template_gd96rfl' utilisé après validation RH.
    subject = adkoulChamp(variables.subject, 'Notification ONG ADKOUL');
    message = adkoulChamp(variables.message, 'Nouvelle notification ONG ADKOUL.');
  }

  // EmailJS impose 1 requête par seconde ; les pages actuelles déclenchent parfois
  // deux notifications pour une même demande. La file évite les appels simultanés.
  const tache = ADKOUL_EMAILJS_QUEUE.then(async () => {
    if (typeof emailjs === 'undefined' || typeof emailjs.send !== 'function') {
      return { success: false, error: 'Bibliothèque EmailJS indisponible dans le navigateur.' };
    }
    try {
      if (!ADKOUL_EMAILJS_INITIALIZED) {
        emailjs.init({ publicKey: ADKOUL_EMAILJS_PUBLIC_KEY });
        ADKOUL_EMAILJS_INITIALIZED = true;
      }
      const attente = Math.max(0, 1100 - (Date.now() - ADKOUL_EMAILJS_LAST_SEND));
      if (attente) await new Promise(resoudre => setTimeout(resoudre, attente));
      ADKOUL_EMAILJS_LAST_SEND = Date.now();
      const resultat = await emailjs.send(
        ADKOUL_EMAILJS_SERVICE_ID,
        ADKOUL_EMAILJS_TEMPLATE_ID,
        { to_email: destinataire.trim(), subject, message }
      );
      console.info('EmailJS a accepté un email pour :', destinataire, resultat.status);
      return { success: true, status: resultat.status };
    } catch (erreur) {
      const detail = erreur && (erreur.text || erreur.message) || String(erreur);
      console.error('Échec EmailJS :', detail);
      return { success: false, error: detail };
    }
  });
  ADKOUL_EMAILJS_QUEUE = tache.then(() => undefined, () => undefined);
  return tache;
}
