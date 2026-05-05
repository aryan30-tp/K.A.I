import { db } from '../config/firebase.js';
import admin from 'firebase-admin';

/**
 * Strategy: We use an 'uploadId' (a unique ID for the student's uploaded file) 
 * as the Document ID. All outputs for that file are saved inside that document.
 */

// 1. Check if the AI has already generated this specific output
export async function getCachedOutput(uploadId, outputType) {
  try {
    const docRef = db.collection('study_sessions').doc(uploadId);
    const doc = await docRef.get();

    if (doc.exists && doc.data()[outputType]) {
      console.log(`⚡ Cache HIT for ${outputType}`);
      return doc.data()[outputType];
    }
    
    console.log(`🐌 Cache MISS for ${outputType}`);
    return null;
  } catch (error) {
    console.error("Error reading from Firebase:", error);
    return null;
  }
}

// 2. Save the AI's generation to Firebase so we never pay for it twice
export async function saveCachedOutput(uploadId, outputType, data, meta = {}) {
  try {
    const docRef = db.collection('study_sessions').doc(uploadId);
    const payload = {
      [outputType]: data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (meta.userId) payload.userId = meta.userId;
    if (meta.workspaceId) payload.workspaceId = meta.workspaceId;
    
    // { merge: true } ensures we don't overwrite other outputs (like flashcards) 
    // when we save a new output (like a study plan).
    await docRef.set(payload, { merge: true });

    console.log(`💾 Saved ${outputType} to Firebase cache`);
  } catch (error) {
    console.error("Error saving to Firebase:", error);
  }
}
