'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto py-3">
        <div className="flex justify-between items-center">
          <Link
            href={session ? '/quotes' : '/'}
            className="flex items-center gap-2"
          >
            <div className="bg-primary rounded-md p-1.5 text-primary-foreground font-bold text-xl">
              Q
            </div>
            <span className="text-xl font-bold tracking-tight">QOUTE</span>
          </Link>

          <div className="flex items-center gap-3">
            {session ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-accent/50 rounded-full px-3 py-1.5">
                    <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium truncate max-w-[100px]">
                      {session.user?.name ||
                        session.user?.email?.split('@')[0] ||
                        'User'}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <Button size="sm" variant="outline" asChild>
                <Link href="/signin">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
