
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ParentLoginPage() {
  const router = useRouter();
  const { signInParentWithEmail, loading, user, isParent } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (user && isParent) {
      router.replace('/parent/dashboard');
    }
  }, [user, isParent, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const parentUser = await signInParentWithEmail(email, password);
    if (parentUser) {
      toast({ title: "Login Successful!", description: "Welcome back, Parent!"});
      router.push('/parent/dashboard');
    } else {
      setError('Invalid email or password. Please try again or register if you are new.');
      toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
    }
  };

  if (user && isParent) {
    return <div className="flex h-screen items-center justify-center"><p>Redirecting to dashboard...</p></div>;
  }


  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-br from-background to-accent/30">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary text-center">Parent Login</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Access your parent dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/70"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn className="mr-2 h-5 w-5" />
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <Button variant="link" asChild className="text-sm text-primary">
            <Link href="/parent/register">
              <UserPlus className="mr-2 h-4 w-4" />
              Create a new Parent Account
            </Link>
          </Button>
          <Button variant="link" asChild className="text-sm text-muted-foreground">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Role Selection
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
