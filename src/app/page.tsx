
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Smile } from 'lucide-react';
import { useEffect } from 'react';
import AnnouncementDisplay from '@/components/shared/AnnouncementDisplay'; // Added import

export default function RoleSelectionPage() {
  const router = useRouter();
  const { user, loading, isParent, isChild, isAdministrator } = useAuth(); // Added isAdministrator

  useEffect(() => {
    if (!loading && user) {
      if (isAdministrator) {
        // Optional: Redirect admin to a specific admin dashboard or keep them here
        // For now, admin will see role selection if they don't pick a role flow
         // router.replace('/admin/dashboard'); // Example if you had an admin dashboard
      } else if (isParent) {
        router.replace('/parent/dashboard');
      } else if (isChild) {
        router.replace('/child/dashboard');
      }
    }
  }, [user, loading, isParent, isChild, isAdministrator, router]);


  const handleParentPortalRedirect = () => {
    router.push('/parent/login');
  };

  const handleChildLoginRedirect = () => {
    router.push('/login');
  };

  // Simplified loading view, AuthProvider handles detailed loading states
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-background to-accent/30">
      <div className="w-full max-w-md"> {/* Wrapper for Card and Announcement */}
        <AnnouncementDisplay /> {/* Display announcement here */}
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 20h10"/><path d="M10 20c0-2.21-1.79-4-4-4V4c0-1.11.89-2 2-2h4c1.11 0 2 .89 2 2v12c0 2.21-1.79 4-4 4"/><path d="M12 12c-2-2.67-4-4-4-4"/><path d="m16 12 2-2"/></svg>
            </div>
            <CardTitle className="text-3xl font-headline text-primary">Growth Ally</CardTitle>
            <CardDescription className="text-muted-foreground">
              Cultivating responsibility and fun, together.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-foreground/80">Please select your role to continue:</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Button
                variant="default"
                size="lg"
                className="w-full py-6 text-lg shadow-md hover:shadow-lg transition-shadow"
                onClick={handleParentPortalRedirect}
              >
                <Users className="mr-2 h-6 w-6" />
                I'm a Parent
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full py-6 text-lg shadow-md hover:shadow-lg transition-shadow"
                onClick={handleChildLoginRedirect}
              >
                <Smile className="mr-2 h-6 w-6" />
                I'm a Child
              </Button>
            </div>
            {isAdministrator && ( // Link for admin to manage announcement
                <div className="text-center mt-4">
                    <Button variant="link" onClick={() => router.push('/admin/announcement')} className="text-sm">
                        Manage Announcement (Admin)
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Growth Ally. All rights reserved.
      </footer>
    </div>
  );
}
