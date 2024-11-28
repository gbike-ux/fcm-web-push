import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { ScheduleOptions } from 'firebase-functions/v2/scheduler';
import { MessagingPayload } from 'firebase-admin/messaging';
import { HttpsOptions } from 'firebase-functions/v2/https';
import { AnalyticsAdminServiceClient } from '@google-analytics/admin';

const analyticsClient = new AnalyticsAdminServiceClient();

// API 엔드포인트 설정
const apiOptions: HttpsOptions = {
    cors: true,
    region: 'asia-northeast3',
    maxInstances: 10,
    minInstances: 0,
    timeoutSeconds: 60,
    memory: '256MiB',
    invoker: 'public'  // 임시로 public 접근 허용
};

// Analytics 세그먼트 기반 자동화 규칙 인터페이스
interface AutomationRule {
    id: string;
    name: string;
    audienceName: string;  // Analytics 세그먼트 이름
    notification: {
        title: string;
        body: string;
        imageUrl?: string;
        data?: {
            type: string;
            click_action: string;
        }
    };
    enabled: boolean;
    schedule: string;  // Cron 표현식
    createdAt: string;
    stats?: {
        sent: number;
        success: number;
        failure: number;
        lastRun?: string;
    };
}

// FCM 메시지 생성 함수
function createFcmMessage(rule: AutomationRule): { message: MessagingPayload } {
    const message: MessagingPayload = {
        notification: {
            title: rule.notification.title,
            body: rule.notification.body,
        },
        data: rule.notification.data
    };

    if (rule.notification.imageUrl && message.notification) {
        message.notification.imageUrl = rule.notification.imageUrl;
    }

    return { message };
}

