import { NextResponse } from 'next/server';
import { messaging } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    try {
        const { title, message, targetToken } = await request.json();

        // 관리자 토큰 검증
        if (targetToken !== process.env.NEXT_PUBLIC_ADMIN_FCM_TOKEN) {
            return NextResponse.json(
                { error: '유효하지 않은 토큰입니다.' },
                { status: 403 }
            );
        }

        const response = await messaging.send({
            token: targetToken,
            notification: {
                title,
                body: message,
            },
        });

        return NextResponse.json({ success: true, messageId: response });
    } catch (error) {
        console.error('Error sending notification:', error);
        return NextResponse.json(
            { error: 'Failed to send notification' },
            { status: 500 }
        );
    }
} 