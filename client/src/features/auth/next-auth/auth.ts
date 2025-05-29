import { jwtDecode } from 'jwt-decode';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch('http://localhost:4000/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) throw refreshedTokens;

    if (refreshedTokens.accessToken) {
      const decodedToken = jwtDecode(refreshedTokens.accessToken);
      console.log(decodedToken);
      refreshedTokens.accessTokenExpires = decodedToken?.exp
        ? Math.floor(decodedToken.exp * 1000)
        : 0;
    }

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      accessTokenExpires:
        refreshedTokens.accessTokenExpires ?? token.accessTokenExpires,
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
      user: refreshedTokens.user,
    };
  } catch (error) {
    console.error('Refresh token error', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Custom Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const res = await fetch('http://localhost:4000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
        });

        const userData = await res.json();

        if (res.ok && userData.accessToken) {
          // Ensure the returned object conforms to User type
          const user: User = {
            // id: userData.id,
            // name: userData.name,
            // email: userData.email,
            user: userData.user, // Assuming userData.user is an object with user details
            accessToken: userData.accessToken,
            refreshToken: userData.refreshToken,
          };
          return user;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initialize accessToken and refreshToken if not present
      if (!token.accessToken) token.accessToken = '';
      if (!token.refreshToken) token.refreshToken = '';

      if (token.accessToken) {
        try {
          const decodedToken = jwtDecode(token.accessToken);
          token.accessTokenExpires = decodedToken?.exp
            ? Math.floor(decodedToken.exp * 1000)
            : 0;
        } catch (error) {
          console.error('Error decoding token:', error);
          token.accessTokenExpires = 0;
        }
      }

      // Initial login
      if (user) {
        return {
          id: user.id,
          accessToken: user.accessToken ?? '',
          refreshToken: user.refreshToken ?? '',
          accessTokenExpires: token.accessTokenExpires,
          user: {
            id: user.user.id,
            name: user.user.name || null,
            email: user.user.email || null,
          },
        };
      }

      // Check if token expired
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token; // Return unchanged token if still valid
      }

      // Refresh the token
      return await refreshAccessToken(token);
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.user) {
        session.user = {
          id: token.user.id,
          name: token.user.name,
          email: token.user.email,
        };
      }

      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.error = token.error;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
