import { initializeApp, getApps, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  try {
    let app;
    if (process.env.FIREBASE_PRIVATE_KEY) {
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
      });
    } else {
      app = initializeApp({
        credential: applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'staybuddy-hotel-2026-v2',
      });
    }
    const db = getFirestore(app);
    db.settings({ ignoreUndefinedProperties: true });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const db = getFirestore();
export const auth = getAuth();
