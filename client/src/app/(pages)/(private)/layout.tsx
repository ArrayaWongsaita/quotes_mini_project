'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from '@/app/loading';

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're sure the session is not loading and the user is not authenticated
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return <Loading />;
  }

  // Don't render children until we're sure the user is authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}