// 자동화 규칙 생성
export const createAutomationRule = onRequest(apiOptions, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const ruleData = req.body;
        const ruleId = admin.firestore().collection('automation_rules').doc().id;
        
        const rule: AutomationRule = {
            id: ruleId,
            name: ruleData.name,
            audienceName: ruleData.audienceName,
            notification: ruleData.notification,
            enabled: false,  // 기본적으로 비활성화 상태로 생성
            schedule: ruleData.schedule,
            createdAt: new Date().toISOString(),
            stats: {
                sent: 0,
                success: 0,
                failure: 0
            }
        };

        await admin.firestore()
            .collection('automation_rules')
            .doc(ruleId)
            .set(rule);

        res.json({ success: true, rule });
    } catch (error) {
        console.error('자동화 규칙 생성 실패:', error);
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// 자동화 규칙 목록 조회
export const getAutomationRules = onRequest(apiOptions, async (req, res) => {
    // CORS 헤더 설정
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const snapshot = await admin.firestore()
            .collection('automation_rules')
            .orderBy('createdAt', 'desc')
            .get();

        const rules = snapshot.docs.map(doc => doc.data() as AutomationRule);

        res.json({ 
            success: true, 
            rules,
            stats: {
                total: rules.length,
                active: rules.filter(r => r.enabled).length,
                todaySent: rules.reduce((acc, r) => acc + (r.stats?.sent || 0), 0),
                successRate: calculateSuccessRate(rules)
            }
        });
    } catch (error) {
        console.error('자동화 규칙 조회 실패:', error);
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

const scheduleOptions: ScheduleOptions = {
    schedule: 'every 5 minutes',
    timeZone: 'Asia/Seoul',
    maxInstances: 3,
    timeoutSeconds: 120,
    memory: '256MiB',
    retryCount: 3,
    labels: {
        type: 'automation'
    }
};

// 자동화 규칙 실행 (5분마다)
export const processAutomationRules = onSchedule(scheduleOptions, async (event) => {
    const rules = await admin.firestore()
        .collection('automation_rules')
        .where('enabled', '==', true)
        .get();

    for (const doc of rules.docs) {
        const rule = doc.data() as AutomationRule;
        
        try {
            // Analytics 세그먼트에 해당하는 사용자들에게 알림 발송
            const { message } = createFcmMessage(rule);
            const result = await admin.messaging().send({
                topic: `audience_${rule.audienceName}`,
                ...message
            });

            // 통계 업데이트
            const updates: Record<string, any> = {
                'stats.sent': admin.firestore.FieldValue.increment(1),
                'stats.lastRun': new Date().toISOString()
            };

            if (result) {
                updates['stats.success'] = admin.firestore.FieldValue.increment(1);
            }

            await doc.ref.update(updates);
        } catch (error) {
            console.error(`자동화 규칙 실행 실패 (${rule.id}):`, error);
            await doc.ref.update({
                'stats.failure': admin.firestore.FieldValue.increment(1)
            });
        }
    }
});

// 자동화 규칙 수정
export const updateAutomationRule = onRequest(apiOptions, async (req, res) => {
    if (req.method !== 'PUT') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const ruleId = req.query.ruleId as string;
        if (!ruleId) {
            res.status(400).json({ success: false, error: 'Rule ID is required' });
            return;
        }

        const updates = req.body;
        
        await admin.firestore()
            .collection('automation_rules')
            .doc(ruleId)
            .update(updates);

        const updatedDoc = await admin.firestore()
            .collection('automation_rules')
            .doc(ruleId)
            .get();

        res.json({ 
            success: true, 
            rule: updatedDoc.data() 
        });
    } catch (error) {
        console.error('자동화 규칙 수정 실패:', error);
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// 자동화 규칙 삭제
export const deleteAutomationRule = onRequest(apiOptions, async (req, res) => {
    if (req.method !== 'DELETE') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const ruleId = req.query.ruleId as string;
        if (!ruleId) {
            res.status(400).json({ success: false, error: 'Rule ID is required' });
            return;
        }

        await admin.firestore()
            .collection('automation_rules')
            .doc(ruleId)
            .delete();

        res.json({ success: true });
    } catch (error) {
        console.error('자동화 규칙 삭제 실패:', error);
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// 자동화 규칙 활성화/비활성화
export const toggleAutomationRule = onRequest(apiOptions, async (req, res) => {
    if (req.method !== 'PATCH') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const ruleId = req.query.ruleId as string;
        if (!ruleId) {
            res.status(400).json({ success: false, error: 'Rule ID is required' });
            return;
        }

        const { enabled } = req.body;

        await admin.firestore()
            .collection('automation_rules')
            .doc(ruleId)
            .update({ enabled });

        const updatedDoc = await admin.firestore()
            .collection('automation_rules')
            .doc(ruleId)
            .get();

        res.json({ 
            success: true, 
            rule: updatedDoc.data() 
        });
    } catch (error) {
        console.error('자동화 규칙 토글 실패:', error);
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// 테스트용 단일 토큰 전송
export const testAutomationRule = onRequest(apiOptions, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const { notification, token } = req.body;
        
        if (!token) {
            res.status(400).json({ success: false, error: 'Token is required' });
            return;
        }

        const message: MessagingPayload = {
            notification: {
                title: notification.title,
                body: notification.body,
            },
            data: notification.data
        };

        const result = await admin.messaging().send({
            token: token,
            ...message
        });

        res.json({ success: true, result });
    } catch (error) {
        console.error('테스트 알림 전송 실패:', error);
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// 성공률 계산 헬퍼 함수
function calculateSuccessRate(rules: AutomationRule[]): number {
    const totalSent = rules.reduce((acc, r) => acc + (r.stats?.sent || 0), 0);
    const totalSuccess = rules.reduce((acc, r) => acc + (r.stats?.success || 0), 0);
    
    return totalSent > 0 ? Math.round((totalSuccess / totalSent) * 100) : 0;
}

// 세그먼트 정보 인터페이스
interface SegmentInfo {
    name: string;
    count: number;
    description?: string;
    id?: string;
    type: 'default' | 'custom';
    lastUpdated?: string;
}

// 기본 세그먼트 목록
const DEFAULT_SEGMENTS: SegmentInfo[] = [
    {
        name: '7일간 활동이 없는 사용자',
        count: 143114,
        description: '최근 7일간 앱을 실행하지 않은 사용자',
        type: 'default',
        id: 'inactive_7days'
    },
    {
        name: '30일간 활동이 없는 사용자',
        count: 118060,
        description: '최근 30일간 앱을 실행하지 않은 사용자',
        type: 'default',
        id: 'inactive_30days'
    },
    {
        name: '맵&QR 눌렀으나 미탑승',
        count: 443070,
        description: '맵이나 QR을 확인했으나 실제 탑승으로 이어지지 않은 사용자',
        type: 'default',
        id: 'map_qr_no_ride'
    },
    {
        name: '비구매자',
        count: 1121117,
        description: '아직 구매 이력이 없는 사용자',
        type: 'default',
        id: 'no_purchase'
    },
    {
        name: 'user_is_test_server_user',
        count: 86,
        description: '테스트 서버 사용자',
        type: 'default',
        id: 'test_user'
    }
];

// Analytics API를 통해 세그먼트 정보 가져오기
async function getAnalyticsAudiences(): Promise<SegmentInfo[]> {
    try {
        const propertyId = process.env.FIREBASE_ANALYTICS_PROPERTY_ID;
        if (!propertyId) {
            throw new Error('Analytics Property ID is not configured');
        }

        const [audiences] = await analyticsClient.listAudiences({
            parent: `properties/${propertyId}`
        });

        return audiences.map(audience => ({
            name: audience.displayName || '',
            count: Number(audience.membershipDurationDays) || 0,
            description: audience.description || undefined,
            id: audience.name?.split('/').pop() || undefined,
            type: 'custom' as const,
            lastUpdated: new Date().toISOString()
        }));
    } catch (error) {
        console.error('Analytics API 호출 실패:', error);
        return [];
    }
}

// 세그먼트 목록 조회
export const getAnalyticsSegments = onRequest(apiOptions, async (req, res) => {
    if (req.method !== 'GET') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        // Analytics API에서 커스텀 세그먼트 가져오기
        const customSegments = await getAnalyticsAudiences();
        
        // 기본 세그먼트와 커스텀 세그먼트 합치기
        const allSegments = [...DEFAULT_SEGMENTS, ...customSegments];

        // 정렬: 기본 세그먼트 먼저, 그 다음 커스텀 세그먼트 (이름 순)
        allSegments.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'default' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });

        res.json({ 
            success: true, 
            segments: allSegments,
            stats: {
                total: allSegments.length,
                default: DEFAULT_SEGMENTS.length,
                custom: customSegments.length,
                totalUsers: allSegments.reduce((sum, segment) => sum + segment.count, 0)
            }
        });
    } catch (error) {
        console.error('세그먼트 목록 조회 실패:', error);
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
}); 