import { createClerkClient } from '@clerk/clerk-sdk-node';

// Votre ID Admin
const ADMIN_USER_ID = "user_38yRStqydrOqpsvmL638C9nNzpM";

export default async function handler(req, res) {
  // 1. IMPORTANT : On interdit le cache (pour que le F5 marche)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    // 2. Connexion à Clerk
    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    // 3. On récupère vos métadonnées
    const user = await clerkClient.users.getUser(ADMIN_USER_ID);
    
    // 4. On extrait la config
    const savedConfig = user.publicMetadata?.app_migration_config || {};
    
    return res.status(200).json(savedConfig);

  } catch (error) {
    console.error("Erreur lecture config:", error);
    return res.status(200).json({});
  }
}
