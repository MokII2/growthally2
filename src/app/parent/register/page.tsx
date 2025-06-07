
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, LogIn, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types';

export default function ParentRegisterPage() {
  const router = useRouter();
  const { signUpParent, loading, user, isParent } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [age, setAge] = useState<number | ''>('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && isParent) {
      router.replace('/parent/dashboard');
    }
  }, [user, isParent, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      toast({ title: "Registration Failed", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (!email || !name || !gender || age === '' || !phone) {
        setError('Please fill in all required fields.');
        toast({ title: "Registration Failed", description: "Please fill in all required fields.", variant: "destructive" });
        return;
    }

    const parentDetails: Omit<UserProfile, 'uid' | 'role' | 'points' | 'parentId'> & {password: string} = {
      name,
      gender,
      age: Number(age),
      email,
      phone,
      password,
    };

    const newParentUser = await signUpParent(parentDetails);

    if (newParentUser) {
      toast({ title: "Registration Successful!", description: "Welcome! You can now log in."});
      router.push('/parent/login'); // Redirect to login after successful registration
    } else {
      setError('Registration failed. The email might already be in use or there was a server error.');
      toast({ title: "Registration Failed", description: "Please try again. Email might be in use.", variant: "destructive" });
    }
  };
  
  if (user && isParent) {
    return <div className="flex h-screen items-center justify-center"><p>Redirecting to dashboard...</p></div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-br from-background to-accent/30">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary text-center">Parent Registration</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Create your parent account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))} required min="18" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={(value) => setGender(value as 'male' | 'female' | 'other' | '')} required>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            </div>
            
            {error && <p className="text-sm text-destructive text-center pt-2">{error}</p>}
            
            <Button type="submit" className="w-full mt-6" disabled={loading}>
              <UserPlus className="mr-2 h-5 w-5" />
              {loading ? 'Registering...' : 'Register Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <Button variant="link" asChild className="text-sm text-primary">
            <Link href="/parent/login">
              <LogIn className="mr-2 h-4 w-4" />
              Already have an account? Login
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
