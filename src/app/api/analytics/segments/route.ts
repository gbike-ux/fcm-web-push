import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { db } from '@/lib/firebase-admin';

interface SegmentFilter {
    field: string;
    operator: 'EXACT' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN';
    value: string | number;
}

interface UserSegment {
    id: string;
    name: string;
    filters: SegmentFilter[];
    userCount: number;
    lastUpdated: Date;
    recentEvents?: {
        name: string;
        count: number;
        date: Date;
    }[];
    deviceStats?: {
        ios: number;
        android: number;
    };
    userProperties?: {
        [key: string]: {
            value: string;
            count: number;
        }[];
    };
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const analyticsDataClient = new BetaAnalyticsDataClient();
        const propertyId = process.env.GA4_PROPERTY_ID;

        if (!propertyId) {
            throw new Error('GA4_PROPERTY_ID가 설정되지 않았습니다.');
        }

        // 기본 세그먼트 정의
        const defaultSegments: UserSegment[] = [
            {
                id: 'all_users',
                name: '전체 사용자',
                filters: [],
                userCount: 0,
                lastUpdated: new Date(),
            },
            {
                id: 'active_users',
                name: '활성 사용자 (최근 7일)',
                filters: [
                    {
                        field: 'lastActivityDate',
                        operator: 'GREATER_THAN',
                        value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    },
                ],
                userCount: 0,
                lastUpdated: new Date(),
            },
            {
                id: 'new_users',
                name: '신규 사용자 (최근 30일)',
                filters: [
                    {
                        field: 'firstOpenDate',
                        operator: 'GREATER_THAN',
                        value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    },
                ],
                userCount: 0,
                lastUpdated: new Date(),
            },
        ];

        // GA4에서 세그먼트별 사용자 수 조회
        const [response] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
                {
                    startDate: '30daysAgo',
                    endDate: 'today',
                },
            ],
            dimensions: [
                { name: 'platform' },
                { name: 'deviceCategory' },
            ],
            metrics: [
                { name: 'totalUsers' },
                { name: 'activeUsers' },
                { name: 'newUsers' },
            ],
        });

        // 디바이스 통계 계산
        const deviceStats = {
            ios: 0,
            android: 0,
        };

        response.rows?.forEach(row => {
            const platform = row.dimensionValues?.[0].value?.toLowerCase();
            const users = Number(row.metricValues?.[0].value) || 0;
            
            if (platform === 'ios') {
                deviceStats.ios += users;
            } else if (platform === 'android') {
                deviceStats.android += users;
            }
        });

        // Firestore에서 사용자 속성 통계 조회
        const userPropertiesSnapshot = await db.collection('users')
            .select('language', 'country', 'appVersion')
            .limit(1000)
            .get();

        const userProperties: UserSegment['userProperties'] = {
            language: [],
            country: [],
            appVersion: [],
        };

        userPropertiesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            ['language', 'country', 'appVersion'].forEach(prop => {
                if (data[prop]) {
                    const existing = userProperties[prop]?.find(item => item.value === data[prop]);
                    if (existing) {
                        existing.count++;
                    } else {
                        userProperties[prop]?.push({ value: data[prop], count: 1 });
                    }
                }
            });
        });

        // 최근 이벤트 통계 조회
        const eventsSnapshot = await db.collection('events')
            .where('timestamp', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
            .orderBy('timestamp', 'desc')
            .limit(1000)
            .get();

        const eventCounts: { [key: string]: number } = {};
        eventsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            eventCounts[data.name] = (eventCounts[data.name] || 0) + 1;
        });

        const recentEvents = Object.entries(eventCounts)
            .map(([name, count]) => ({
                name,
                count,
                date: new Date(),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // 세그먼트 정보 업데이트
        const segments = defaultSegments.map(segment => ({
            ...segment,
            deviceStats,
            userProperties,
            recentEvents,
            userCount: segment.id === 'all_users'
                ? Number(response.rows?.[0].metricValues?.[0].value) || 0
                : segment.id === 'active_users'
                ? Number(response.rows?.[0].metricValues?.[1].value) || 0
                : Number(response.rows?.[0].metricValues?.[2].value) || 0,
        }));

        return NextResponse.json({
            success: true,
            segments,
        });
    } catch (error) {
        console.error('Error fetching analytics data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 