
"use client";

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/shared/Header';

export default function ParentLayout({ children }: { children: ReactNode }) {
  const { user, userProfile, loading, isParent } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/parent/login'); // Not logged in, redirect to parent login
      } else if (!isParent) {
        // Logged in but not identified as a parent (e.g., child account tried to access /parent/*)
        // Or if profile is still loading / role not determined yet
        router.replace('/'); // Redirect to role selection or a generic error page
      }
    }
  }, [user, loading, isParent, router]);

  if (loading || !user || !isParent) {
    return <div className="flex h-screen items-center justify-center"><p>Loading parent dashboard...</p></div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={userProfile?.name ? `${userProfile.name}'s Dashboard` : "Parent Dashboard"} />
      <main className="flex-1 container py-8">
        {children}
      </main>
    </div>
  );
}
