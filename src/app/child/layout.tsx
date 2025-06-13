
"use client";

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/shared/Header';

export default function ChildLayout({ children }: { children: ReactNode }) {
  const { user, userProfile, loading, isChild } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login'); // Not logged in, redirect to child login
      } else if (!isChild) {
        router.replace('/'); // Logged in but not a child, redirect to role selection
      }
    }
  }, [user, loading, isChild, router]);

  if (loading || !user || !isChild) {
    return <div className="flex h-screen items-center justify-center"><p>Loading child dashboard...</p></div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={userProfile?.displayName ? `${userProfile.displayName}'s Dashboard` : "Child Dashboard"} />
      <main className="flex-1 container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
