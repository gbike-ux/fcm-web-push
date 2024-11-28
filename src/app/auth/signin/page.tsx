import { signIn } from 'next-auth/react';

export default function SignIn() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        관리자 로그인
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Microsoft Teams 계정으로 로그인하세요
                    </p>
                </div>
                <div className="mt-8">
                    <button
                        onClick={() => signIn('azure-ad', { callbackUrl: '/' })}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-[#464EB8] hover:bg-[#7B83EB] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#464EB8]"
                    >
                        <svg
                            className="w-5 h-5 mr-2"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M11.5 12.5V2.5H2.5V12.5H11.5Z" fill="#4050B5" />
                            <path d="M21.5 12.5V2.5H12.5V12.5H21.5Z" fill="#5B6BBF" />
                            <path d="M11.5 22.5V12.5H2.5V22.5H11.5Z" fill="#6B7BCF" />
                            <path d="M21.5 22.5V12.5H12.5V22.5H21.5Z" fill="#8B9BDF" />
                        </svg>
                        Teams로 로그인
                    </button>
                </div>
            </div>
        </div>
    );
} 