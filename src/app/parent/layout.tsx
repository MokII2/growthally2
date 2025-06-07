
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
        // No user logged in, redirect to parent login page
        router.replace('/parent/login');
      } else if (!isParent) {
        // User is logged in, but not identified as a parent (e.g., a child account or profile loading issue)
        // Redirect to role selection. If they are a child, they'll be redirected from there.
        router.replace('/');
      }
      // If user is logged in AND isParent is true, they can access the parent dashboard.
    }
  }, [user, loading, isParent, router]);

  // This loading state handles both initial auth check and profile loading
  if (loading) {
    return <div className="flex h-screen items-center justify-center"><p>Loading parent dashboard...</p></div>;
  }

  // If, after loading, there's no user or the user is not a parent,
  // useEffect should have redirected. This is a fallback or for edge cases.
  if (!user || !isParent) {
     // This might briefly show if redirection is slow, or if there's an auth state inconsistency
    return <div className="flex h-screen items-center justify-center"><p>Access Denied. Redirecting...</p></div>;
  }
  
  // At this point, user is authenticated, profile is loaded, and role is 'parent'
  return (
    <div className="flex min-h-screen flex-col">
      <Header title={userProfile?.name ? `${userProfile.name}'s Dashboard` : "Parent Dashboard"} />
      <main className="flex-1 container py-8">
        {children}
      </main>
    </div>
  );
}
