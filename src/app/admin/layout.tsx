
"use client";

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/shared/Header';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, userProfile, loading, isAdministrator } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/'); // Not logged in, redirect to role selection or main login
      } else if (!isAdministrator) {
        router.replace('/'); // Logged in but not an admin, redirect
      }
    }
  }, [user, loading, isAdministrator, router]);

  if (loading || !user || !isAdministrator) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading admin section...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={userProfile?.name ? `${userProfile.name}'s Admin Panel` : "Admin Panel"} />
      <main className="flex-1 container py-8">
        {children}
      </main>
    </div>
  );
}
