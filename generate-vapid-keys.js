// Run once with: node generate-vapid-keys.js
// Then add the output values to Netlify environment variables.
const crypto = require('crypto');

function toBase64Url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generate() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding:  { type: 'spki',  format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  });

  // Web push expects the raw 65-byte uncompressed public key
  const pubRaw = publicKey.slice(-65);
  // Web push expects the raw 32-byte private key scalar
  const privRaw = privateKey.slice(-32);

  console.log('\nAdd these to Netlify → Site configuration → Environment variables:\n');
  console.log('VAPID_PUBLIC_KEY=' + toBase64Url(pubRaw));
  console.log('VAPID_PRIVATE_KEY=' + toBase64Url(privRaw));
  console.log('\nAlso add:');
  console.log('VAPID_SUBJECT=mailto:admin@therapyandsneakers.org');
}

generate();
