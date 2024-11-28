import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    notification: {
      androidChannel: {
        id: 'default',
        name: 'Default'
      }
    }
  }
}; 