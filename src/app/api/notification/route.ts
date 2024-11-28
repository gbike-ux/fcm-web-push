import { NextResponse } from 'next/server';
import { messaging } from '@/lib/firebase-admin';

// FCM 토큰 유효성 검사
const isValidFCMToken = (token: string) => {
    return typeof token === 'string' && token.length > 20;
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, body: messageBody, imageUrl, data, token, tokens, platform } = body;

        // 기본 메시지 구조
        const baseMessage = {
            notification: {
                title,
                body: messageBody,
                ...(imageUrl ? { imageUrl } : {})
            },
            data: {
                ...data,
                timestamp: new Date().toISOString(),
                ...(data?.link ? { link: data.link } : {})
            }
        };

        let response;

        // 단일 토큰으로 전송
        if (token) {
            if (!isValidFCMToken(token)) {
                return NextResponse.json(
                    { success: false, error: '유효하지 않은 토큰입니다' },
                    { status: 400 }
                );
            }

            const message = {
                ...baseMessage,
                token,
            };

            response = await messaging.send(message);
            console.log('단일 토큰 알림 전송 성공:', response);
            
            return NextResponse.json({ success: true, messageId: response });
        }
        // 다중 토큰으로 전송
        else if (tokens && tokens.length > 0) {
            const validTokens = tokens.filter(isValidFCMToken);
            if (validTokens.length === 0) {
                return NextResponse.json(
                    { success: false, error: '유효한 토큰이 없습니다' },
                    { status: 400 }
                );
            }

            const message = {
                ...baseMessage,
                tokens: validTokens,
            };

            response = await messaging.sendEachForMulticast(message);
            console.log('다중 토큰 알림 전송 결과:', response);
            
            return NextResponse.json({ 
                success: true, 
                results: {
                    success: response.successCount,
                    failure: response.failureCount,
                    responses: response.responses,
                    totalTokens: tokens.length,
                    validTokens: validTokens.length
                }
            });
        }
        // 플랫폼별 전송
        else if (platform) {
            if (!['ios', 'android', 'all'].includes(platform)) {
                return NextResponse.json(
                    { success: false, error: '유효하지 않은 플랫폼입니다' },
                    { status: 400 }
                );
            }

            const condition = platform === 'ios' ? "'ios' in topics" : 
                            platform === 'android' ? "'android' in topics" : 
                            "'all' in topics";

            const message = {
                ...baseMessage,
                condition,
            };

            response = await messaging.send(message);
            console.log('플랫폼별 알림 전송 성공:', response);
            
            return NextResponse.json({ success: true, messageId: response });
        }
        else {
            return NextResponse.json(
                { success: false, error: '토큰 또는 플랫폼 정보가 필요합니다' },
                { status: 400 }
            );
        }
    } catch (error: any) {
        console.error('알림 전송 실패:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.errorInfo?.message || error.message || '알림 전송 실패'
        }, { status: 500 });
    }
} 