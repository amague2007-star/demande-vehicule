// ONG ADKOUL - création de compte à autorisation vérifiée
// Déployer avec verify_jwt=true. Aucune clé service_role côté navigateur.
// Phase de transition: crée Supabase Auth + admins pour préserver la connexion existante.
const ORIGINE = "https://amague2007-star.github.io";
const ROLES = new Set(["logistique", "rh", "directeur_logistique", "assistant_logistique"]);

function reponse(body, status = 200, origin = "") {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
  if (origin === ORIGINE) headers["Access-Control-Allow-Origin"] = ORIGINE;
  return new Response(JSON.stringify(body), { status, headers });
}

function headersService(secret, json = false) {
  return {
    "apikey": secret,
    "Authorization": "Bearer " + secret,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

async function empreinteSHA256(password) {
  const bytes = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  if (req.method === "OPTIONS") {
    if (origin !== ORIGINE) return reponse({ error: "Origine refusée." }, 403);
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": ORIGINE,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, apikey, content-type",
        "Access-Control-Max-Age": "3600",
        "Vary": "Origin",
      },
    });
  }
  if (origin !== ORIGINE) return reponse({ error: "Origine refusée." }, 403);
  if (req.method !== "POST") return reponse({ error: "Méthode non autorisée." }, 405, origin);

  const url = Deno.env.get("SUPABASE_URL");
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !secret) return reponse({ error: "Configuration serveur absente." }, 503, origin);

  const bearer = req.headers.get("authorization") || "";
  if (!/^Bearer eyJ[A-Za-z0-9._-]+$/.test(bearer)) {
    return reponse({ error: "Session Supabase Auth requise." }, 401, origin);
  }

  try {
    // L'API Auth vérifie le JWT réel; ne jamais croire un rôle envoyé par le navigateur.
    const who = await fetch(url + "/auth/v1/user", {
      headers: { "apikey": secret, "Authorization": bearer },
      cache: "no-store",
    });
    if (!who.ok) return reponse({ error: "Session Supabase Auth invalide." }, 401, origin);
    const identite = await who.json();
    const auteurEmail = typeof identite.email === "string" ? identite.email.trim().toLowerCase() : "";
    if (!identite.id || !identite.email_confirmed_at || !auteurEmail) {
      return reponse({ error: "Identité vérifiée requise." }, 403, origin);
    }

    const droit = await fetch(
      url + "/rest/v1/admins?select=id,email,role&email=eq." + encodeURIComponent(auteurEmail),
      { headers: headersService(secret), cache: "no-store" }
    );
    if (!droit.ok) return reponse({ error: "Autorisation indisponible." }, 503, origin);
    const profils = await droit.json();
    if (!Array.isArray(profils) || profils.length !== 1 || profils[0].role !== "logistique" ||
        String(profils[0].email || "").toLowerCase() !== auteurEmail) {
      return reponse({ error: "Droits Logistique insuffisants." }, 403, origin);
    }

    const raw = await req.text();
    if (raw.length > 4096) return reponse({ error: "Requête trop volumineuse." }, 413, origin);
    let payload;
    try { payload = JSON.parse(raw); } catch { return reponse({ error: "JSON invalide." }, 400, origin); }
    const nom = String(payload?.nom || "").trim();
    const email = String(payload?.email || "").trim().toLowerCase();
    const role = String(payload?.role || "");
    const password = typeof payload?.password === "string" ? payload.password : "";
    if (!nom || nom.length > 120 || email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !ROLES.has(role) ||
        password.length < 12 || password.length > 128) {
      return reponse({ error: "Nom, email, rôle ou mot de passe invalide (minimum 12 caractères)." }, 400, origin);
    }
    const existing = await fetch(
      url + "/rest/v1/admins?select=id&email=eq." + encodeURIComponent(email),
      { headers: headersService(secret), cache: "no-store" }
    );
    if (!existing.ok) return reponse({ error: "Vérification du compte impossible." }, 503, origin);
    if ((await existing.json()).length > 0) return reponse({ error: "Adresse email déjà utilisée." }, 409, origin);

    // Le nouveau compte possède également une identité Supabase Auth.
    const created = await fetch(url + "/auth/v1/admin/users", {
      method: "POST",
      headers: headersService(secret, true),
      body: JSON.stringify({ email, password, email_confirm: true }),
      cache: "no-store",
    });
    if (!created.ok) {
      if (created.status === 422) return reponse({ error: "Adresse déjà utilisée dans Supabase Auth." }, 409, origin);
      return reponse({ error: "Création Supabase Auth refusée." }, 502, origin);
    }
    const authUser = await created.json();
    const createdId = authUser?.id;
    if (!createdId) return reponse({ error: "Identité nouvellement créée non confirmée." }, 502, origin);

    const password_hash = await empreinteSHA256(password);
    // Compatibilité temporaire avec la connexion historique, à remplacer par Auth.
    const inserted = await fetch(url + "/rest/v1/admins", {
      method: "POST",
      headers: { ...headersService(secret, true), Prefer: "return=representation" },
      body: JSON.stringify({ nom, email, role, password_hash }),
      cache: "no-store",
    });
    if (!inserted.ok) {
      // Tentative de compensation : éviter un compte Auth orphelin.
      const rollback = await fetch(url + "/auth/v1/admin/users/" + encodeURIComponent(createdId), {
        method: "DELETE",
        headers: headersService(secret),
      });
      if (!rollback.ok) console.error("Échec de nettoyage du compte Auth lors de l'annulation.");
      return reponse({ error: "Création annulée : table admins non mise à jour." }, 502, origin);
    }
    return reponse({ success: true }, 201, origin);
  } catch (err) {
    // Ne jamais journaliser des mots de passe ni le JWT.
    console.error("Création utilisateur ADKOUL : erreur interne de service.");
    return reponse({ error: "Service momentanément indisponible." }, 503, origin);
  }
});
