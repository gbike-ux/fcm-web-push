'use client';

import { useState, useEffect } from 'react';

interface NotificationForm {
    title: string;
    message: string;
}

export default function InstantPage() {
    const [form, setForm] = useState<NotificationForm>({
        title: '',
        message: '',
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
        
        if (!form.title || !form.message) {
            showToast('제목과 내용을 모두 입력해주세요.', 'error');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...form,
                    targetToken: process.env.NEXT_PUBLIC_ADMIN_FCM_TOKEN,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send notification');
            }

            const data = await response.json();
            
            if (data.success) {
                showToast('알림이 성공적으로 전송되었습니다.', 'success');
                setForm({
                    title: '',
                    message: '',
                });
            } else {
                throw new Error(data.error || 'Failed to send notification');
            }
        } catch (error) {
            showToast('알림 전송 중 오류가 발생했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title">즉시 발송</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">제목</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="알림 제목을 입력하세요"
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">내용</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered h-24"
                            value={form.message}
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                            placeholder="알림 내용을 입력하세요"
                        />
                    </div>

                    <div className="card-actions justify-end">
                        <button
                            type="submit"
                            className={`btn btn-primary ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? '전송 중...' : '전송'}
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