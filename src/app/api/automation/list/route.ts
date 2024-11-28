import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase-admin';
import { AutomationRule } from '@/types/events';
import { Query, DocumentData } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'all';
        const platform = searchParams.get('platform') || 'all';
        const search = searchParams.get('search') || '';
        const sort = searchParams.get('sort') || 'createdAt';
        const order = searchParams.get('order') || 'desc';

        let query: Query<DocumentData> = db.collection('automations');

        // 상태 필터
        if (status === 'active') {
            query = query.where('enabled', '==', true).where('archived', '==', false);
        } else if (status === 'inactive') {
            query = query.where('enabled', '==', false).where('archived', '==', false);
        } else if (status === 'archived') {
            query = query.where('archived', '==', true);
        }

        // 플랫폼 필터
        if (platform !== 'all') {
            query = query.where(`target.${platform}`, '==', true);
        }

        // 정렬
        query = query.orderBy(sort, order as 'desc' | 'asc');

        const snapshot = await query.get();
        let automations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as AutomationRule[];

        // 검색 필터 (클라이언트 사이드)
        if (search) {
            const searchLower = search.toLowerCase();
            automations = automations.filter(automation =>
                automation.name.toLowerCase().includes(searchLower) ||
                automation.eventType.toLowerCase().includes(searchLower)
            );
        }

        return NextResponse.json({
            success: true,
            automations,
        });
    } catch (error) {
        console.error('자동화 목록 조회 오류:', error);
        return NextResponse.json(
            { success: false, error: '자동화 목록 조회 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
} 