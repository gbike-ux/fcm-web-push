'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SignInContent() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    const handleSignIn = async () => {
        try {
            const result = await signIn('azure-ad', {
                redirect: false,
                callbackUrl
            });
            
            if (result?.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            console.error('Sign in error:', error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        로그인
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Teams 계정으로 로그인하세요
                    </p>
                </div>
                <div className="mt-8">
                    <button
                        type="button"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={handleSignIn}
                    >
                        Teams로 로그인
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    로딩 중...
                </div>
            </div>
        }>
            <SignInContent />
        </Suspense>
    );
} 