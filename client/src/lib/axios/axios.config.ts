import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

// สร้าง instance ของ axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();

  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('Access token invalid or expired. Signing out...');
      await signOut({ callbackUrl: '/signin' });
    }

    return Promise.reject(error);
  }
);

export default api;
