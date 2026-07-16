// api/_snowflake.js
// Helper de connexion Snowflake en authentification par paire de clés (JWT).
// Le préfixe "_" empêche Vercel de traiter ce fichier comme une route HTTP.
const snowflake = require('snowflake-sdk');
const crypto = require('crypto');

// Décode la clé privée (stockée en base64 dans Vercel pour préserver les retours
// à la ligne du PEM) puis la déchiffre en PKCS#8 non chiffré.
// On déchiffre nous-mêmes via `crypto` car le driver gère mal une clé chiffrée
// passée directement à l'option `privateKey`.
function getPrivateKey() {
    const b64 = process.env.SNOWFLAKE_PRIVATE_KEY_B64;
    if (!b64) {
        throw new Error('SNOWFLAKE_PRIVATE_KEY_B64 manquante');
    }

    const pem = Buffer.from(b64, 'base64').toString('utf-8');
    const passphrase = process.env.SNOWFLAKE_PRIVATE_KEY_PASSPHRASE;

    const keyObject = crypto.createPrivateKey(
        passphrase
            ? { key: pem, format: 'pem', passphrase }
            : { key: pem, format: 'pem' }
    );

    // Le driver exige une chaîne PEM de type PKCS#8.
    return keyObject.export({ format: 'pem', type: 'pkcs8' });
}

// Retourne une connexion NON connectée (l'appelant fait connection.connect(...)).
function createSnowflakeConnection() {
    const options = {
        account: process.env.SNOWFLAKE_ACCOUNT,
        username: process.env.SNOWFLAKE_USERNAME,
        authenticator: 'SNOWFLAKE_JWT',
        privateKey: getPrivateKey(),
        database: process.env.SNOWFLAKE_DB,
        schema: process.env.SNOWFLAKE_SCHEMA,
        warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    };

    // Rôle optionnel (à définir seulement si l'équipe data t'en a fourni un précis).
    if (process.env.SNOWFLAKE_ROLE) {
        options.role = process.env.SNOWFLAKE_ROLE;
    }

    return snowflake.createConnection(options);
}

module.exports = { createSnowflakeConnection };
