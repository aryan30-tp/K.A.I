import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let serviceAccount;

// Try to load from environment variable first (for production like Render)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("🔥 Firebase credentials loaded from environment variable");
  } catch (err) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT env var:", err.message);
    process.exit(1);
  }
} else {
  // Fall back to local file (for development)
  const serviceAccountPath = path.resolve('./firebase-service-account.json');
  try {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.log("🔥 Firebase credentials loaded from local file");
  } catch (err) {
    console.error("❌ Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT env var or place firebase-service-account.json in server root");
    console.error("Error details:", err.message);
    process.exit(1);
  }
}

// Initialize the Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Export the Firestore database instance so our routes can use it
export const db = admin.firestore();

console.log("🔥 Firebase Admin initialized successfully");
