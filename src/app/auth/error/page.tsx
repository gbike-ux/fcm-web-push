import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ErrorPage() {
    const searchParams = useSearchParams();
    const error = searchParams?.get('error');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-red-600">
                        로그인 오류
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {error === 'AccessDenied'
                            ? '접근이 거부되었습니다. 회사 계정으로 로그인해주세요.'
                            : '로그인 중 오류가 발생했습니다. 다시 시도해주세요.'}
                    </p>
                </div>
                <div className="mt-8">
                    <Link
                        href="/auth/signin"
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        로그인 페이지로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
} 