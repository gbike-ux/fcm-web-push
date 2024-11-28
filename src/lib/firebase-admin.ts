import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';

export function getFirebaseAdminApp(): App {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    return initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

export const messaging = getMessaging(getFirebaseAdminApp());
export const db = getFirestore(getFirebaseAdminApp()); 