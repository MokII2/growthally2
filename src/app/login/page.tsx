
"use client";

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { LogIn, ArrowLeft, KeyRound, UserPlus } from 'lucide-react'; // Added UserPlus
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


export default function ChildLoginPage() {
  const router = useRouter();
  const { signInChildWithEmail, loading, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const [resetEmail, setResetEmail] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const childUser = await signInChildWithEmail(email, password);
    if (childUser) {
      toast({ title: "Login Successful!", description: "Welcome back!"});
      router.push('/child/dashboard');
    } else {
      setError('Invalid email or password. Please try again.');
      toast({ title: "Login Failed", description: "Invalid email or password. If this is your first time, please ask your parent to add you.", variant: "destructive" });
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({ title: "Email Required", description: "Please enter your email address to reset password.", variant: "destructive" });
      return;
    }
    const success = await sendPasswordReset(resetEmail);
    if (success) {
      toast({ title: "Password Reset Email Sent", description: `If an account exists for ${resetEmail}, you will receive an email with instructions.` });
      setIsResetDialogOpen(false);
      setResetEmail('');
    } else {
      toast({ title: "Error Sending Reset Email", description: "Could not send password reset email. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-br from-background to-accent/30">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary text-center">Child Login</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Enter your details to access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email-child-login">Email</Label>
              <Input
                id="email-child-login"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-child-login">Password</Label>
              <Input
                id="password-child-login"
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
           <div className="mt-4 text-center">
            <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="link" className="text-xs text-muted-foreground">
                  <KeyRound className="mr-1 h-3 w-3" /> Forgot Password?
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Your Password</AlertDialogTitle>
                  <AlertDialogDescription>
                    Enter your email address below and we'll send you a link to reset your password.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                  <Label htmlFor="reset-email-child">Email Address</Label>
                  <Input
                    id="reset-email-child"
                    type="email"
                    placeholder="your.email@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setResetEmail('')}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePasswordReset} disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <p className="text-xs text-muted-foreground">
            First time logging in? Ask your parent for your initial password.
          </p>
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
