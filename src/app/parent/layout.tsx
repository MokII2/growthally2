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
        router.replace('/'); // Not logged in, redirect to role selection
      } else if (!isParent) {
        router.replace('/'); // Logged in but not a parent, redirect
      }
    }
  }, [user, loading, isParent, router]);

  if (loading || !user || !isParent) {
    // Show a loading state or a minimal layout while checking auth
    return <div className="flex h-screen items-center justify-center"><p>正在加载家长仪表盘...</p></div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="家长仪表盘" />
      <main className="flex-1 container py-8">
        {children}
      </main>
    </div>
  );
}
