import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import type { AutomationRule } from '../../src/types/events';

// 환경 변수 체크
const ADMIN_FCM_TOKEN = process.env.ADMIN_FCM_TOKEN;
if (!ADMIN_FCM_TOKEN) {
    throw new Error('ADMIN_FCM_TOKEN is not set in environment variables');
}

export const handleEvent = functions.https.onRequest(async (request, response) => {
    let automationDoc: admin.firestore.DocumentSnapshot | null = null;
    
    try {
        const { eventName } = request.body;
        automationDoc = await admin.firestore().collection('automations').doc(eventName).get();
        
        if (!automationDoc.exists) {
            console.log(`No automation rule found for event: ${eventName}`);
            response.status(404).json({ error: 'No automation rule found' });
            return;
        }

        const automationRule = automationDoc.data() as AutomationRule;
        
        // Send notification based on the automation rule
        const message: admin.messaging.Message = {
            notification: {
                title: automationRule.notification.title,
                body: automationRule.notification.body,
                imageUrl: automationRule.notification.imageUrl,
            },
            data: automationRule.notification.data,
            token: ADMIN_FCM_TOKEN // Send only to admin token
        };

        // Send to specific token
        await admin.messaging().send(message);
        
        // Update automation stats
        await automationDoc.ref.update({
            'stats.sent': admin.firestore.FieldValue.increment(1),
            'stats.success': admin.firestore.FieldValue.increment(1),
            lastTriggered: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        response.status(200).json({ success: true, message: 'Notification sent successfully' });
    } catch (error) {
        console.error('Error processing event:', error);
        
        // Update failure stats if it's a notification error and we have a valid document
        if (error instanceof Error && automationDoc?.exists) {
            try {
                await automationDoc.ref.update({
                    'stats.sent': admin.firestore.FieldValue.increment(1),
                    'stats.failure': admin.firestore.FieldValue.increment(1),
                    lastTriggered: admin.firestore.FieldValue.serverTimestamp(),
                });
            } catch (statsError) {
                console.error('Failed to update failure stats:', statsError);
            }
        }
        
        response.status(500).json({ 
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}); 