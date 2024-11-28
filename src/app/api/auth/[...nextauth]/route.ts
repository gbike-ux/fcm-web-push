import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

const handler = NextAuth({
    providers: [
        AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            tenantId: process.env.AZURE_AD_TENANT_ID,
            authorization: {
                params: {
                    scope: 'openid profile email User.Read'
                }
            }
        })
    ],
    callbacks: {
        async signIn({ account, profile }) {
            if (account?.provider === 'azure-ad') {
                // Teams 도메인 체크 (옵션)
                return profile?.email?.endsWith('@your-company-domain.com') ?? false;
            }
            return false;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.id = token.sub;
                // Teams 관련 추가 정보를 세션에 포함
                session.user.teams = {
                    id: token.sub,
                    email: token.email,
                    name: token.name
                };
            }
            return session;
        },
        async jwt({ token, account, profile }) {
            if (account) {
                token.accessToken = account.access_token;
                token.idToken = account.id_token;
                if (profile) {
                    token.teams = {
                        id: profile.sub,
                        email: profile.email,
                        name: profile.name
                    };
                }
            }
            return token;
        }
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error'
    },
    session: {
        strategy: 'jwt'
    }
});

export { handler as GET, handler as POST }; 