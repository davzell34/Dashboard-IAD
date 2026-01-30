import { createClerkClient } from '@clerk/clerk-sdk-node';

const ADMIN_USER_ID = "user_38yRStqydrOqpsvmL638C9nNzpM";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const newConfig = req.body;

    // Écriture forcée dans les métadonnées
    await clerkClient.users.updateUserMetadata(ADMIN_USER_ID, {
      publicMetadata: {
        app_migration_config: newConfig
      }
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Erreur Backend:", error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}
