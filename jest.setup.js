import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({
        push: jest.fn(),
        refresh: jest.fn(),
    })),
    useSearchParams: jest.fn(() => ({
        get: jest.fn(),
    })),
}));

// Mock next/server
jest.mock('next/server', () => {
    const nextUrl = new URL('http://localhost:3000');
    return {
        NextRequest: jest.fn().mockImplementation((url) => ({
            nextUrl: new URL(url),
            url,
        })),
        NextResponse: {
            json: jest.fn().mockImplementation((body, init) => ({
                status: init?.status || 200,
                json: async () => body,
            })),
        },
    };
});

// Mock Firebase Admin
jest.mock('@/lib/firebase-admin', () => ({
    db: {
        collection: jest.fn(),
    },
    messaging: {
        send: jest.fn(),
        sendMulticast: jest.fn(),
    },
}));

// Mock window.confirm
window.confirm = jest.fn(() => true);
  