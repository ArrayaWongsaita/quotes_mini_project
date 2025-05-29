'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to quotes page if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/quotes');
    }
  }, [session, status, router]);

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin size-8 border-4 border-primary/20 border-t-primary rounded-full"></div>
      </div>
    );
  }

  // Only render the homepage content if not authenticated
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
      {/* Welcome Section */}
      <section className="relative w-full flex flex-col items-center justify-center px-4 py-20">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-md w-full bg-card/80 backdrop-blur-sm border border-border/40 rounded-xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="bg-primary rounded-xl p-3 text-primary-foreground font-bold text-3xl inline-flex mb-6">
              Q
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Welcome to QOUTE
            </h1>
            <p className="text-muted-foreground">
              Discover, share, and be inspired by quotes that matter.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button size="lg" className="w-full" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full" asChild>
              <Link href="/signup">Create Account</Link>
            </Button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-8">
          Share wisdom, find inspiration, vote for your favorites.
        </p>
      </section>
    </main>
  );
}
