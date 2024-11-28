import * as admin from 'firebase-admin';
import { 
    createAutomationRule,
    processAutomationRules,
    getAutomationRules,
    updateAutomationRule,
    deleteAutomationRule,
    toggleAutomationRule,
    testAutomationRule,
    getAnalyticsSegments
} from './automations';

// Firebase Admin 초기화
admin.initializeApp();

// 자동화 관련 함수들 export
export {
    createAutomationRule,
    processAutomationRules,
    getAutomationRules,
    updateAutomationRule,
    deleteAutomationRule,
    toggleAutomationRule,
    testAutomationRule,
    getAnalyticsSegments
}; 