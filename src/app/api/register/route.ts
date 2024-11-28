import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    try {
        const { token } = await request.json();
        
        if (!token) {
            return NextResponse.json(
                { success: false, error: 'FCM 토큰이 필요합니다.' },
                { status: 400 }
            );
        }

        // TODO: 여기에 토큰을 저장하는 로직 추가
        // 예: 데이터베이스에 저장

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('토큰 등록 오류:', error);
        return NextResponse.json(
            { success: false, error: '토큰 등록 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
} 