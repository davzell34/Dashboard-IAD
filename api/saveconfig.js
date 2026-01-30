import { createClerkClient } from '@clerk/clerk-sdk-node';

// ⚠️ REMPLACEZ CECI SI L'ÉTAPE 1 VOUS A DONNÉ UN AUTRE ID
const ADMIN_USER_ID = "user_38yRStqydrOqpsvmL638C9nNzpM";

export default async function handler(req, res) {
  // Debug : Vérif Clé
  if (!process.env.CLERK_SECRET_KEY) {
    return res.status(500).json({ error: "ERREUR CRITIQUE : CLERK_SECRET_KEY manquante dans Vercel !" });
  }

  const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  try {
    const newConfig = req.body;

    // 1. On essaie d'écrire
    await clerkClient.users.updateUserMetadata(ADMIN_USER_ID, {
      publicMetadata: {
        app_migration_config: newConfig
      }
    });

    // 2. VÉRIFICATION IMMÉDIATE : On relit ce qu'on vient d'écrire
    const user = await clerkClient.users.getUser(ADMIN_USER_ID);
    const verification = user.publicMetadata.app_migration_config;

    // 3. On renvoie le résultat au navigateur
    return res.status(200).json({ 
        success: true, 
        message: "Écriture tentée",
        target_user: ADMIN_USER_ID,
        data_relecure: verification || "VIDE ! L'écriture a échoué."
    });

  } catch (error) {
    console.error("Erreur Backend:", error);
    return res.status(500).json({ 
        error: 'Erreur Clerk', 
        details: error.message,
        cle_utilisee: process.env.CLERK_SECRET_KEY ? "Présente" : "Manquante"
    });
  }
}
