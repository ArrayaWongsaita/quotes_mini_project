import 'next-auth';

declare module 'next-auth' {
  interface User {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
    };
  }

  interface Session {
    accessToken: string;
    refreshToken: string;
    error?: 'RefreshAccessTokenError' | string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires?: number;
    user?: {
      id: string;
      name: string | null;
      email: string | null;
    };
    error?: 'RefreshAccessTokenError' | string;
  }
}
