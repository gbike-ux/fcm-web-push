'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EVENT_NOTIFICATIONS, type EventType } from '@/types/events';

interface AutomationForm {
    name: string;
    eventType: EventType;
    notification: {
        title: string;
        body: string;
    };
    schedule?: {
        type: 'once' | 'daily' | 'weekly';
        startDate?: string;
        endDate?: string;
        daysOfWeek?: number[];
        time?: string;
    };
    target: {
        all: boolean;
        ios: boolean;
        android: boolean;
    };
}

export default function AutomationRegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState<AutomationForm>({
        name: '',
        eventType: 'AcademyVerifyView_VIEW',
        notification: {
            title: '',
            body: '',
        },
        target: {
            all: true,
            ios: false,
            android: false,
        },
    });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
        setToast({ message, type });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name || !form.notification.title || !form.notification.body) {
            showToast('필수 필드를 모두 입력해주세요.', 'error');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/automations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form),
            });

            if (!response.ok) {
                throw new Error('Failed to create automation');
            }

            const data = await response.json();
            showToast('자동화가 성공적으로 등록되었습니다.', 'success');
            router.push('/automation');
        } catch (error) {
            showToast('자동화 등록 중 오류가 발생했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title">자동화 등록</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">자동화 이름</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="자동화 이름을 입력하세요"
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">이벤트 유형</span>
                        </label>
                        <select
                            className="select select-bordered w-full"
                            value={form.eventType}
                            onChange={(e) => setForm({ ...form, eventType: e.target.value as EventType })}
                        >
                            {Object.entries(EVENT_NOTIFICATIONS).map(([key, value]) => (
                                <option key={key} value={key}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">알림 제목</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            value={form.notification.title}
                            onChange={(e) => setForm({
                                ...form,
                                notification: { ...form.notification, title: e.target.value }
                            })}
                            placeholder="알림 제목을 입력하세요"
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">알림 내용</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered h-24"
                            value={form.notification.body}
                            onChange={(e) => setForm({
                                ...form,
                                notification: { ...form.notification, body: e.target.value }
                            })}
                            placeholder="알림 내용을 입력하세요"
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">대상 플랫폼</span>
                        </label>
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={form.target.all}
                                    onChange={(e) => setForm({
                                        ...form,
                                        target: {
                                            ...form.target,
                                            all: e.target.checked,
                                            ios: e.target.checked,
                                            android: e.target.checked,
                                        }
                                    })}
                                />
                                <span>전체</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={form.target.ios}
                                    onChange={(e) => setForm({
                                        ...form,
                                        target: { ...form.target, ios: e.target.checked }
                                    })}
                                    disabled={form.target.all}
                                />
                                <span>iOS</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={form.target.android}
                                    onChange={(e) => setForm({
                                        ...form,
                                        target: { ...form.target, android: e.target.checked }
                                    })}
                                    disabled={form.target.all}
                                />
                                <span>Android</span>
                            </label>
                        </div>
                    </div>

                    <div className="card-actions justify-end">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => router.back()}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className={`btn btn-primary ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? '등록 중...' : '등록'}
                        </button>
                    </div>
                </form>
            </div>

            {toast && (
                <div className="toast toast-end">
                    <div className={`alert ${
                        toast.type === 'success' ? 'alert-success' :
                        toast.type === 'error' ? 'alert-error' :
                        'alert-info'
                    }`}>
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
} 