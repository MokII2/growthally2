
"use client";

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/shared/Header';

export default function ParentLayout({ children }: { children: ReactNode }) {
  const { user, userProfile, loading, isParent } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get current path

  // Determine if the current page is one of the authentication pages
  const isAuthPage = pathname === '/parent/login' || pathname === '/parent/register';

  useEffect(() => {
    // This effect only applies to non-auth pages within the parent layout
    if (!loading && !isAuthPage) {
      if (!user) {
        // No user logged in, redirect to parent login page
        router.replace('/parent/login');
      } else if (!isParent) {
        // User is logged in, but not identified as a parent
        // Redirect to role selection. If they are a child, they'll be redirected from there.
        router.replace('/');
      }
      // If user is logged in AND isParent is true, they can access the protected parent pages.
    }
  }, [user, loading, isParent, router, isAuthPage, pathname]); // Added isAuthPage and pathname to dependency array

  if (isAuthPage) {
    // For login/register pages, render children directly.
    // These pages typically have their own full-screen layout and handle
    // redirecting already authenticated users themselves.
    return <>{children}</>;
  }

  // For protected parent pages (e.g., /parent/dashboard)
  if (loading) {
    // This loading state handles both initial auth check and profile loading for protected pages
    return <div className="flex h-screen items-center justify-center"><p>Loading parent dashboard...</p></div>;
  }

  if (!user || !isParent) {
    // If, after loading, there's no user or the user is not a parent,
    // useEffect should have redirected. This is a fallback or for edge cases on protected pages.
    // This message might briefly show if redirection is slow or if there's an auth state inconsistency.
    return <div className="flex h-screen items-center justify-center"><p>Access Denied. Redirecting...</p></div>;
  }
  
  // At this point, user is authenticated, profile is loaded, and role is 'parent'
  // Render the full layout for protected parent pages
  return (
    <div className="flex min-h-screen flex-col">
      <Header title={userProfile?.name ? `${userProfile.name}'s Dashboard` : "Parent Dashboard"} />
      <main className="flex-1 container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
