
"use client";

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { LogIn, ArrowLeft, KeyRound } from 'lucide-react'; // Removed UserPlus, not used on this page
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
  const [emailPrefix, setEmailPrefix] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const [resetEmailPrefix, setResetEmailPrefix] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const FIXED_DOMAIN = "@growthally.com";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!emailPrefix.trim()) {
      setError('Please enter your email prefix.');
      toast({ title: "Login Failed", description: "Email prefix cannot be empty.", variant: "destructive" });
      return;
    }
    const fullEmail = emailPrefix.trim() + FIXED_DOMAIN;
    const childUser = await signInChildWithEmail(fullEmail, password);
    if (childUser) {
      toast({ title: "Login Successful!", description: "Welcome back!"});
      router.push('/child/dashboard');
    } else {
      setError('Invalid email prefix or password. Please try again.');
      toast({ title: "Login Failed", description: "Invalid email prefix or password. If this is your first time, please ask your parent to add you.", variant: "destructive" });
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmailPrefix.trim()) {
      toast({ title: "Email Prefix Required", description: "Please enter your email prefix to reset password.", variant: "destructive" });
      return;
    }
    const fullResetEmail = resetEmailPrefix.trim() + FIXED_DOMAIN;
    const success = await sendPasswordReset(fullResetEmail);
    if (success) {
      toast({ title: "Password Reset Email Sent", description: `If an account exists for ${fullResetEmail}, you will receive an email with instructions.` });
      setIsResetDialogOpen(false);
      setResetEmailPrefix('');
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
              <Label htmlFor="email-prefix-child-login">Email Prefix</Label>
              <div className="flex items-center">
                <Input
                  id="email-prefix-child-login"
                  type="text"
                  placeholder="your.username"
                  value={emailPrefix}
                  onChange={(e) => setEmailPrefix(e.target.value)}
                  required
                  className="bg-background/70 rounded-r-none"
                />
                <span className="inline-flex items-center px-3 text-sm text-muted-foreground border border-l-0 border-input rounded-r-md bg-secondary h-10">
                  {FIXED_DOMAIN}
                </span>
              </div>
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
                    Enter your email prefix below. We'll send a reset link to {`{prefix}`}{FIXED_DOMAIN}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                  <Label htmlFor="reset-email-prefix-child">Email Prefix</Label>
                   <div className="flex items-center">
                    <Input
                        id="reset-email-prefix-child"
                        type="text"
                        placeholder="your.username"
                        value={resetEmailPrefix}
                        onChange={(e) => setResetEmailPrefix(e.target.value)}
                        className="rounded-r-none"
                    />
                    <span className="inline-flex items-center px-3 text-sm text-muted-foreground border border-l-0 border-input rounded-r-md bg-secondary h-10">
                        {FIXED_DOMAIN}
                    </span>
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setResetEmailPrefix('')}>Cancel</AlertDialogCancel>
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
