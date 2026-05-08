// Run once: node set-cors.js
// Requires: npm install --save-dev @google-cloud/storage
//           and serviceAccount.json in this directory (from Firebase Console > Project Settings > Service accounts)

const { Storage } = require('@google-cloud/storage');

const storage = new Storage({
  keyFilename: './serviceAccount.json',
});

const BUCKET = 'ear-rubrics.firebasestorage.app';

const CORS = [
  {
    origin: [
      'http://localhost:5173',
      'https://ear-rubrics.web.app',
      'https://ear-rubrics.firebaseapp.com',
    ],
    method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
    maxAgeSeconds: 3600,
    responseHeader: ['Content-Type', 'Authorization'],
  },
];

async function main() {
  await storage.bucket(BUCKET).setCorsConfiguration(CORS);
  console.log('CORS set on', BUCKET);
  const [meta] = await storage.bucket(BUCKET).getMetadata();
  console.log('Current CORS:', JSON.stringify(meta.cors, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });
