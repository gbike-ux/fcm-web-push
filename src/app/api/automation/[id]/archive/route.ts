import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase-admin';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    try {
        const { id } = params;
        const automationRef = db.collection('automations').doc(id);
        const automation = await automationRef.get();

        if (!automation.exists) {
            return NextResponse.json(
                { success: false, error: '자동화를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        await automationRef.update({
            archived: true,
            enabled: false,
            updatedAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            message: '자동화가 아카이브되었습니다.',
        });
    } catch (error) {
        console.error('자동화 아카이브 오류:', error);
        return NextResponse.json(
            { success: false, error: '자동화 아카이브 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
} 