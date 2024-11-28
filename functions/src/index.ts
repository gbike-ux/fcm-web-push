import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import type { AutomationRule, AutomationHistory } from '../../src/types/events';

admin.initializeApp();

// 환경 변수 체크
const ADMIN_FCM_TOKEN = process.env.ADMIN_FCM_TOKEN;
if (!ADMIN_FCM_TOKEN) {
    throw new Error('ADMIN_FCM_TOKEN is not set in environment variables');
}

export const handleEvent = functions.https.onRequest(async (request, response) => {
    try {
        const { eventName } = request.body;
        const automationDoc = await admin.firestore().collection('automations').doc(eventName).get();
        
        if (!automationDoc.exists) {
            console.log(`No automation rule found for event: ${eventName}`);
            response.status(404).send('No automation rule found');
            return;
        }

        const automationRule = automationDoc.data() as AutomationRule;
        
        // 테스트 환경에서는 관리자 토큰으로만 발송
        const message: admin.messaging.Message = {
            token: ADMIN_FCM_TOKEN,
            notification: {
                title: automationRule.notification.title,
                body: automationRule.notification.body,
                imageUrl: automationRule.notification.imageUrl,
            },
            data: automationRule.notification.data,
        };

        try {
            await admin.messaging().send(message);
            
            // 성공 이력 추가
            const historyEntry: AutomationHistory = {
                id: admin.firestore.Timestamp.now().toMillis().toString(),
                timestamp: new Date(),
                success: true,
                recipients: 1,
            };

            // 통계 및 이력 업데이트
            await automationDoc.ref.update({
                'stats.sent': admin.firestore.FieldValue.increment(1),
                'stats.success': admin.firestore.FieldValue.increment(1),
                lastTriggered: admin.firestore.FieldValue.serverTimestamp(),
                history: admin.firestore.FieldValue.arrayUnion(historyEntry),
            });

            response.status(200).send('Notification sent successfully');
        } catch (error) {
            // 실패 이력 추가
            const historyEntry: AutomationHistory = {
                id: admin.firestore.Timestamp.now().toMillis().toString(),
                timestamp: new Date(),
                success: false,
                error: error.message,
                recipients: 0,
            };

            // 실패 통계 업데이트
            await automationDoc.ref.update({
                'stats.sent': admin.firestore.FieldValue.increment(1),
                'stats.failure': admin.firestore.FieldValue.increment(1),
                lastTriggered: admin.firestore.FieldValue.serverTimestamp(),
                history: admin.firestore.FieldValue.arrayUnion(historyEntry),
            });

            throw error;
        }
    } catch (error) {
        console.error('Error processing event:', error);
        response.status(500).send('Internal server error');
    }
});

export const testAutomation = functions.https.onRequest(async (request, response) => {
    try {
        const { id } = request.body;
        const automationDoc = await admin.firestore().collection('automations').doc(id).get();
        
        if (!automationDoc.exists) {
            response.status(404).send('Automation not found');
            return;
        }

        const automationRule = automationDoc.data() as AutomationRule;
        
        // 테스트 환경에서는 관리자 토큰으로만 발송
        const message: admin.messaging.Message = {
            token: ADMIN_FCM_TOKEN,
            notification: {
                title: `[테스트] ${automationRule.notification.title}`,
                body: automationRule.notification.body,
                imageUrl: automationRule.notification.imageUrl,
            },
            data: {
                ...automationRule.notification.data,
                isTest: 'true',
            },
        };

        try {
            await admin.messaging().send(message);
            
            // 테스트 성공 이력 추가
            const historyEntry: AutomationHistory = {
                id: admin.firestore.Timestamp.now().toMillis().toString(),
                timestamp: new Date(),
                success: true,
                recipients: 1,
            };

            await automationDoc.ref.update({
                history: admin.firestore.FieldValue.arrayUnion(historyEntry),
            });

            response.status(200).send('Test notification sent successfully');
        } catch (error) {
            // 테스트 실패 이력 추가
            const historyEntry: AutomationHistory = {
                id: admin.firestore.Timestamp.now().toMillis().toString(),
                timestamp: new Date(),
                success: false,
                error: error.message,
                recipients: 0,
            };

            await automationDoc.ref.update({
                history: admin.firestore.FieldValue.arrayUnion(historyEntry),
            });

            throw error;
        }
    } catch (error) {
        console.error('Error sending test notification:', error);
        response.status(500).send('Internal server error');
    }
}); 