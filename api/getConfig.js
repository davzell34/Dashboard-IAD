// api/getConfig.js
import { Clerk } from '@clerk/clerk-sdk-node';

const clerkClient = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });
const ADMIN_USER_ID = "user_38yRStqydrOqpsvmL638C9nNzpM";

export default async function handler(req, res) {
  try {
    // On récupère simplement vos métadonnées publiques
    const user = await clerkClient.users.getUser(ADMIN_USER_ID);
    const config = user.publicMetadata.app_migration_config || {};
    
    return res.status(200).json(config);
  } catch (error) {
    console.error(error);
    // En cas d'erreur (ex: premier lancement), on renvoie un objet vide
    return res.status(200).json({});
  }
}
