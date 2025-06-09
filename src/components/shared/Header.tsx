
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, UserCircle } from 'lucide-react';

interface HeaderProps {
  title?: string;
}

export default function Header({ title = "Growth Ally" }: HeaderProps) {
  const { user, userProfile, signOutUser, loading, isParent, isChild } = useAuth();

  // Determine the display name: parent's name, or child's displayName, or fallback
  const displayName = userProfile?.role === 'parent' ? userProfile.name : userProfile?.displayName;
  
  let profileEditLink = "/";
  if (userProfile) {
    if (isParent) {
      profileEditLink = "/parent/profile/edit";
    } else if (isChild) {
      profileEditLink = "/child/profile/edit";
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <Link href="/" className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M7 20h10"/><path d="M10 20c0-2.21-1.79-4-4-4V4c0-1.11.89-2 2-2h4c1.11 0 2 .89 2 2v12c0 2.21-1.79 4-4 4"/><path d="M12 12c-2-2.67-4-4-4-4"/><path d="m16 12 2-2"/></svg>
          <span className="font-headline text-xl font-bold text-primary">{title}</span>
        </Link>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            {user && (
              <>
                {displayName && (
                  <Link href={profileEditLink} className="hidden items-center text-sm font-medium text-foreground hover:text-primary sm:flex mr-2 p-2 rounded-md hover:bg-accent transition-colors">
                    <UserCircle className="mr-2 h-5 w-5 text-muted-foreground" />
                    {displayName}
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={signOutUser} disabled={loading}>
                  <LogOut className="mr-1 h-4 w-4" />
                  Sign Out
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
