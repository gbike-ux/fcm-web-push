'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Settings2, Archive, Trash2 } from 'lucide-react';
import { AutomationRule, EVENT_NOTIFICATIONS } from '@/types/events';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface ListParams {
    status: 'all' | 'active' | 'inactive' | 'archived';
    platform: 'all' | 'ios' | 'android';
    search: string;
    sort: 'name' | 'createdAt' | 'updatedAt' | 'sent' | 'success';
    order: 'asc' | 'desc';
}

export default function AutomationPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [automations, setAutomations] = useState<AutomationRule[]>([]);
    const [params, setParams] = useState<ListParams>({
        status: 'all',
        platform: 'all',
        search: '',
        sort: 'createdAt',
        order: 'desc',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAutomations();
    }, [params]);

    const fetchAutomations = async () => {
        try {
            const queryParams = new URLSearchParams({
                status: params.status,
                platform: params.platform,
                search: params.search,
                sort: params.sort,
                order: params.order,
            });

            const response = await fetch(`/api/automation/list?${queryParams}`);
            const data = await response.json();
            
            if (data.success) {
                setAutomations(data.automations);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast({
                title: "오류",
                description: "자동화 목록을 불러오는데 실패했습니다.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (checked: boolean, automation: AutomationRule) => {
        try {
            const response = await fetch(`/api/automation/${automation.id}/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ enabled: checked }),
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: "성공",
                    description: `자동화가 ${checked ? '활성화' : '비활성화'}되었습니다.`,
                });
                fetchAutomations();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast({
                title: "오류",
                description: "상태 변경에 실패했습니다.",
                variant: "destructive",
            });
        }
    };

    const handleArchive = async (id: string) => {
        try {
            const response = await fetch(`/api/automation/${id}/archive`, {
                method: 'POST',
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: "성공",
                    description: "자동화가 아카이브되었습니다.",
                });
                fetchAutomations();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast({
                title: "오류",
                description: "아카이브에 실패했습니다.",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`/api/automation/${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: "성공",
                    description: "자동화가 삭제되었습니다.",
                });
                fetchAutomations();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast({
                title: "오류",
                description: "삭제에 실패했습니다.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">자동화 관리</h1>
                <Button onClick={() => router.push('/automation/register')}>
                    <Plus className="mr-2 h-4 w-4" />
                    새 자동화 등록
                </Button>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>필터 및 검색</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <Label>상태</Label>
                            <Select
                                value={params.status}
                                onValueChange={(value: ListParams['status']) =>
                                    setParams(prev => ({ ...prev, status: value }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="상태 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">전체</SelectItem>
                                    <SelectItem value="active">활성</SelectItem>
                                    <SelectItem value="inactive">비활성</SelectItem>
                                    <SelectItem value="archived">아카이브</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>플랫폼</Label>
                            <Select
                                value={params.platform}
                                onValueChange={(value: ListParams['platform']) =>
                                    setParams(prev => ({ ...prev, platform: value }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="플랫폼 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">전체</SelectItem>
                                    <SelectItem value="ios">iOS</SelectItem>
                                    <SelectItem value="android">Android</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>정렬</Label>
                            <Select
                                value={`${params.sort}-${params.order}`}
                                onValueChange={(value: string) => {
                                    const [sort, order] = value.split('-') as [ListParams['sort'], ListParams['order']];
                                    setParams(prev => ({ ...prev, sort, order }));
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="정렬 기준" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="name-asc">이름 (오름차순)</SelectItem>
                                    <SelectItem value="name-desc">이름 (내림차순)</SelectItem>
                                    <SelectItem value="createdAt-desc">최근 등록순</SelectItem>
                                    <SelectItem value="updatedAt-desc">최근 수정순</SelectItem>
                                    <SelectItem value="sent-desc">발송 수 (많은순)</SelectItem>
                                    <SelectItem value="success-desc">성공률 (높은순)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>검색</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="자동화 이름 또는 이벤트"
                                    value={params.search}
                                    onChange={(e) => setParams(prev => ({ ...prev, search: e.target.value }))}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {loading ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            로딩 중...
                        </CardContent>
                    </Card>
                ) : automations.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            {params.search
                                ? '검색 결과가 없습니다.'
                                : '등록된 자동화가 없습니다.'}
                        </CardContent>
                    </Card>
                ) : (
                    automations.map((automation) => (
                        <Card key={automation.id}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="text-lg font-semibold">
                                                {automation.name}
                                            </h3>
                                            <Badge variant={automation.enabled ? "default" : "secondary"}>
                                                {automation.enabled ? '활성' : '비활성'}
                                            </Badge>
                                            {automation.archived && (
                                                <Badge variant="outline">아카이브</Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            이벤트: {EVENT_NOTIFICATIONS[automation.eventType]}
                                        </div>
                                        <div className="text-sm">
                                            대상: {automation.target.all ? '전체' : (
                                                <>
                                                    {automation.target.ios && 'iOS'}
                                                    {automation.target.ios && automation.target.android && ', '}
                                                    {automation.target.android && 'Android'}
                                                </>
                                            )}
                                        </div>
                                        {automation.schedule && (
                                            <div className="text-sm">
                                                스케줄: {automation.schedule.type === 'once'
                                                    ? `1회성 (${format(new Date(automation.schedule.startDate), 'PPP')})`
                                                    : automation.schedule.type === 'daily'
                                                    ? `매일 ${automation.schedule.time}`
                                                    : `매주 ${automation.schedule.daysOfWeek?.map(d =>
                                                        ['일', '월', '화', '수', '목', '금', '토'][d]
                                                    ).join(', ')} ${automation.schedule.time}`}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={automation.enabled}
                                            onCheckedChange={(checked: boolean) => handleToggle(checked, automation)}
                                            disabled={automation.archived}
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => router.push(`/automation/${automation.id}`)}
                                        >
                                            <Settings2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleArchive(automation.id!)}
                                            disabled={automation.archived}
                                        >
                                            <Archive className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleDelete(automation.id!)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-3 gap-4">
                                    <div>
                                        <Label>총 발송</Label>
                                        <div className="text-2xl font-bold">
                                            {automation.stats?.sent.toLocaleString()}건
                                        </div>
                                    </div>
                                    <div>
                                        <Label>성공률</Label>
                                        <div className="text-2xl font-bold">
                                            {automation.stats?.sent
                                                ? Math.round((automation.stats.success / automation.stats.sent) * 100)
                                                : 0}%
                                        </div>
                                    </div>
                                    <div>
                                        <Label>실패율</Label>
                                        <div className="text-2xl font-bold">
                                            {automation.stats?.sent
                                                ? Math.round((automation.stats.failure / automation.stats.sent) * 100)
                                                : 0}%
                                        </div>
                                    </div>
                                </div>

                                {automation.history && automation.history.length > 0 && (
                                    <div className="mt-4 border-t pt-4">
                                        <Label>최근 발송 이력</Label>
                                        <div className="mt-2 space-y-2">
                                            {automation.history.slice(0, 5).map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex justify-between items-center text-sm"
                                                >
                                                    <div>
                                                        {format(new Date(item.timestamp), 'PPP p')}
                                                    </div>
                                                    <div>
                                                        {item.success ? '성공' : '실패'}
                                                        {item.recipients && ` (${item.recipients}명)`}
                                                        {item.error && ` - ${item.error}`}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
} 