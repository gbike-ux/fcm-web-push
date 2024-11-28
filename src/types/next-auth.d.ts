import 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id?: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            teams?: {
                id: string;
                email: string;
                name: string;
            };
        };
    }

    interface JWT {
        sub?: string;
        email?: string;
        name?: string;
        accessToken?: string;
        idToken?: string;
        teams?: {
            id: string;
            email: string;
            name: string;
        };
    }
} 