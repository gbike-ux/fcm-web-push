'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AutomationRule, EventType, EVENT_NOTIFICATIONS } from '@/types/events';
import { useToast } from '@/components/ui/use-toast';

export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [automation, setAutomation] = useState<Partial<AutomationRule>>({
        name: '',
        eventType: undefined,
        notification: {
            title: '',
            body: '',
            imageUrl: '',
        },
        schedule: {
            type: 'once',
            startDate: new Date().toISOString(),
        },
        target: {
            all: false,
            ios: false,
            android: false,
        },
        enabled: true,
    });
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [selectedTime, setSelectedTime] = useState('09:00');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (!automation.eventType || !automation.notification?.title || !automation.notification?.body) {
                toast({
                    title: '오류',
                    description: '필수 필드를 모두 입력해주세요.',
                    variant: 'destructive',
                });
                return;
            }

            // 스케줄 정보 설정
            const schedule = {
                type: automation.schedule?.type,
                startDate: startDate?.toISOString(),
                endDate: endDate?.toISOString(),
                ...(automation.schedule?.type === 'weekly' && { daysOfWeek: selectedDays }),
                ...(automation.schedule?.type !== 'once' && { time: selectedTime }),
            };

            const response = await fetch('/api/automation/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...automation,
                    schedule,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: '성공',
                    description: '자동화가 등록되었습니다.',
                });
                router.push('/automation');
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast({
                title: '오류',
                description: error instanceof Error ? error.message : '자동화 등록에 실패했습니다.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>자동화 등록</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>이름</Label>
                            <Input
                                value={automation.name}
                                onChange={(e) => setAutomation(prev => ({
                                    ...prev,
                                    name: e.target.value,
                                }))}
                                placeholder="자동화 이름"
                                required
                            />
                        </div>

                        <div>
                            <Label>이벤트</Label>
                            <Select
                                value={automation.eventType}
                                onValueChange={(value: EventType) => setAutomation(prev => ({
                                    ...prev,
                                    eventType: value,
                                }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="이벤트 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(EVENT_NOTIFICATIONS).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>
                                            {value}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>알림 내용</Label>
                            <Input
                                value={automation.notification?.title}
                                onChange={(e) => setAutomation(prev => ({
                                    ...prev,
                                    notification: {
                                        ...prev.notification!,
                                        title: e.target.value,
                                    },
                                }))}
                                placeholder="제목"
                                className="mb-2"
                                required
                            />
                            <Textarea
                                value={automation.notification?.body}
                                onChange={(e) => setAutomation(prev => ({
                                    ...prev,
                                    notification: {
                                        ...prev.notification!,
                                        body: e.target.value,
                                    },
                                }))}
                                placeholder="내용"
                                required
                            />
                        </div>

                        <div>
                            <Label>이미지 URL (선택사항)</Label>
                            <Input
                                type="url"
                                value={automation.notification?.imageUrl}
                                onChange={(e) => setAutomation(prev => ({
                                    ...prev,
                                    notification: {
                                        ...prev.notification!,
                                        imageUrl: e.target.value,
                                    },
                                }))}
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>

                        <div>
                            <Label>스케줄</Label>
                            <Select
                                value={automation.schedule?.type}
                                onValueChange={(value: 'once' | 'daily' | 'weekly' | 'monthly') =>
                                    setAutomation(prev => ({
                                        ...prev,
                                        schedule: {
                                            ...prev.schedule!,
                                            type: value,
                                        },
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="스케줄 유형" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="once">1회성</SelectItem>
                                    <SelectItem value="daily">매일</SelectItem>
                                    <SelectItem value="weekly">매주</SelectItem>
                                    <SelectItem value="monthly">매월</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="mt-4 space-y-4">
                                <div>
                                    <Label>시작일</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !startDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {startDate ? format(startDate, "PPP") : "날짜 선택"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={startDate}
                                                onSelect={setStartDate}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {automation.schedule?.type !== 'once' && (
                                    <>
                                        <div>
                                            <Label>종료일 (선택사항)</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !endDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {endDate ? format(endDate, "PPP") : "날짜 선택"}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={endDate}
                                                        onSelect={setEndDate}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        {automation.schedule?.type === 'weekly' && (
                                            <div>
                                                <Label>요일 선택</Label>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                                                        <Button
                                                            key={day}
                                                            type="button"
                                                            variant={selectedDays.includes(index) ? "default" : "outline"}
                                                            className="w-12"
                                                            onClick={() => {
                                                                setSelectedDays(prev =>
                                                                    prev.includes(index)
                                                                        ? prev.filter(d => d !== index)
                                                                        : [...prev, index]
                                                                );
                                                            }}
                                                        >
                                                            {day}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <Label>시간</Label>
                                            <Input
                                                type="time"
                                                value={selectedTime}
                                                onChange={(e) => setSelectedTime(e.target.value)}
                                                className="mt-2"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div>
                            <Label>대상 플랫폼</Label>
                            <div className="mt-2 space-x-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={automation.target?.all}
                                        onChange={(e) => setAutomation(prev => ({
                                            ...prev,
                                            target: {
                                                all: e.target.checked,
                                                ios: e.target.checked,
                                                android: e.target.checked,
                                            },
                                        }))}
                                        className="mr-2"
                                    />
                                    전체
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={automation.target?.ios}
                                        onChange={(e) => setAutomation(prev => ({
                                            ...prev,
                                            target: {
                                                ...prev.target!,
                                                all: false,
                                                ios: e.target.checked,
                                            },
                                        }))}
                                        className="mr-2"
                                        disabled={automation.target?.all}
                                    />
                                    iOS
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={automation.target?.android}
                                        onChange={(e) => setAutomation(prev => ({
                                            ...prev,
                                            target: {
                                                ...prev.target!,
                                                all: false,
                                                android: e.target.checked,
                                            },
                                        }))}
                                        className="mr-2"
                                        disabled={automation.target?.all}
                                    />
                                    Android
                                </label>
                            </div>
                        </div>

                        <Button type="submit" className="w-full">
                            등록
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
} 