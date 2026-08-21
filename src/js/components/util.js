import 'dotenv/config';

export function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    // Math.log determines which index of the array to use based on powers of 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export async function generateCloudflareTurn() {
    const TURN_TOKEN_ID = process.env.CLOUDFLARE_TURN_TOKEN_ID;
    const TURN_API_TOKEN = process.env.CLOUDFLARE_TURN_API_TOKEN;
    const TURN_GENERATOR_URL = `https://rtc.live.cloudflare.com/v1/turn/keys/${TURN_TOKEN_ID}/credentials/generate-ice-servers`;

    try {
        const response = await fetch(TURN_GENERATOR_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TURN_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'ttl': 86400,
            }),
        });

        return await response.json();
    } catch (err) {
        throw err;
    }
}