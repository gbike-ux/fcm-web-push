'use client';

import { useEffect, useState } from 'react';

interface Automation {
    id: string;
    name: string;
    eventType: string;
    condition: string;
    isActive: boolean;
    createdAt: string;
    lastTriggered?: string;
    triggerCount: number;
}

export default function AutomationManagePage() {
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchAutomations();
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
        setToast({ message, type });
    };

    const fetchAutomations = async () => {
        try {
            const response = await fetch('/api/automations');
            if (!response.ok) {
                throw new Error('Failed to fetch automations');
            }
            const data = await response.json();
            setAutomations(data);
        } catch (error) {
            showToast('자동화 규칙 목록을 불러오는 중 오류가 발생했습니다.', 'error');
        }
    };

    const handleToggleActive = async (id: string, currentState: boolean) => {
        try {
            const response = await fetch(`/api/automations/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isActive: !currentState,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update automation');
            }

            setAutomations(automations.map(automation =>
                automation.id === id
                    ? { ...automation, isActive: !currentState }
                    : automation
            ));

            showToast('자동화 규칙의 상태가 성공적으로 변경되었습니다.', 'success');
        } catch (error) {
            showToast('자동화 규칙의 상태를 변경하는 중 오류가 발생했습니다.', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('정말로 이 자동화 규칙을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await fetch(`/api/automations/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete automation');
            }

            setAutomations(automations.filter(automation => automation.id !== id));
            showToast('자동화 규칙이 성공적으로 삭제되었습니다.', 'success');
        } catch (error) {
            showToast('자동화 규칙을 삭제하는 중 오류가 발생했습니다.', 'error');
        }
    };

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title">자동화 관리</h2>
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>이름</th>
                                <th>이벤트 유형</th>
                                <th>조건</th>
                                <th>활성화</th>
                                <th>생성일</th>
                                <th>마지막 실행</th>
                                <th>실행 횟수</th>
                                <th>작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {automations.map((automation) => (
                                <tr key={automation.id}>
                                    <td>{automation.name}</td>
                                    <td>
                                        <div className="badge badge-outline">
                                            {automation.eventType}
                                        </div>
                                    </td>
                                    <td className="max-w-[200px] truncate">
                                        {automation.condition}
                                    </td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary"
                                            checked={automation.isActive}
                                            onChange={() =>
                                                handleToggleActive(automation.id, automation.isActive)
                                            }
                                        />
                                    </td>
                                    <td>
                                        {new Date(automation.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        {automation.lastTriggered
                                            ? new Date(automation.lastTriggered).toLocaleDateString()
                                            : '-'}
                                    </td>
                                    <td>
                                        <div className="badge badge-neutral">
                                            {automation.triggerCount}
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-error btn-sm"
                                            onClick={() => handleDelete(automation.id)}
                                        >
                                            삭제
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {automations.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-4">
                                        등록된 자동화 규칙이 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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