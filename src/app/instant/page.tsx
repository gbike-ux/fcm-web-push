'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface NotificationForm {
    title: string;
    body: string;
    imageUrl: string;
    tokens: string;
    target: {
        all: boolean;
        ios: boolean;
        android: boolean;
    };
}

export default function InstantPage() {
    const { toast } = useToast();
    const [notification, setNotification] = useState<NotificationForm>({
        title: '',
        body: '',
        imageUrl: '',
        tokens: '',
        target: {
            all: false,
            ios: false,
            android: false
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const tokens = notification.tokens.split(',').map(t => t.trim()).filter(Boolean);
            
            if (tokens.length === 0 && !notification.target.all && !notification.target.ios && !notification.target.android) {
                toast({
                    title: '오류',
                    description: 'FCM 토큰이나 대상 플랫폼을 지정해주세요.',
                    variant: 'destructive',
                });
                return;
            }

            const response = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    notification: {
                        title: notification.title,
                        body: notification.body,
                        imageUrl: notification.imageUrl || undefined,
                    },
                    tokens,
                    platform: notification.target.all ? 'all' : 
                             notification.target.ios && notification.target.android ? 'all' :
                             notification.target.ios ? 'ios' : 'android',
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: '성공',
                    description: `알림이 성공적으로 전송되었습니다. (성공: ${data.stats.success}, 실패: ${data.stats.failure})`,
                });
                setNotification({
                    title: '',
                    body: '',
                    imageUrl: '',
                    tokens: '',
                    target: { all: false, ios: false, android: false }
                });
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast({
                title: '오류',
                description: error instanceof Error ? error.message : '알림 전송에 실패했습니다.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>알림 즉시 발송</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>제목</Label>
                            <Input
                                value={notification.title}
                                onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                                placeholder="알림 제목을 입력하세요"
                                required
                            />
                        </div>

                        <div>
                            <Label>내용</Label>
                            <Textarea
                                value={notification.body}
                                onChange={(e) => setNotification({ ...notification, body: e.target.value })}
                                placeholder="알림 내용을 입력하세요"
                                required
                            />
                        </div>

                        <div>
                            <Label>이미지 URL (선택사항)</Label>
                            <Input
                                type="url"
                                value={notification.imageUrl}
                                onChange={(e) => setNotification({ ...notification, imageUrl: e.target.value })}
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>

                        <div>
                            <Label>FCM 토큰 (쉼표로 구분)</Label>
                            <Textarea
                                value={notification.tokens}
                                onChange={(e) => setNotification({ ...notification, tokens: e.target.value })}
                                placeholder="FCM 토큰을 쉼표(,)로 구분하여 입력하세요"
                            />
                        </div>

                        <div>
                            <Label>대상 플랫폼</Label>
                            <div className="mt-2 space-x-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={notification.target.all}
                                        onChange={(e) => setNotification({
                                            ...notification,
                                            target: {
                                                all: e.target.checked,
                                                ios: e.target.checked,
                                                android: e.target.checked
                                            }
                                        })}
                                        className="mr-2"
                                    />
                                    전체
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={notification.target.ios}
                                        onChange={(e) => setNotification({
                                            ...notification,
                                            target: {
                                                ...notification.target,
                                                all: false,
                                                ios: e.target.checked
                                            }
                                        })}
                                        className="mr-2"
                                        disabled={notification.target.all}
                                    />
                                    iOS
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={notification.target.android}
                                        onChange={(e) => setNotification({
                                            ...notification,
                                            target: {
                                                ...notification.target,
                                                all: false,
                                                android: e.target.checked
                                            }
                                        })}
                                        className="mr-2"
                                        disabled={notification.target.all}
                                    />
                                    Android
                                </label>
                            </div>
                        </div>

                        <Button type="submit" className="w-full">
                            알림 전송
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
} 