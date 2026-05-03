import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Read the secret JSON file we just downloaded
const serviceAccountPath = path.resolve('./firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize the Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Export the Firestore database instance so our routes can use it
export const db = admin.firestore();

console.log("🔥 Firebase Admin initialized successfully");
