// Run once with: node generate-vapid-keys.js
// Then add the output values to Netlify environment variables.
const { webcrypto } = require('crypto');
const { subtle } = webcrypto;

async function generate() {
  const keyPair = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  // Export public key as raw 65-byte uncompressed point, then base64url-encode
  const publicKeyRaw = await subtle.exportKey('raw', keyPair.publicKey);
  const pubB64 = Buffer.from(publicKeyRaw).toString('base64url');

  // Export private key as JWK — the 'd' field is the raw scalar in base64url
  const privateKeyJwk = await subtle.exportKey('jwk', keyPair.privateKey);
  const privB64 = privateKeyJwk.d;

  console.log('\nAdd these to Netlify → Site configuration → Environment variables:\n');
  console.log('VAPID_PUBLIC_KEY=' + pubB64);
  console.log('VAPID_PRIVATE_KEY=' + privB64);
  console.log('VAPID_SUBJECT=mailto:admin@therapyandsneakers.org');
}

generate();
