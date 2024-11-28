'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        로그인 오류
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {error === 'AccessDenied' 
                            ? '접근이 거부되었습니다. Teams 계정으로만 로그인이 가능합니다.'
                            : '로그인 중 오류가 발생했습니다.'}
                    </p>
                </div>
                <div className="mt-8">
                    <Link
                        href="/"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        홈으로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    로딩 중...
                </div>
            </div>
        }>
            <ErrorContent />
        </Suspense>
    );
} 