'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import InstantPage from '@/components/pages/InstantPage';
import AutomationRegisterPage from '@/components/pages/AutomationRegisterPage';
import AutomationManagePage from '@/components/pages/AutomationManagePage';

export default function HomePage() {
    const { data: session, status } = useSession();
    const [activeTab, setActiveTab] = useState('instant');

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <div className="card w-96 bg-base-100 shadow-xl">
                    <div className="card-body text-center">
                        <h2 className="text-3xl font-bold">
                            FCM Web Push
                        </h2>
                        <p className="text-sm text-base-content/70 mt-2">
                            Teams 계정으로 로그인하여 시작하세요
                        </p>
                        <div className="mt-6">
                            <Link
                                href="/auth/signin"
                                className="btn btn-primary w-full"
                            >
                                로그인
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">FCM Web Push</h1>
                    <p className="text-base-content/70 mt-2">
                        Firebase Cloud Messaging을 통한 웹 푸시 알림 서비스
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-base-content/70">
                        {session.user?.email}
                    </div>
                    <Link
                        href="/api/auth/signout"
                        className="text-sm text-primary hover:text-primary-focus"
                    >
                        로그아웃
                    </Link>
                </div>
            </div>

            <div className="tabs tabs-boxed mb-6">
                <button
                    className={`tab ${activeTab === 'instant' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('instant')}
                >
                    즉시 발송
                </button>
                <button
                    className={`tab ${activeTab === 'register' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('register')}
                >
                    자동화 등록
                </button>
                <button
                    className={`tab ${activeTab === 'manage' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('manage')}
                >
                    자동화 관리
                </button>
            </div>

            <div className="mt-6">
                {activeTab === 'instant' && <InstantPage />}
                {activeTab === 'register' && <AutomationRegisterPage />}
                {activeTab === 'manage' && <AutomationManagePage />}
            </div>
        </div>
    );
} 