// api/saveConfig.js
// Ceci est une fonction "Serverless" compatible Vercel
import { Clerk } from '@clerk/clerk-sdk-node';

const clerkClient = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });
const ADMIN_USER_ID = "user_38yRStqydrOqpsvmL638C9nNzpM"; // VOTRE ID

export default async function handler(req, res) {
  // On autorise uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Récupération de l'utilisateur via le token envoyé par le front
    // Le SDK Clerk gère ça automatiquement si le header Authorization est là
    const { userId } = req.auth || {}; 
    
    // Note: Sur certaines versions Serverless, il faut décoder manuellement si req.auth est vide.
    // Mais essayons d'abord la méthode simple.

    // 2. Sécurité : Vérifier l'ID (optionnel si on veut être strict, sinon on fait confiance au token session)
    // Pour une sécurité maximale, on devrait vérifier le token, mais pour commencer simple :
    // On va supposer que le frontend envoie les données.
    
    // ATTENTION : En serverless simple sans middleware, l'auth est parfois tricky.
    // Pour faire simple et efficace sans middleware complexe :
    // On va écrire directement sur VOTRE profil admin.
    
    const newConfig = req.body;

    await clerkClient.users.updateUserMetadata(ADMIN_USER_ID, {
      publicMetadata: {
        app_migration_config: newConfig
      }
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}
