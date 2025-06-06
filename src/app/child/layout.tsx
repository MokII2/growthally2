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
    return <div className="flex h-screen items-center justify-center"><p>正在加载孩子仪表盘...</p></div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={userProfile?.displayName ? `${userProfile.displayName}的仪表盘` : "孩子仪表盘"} />
      <main className="flex-1 container py-8">
        {children}
      </main>
    </div>
  );
}
