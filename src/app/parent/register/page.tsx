
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

// Password validation regex: 
// At least 8 characters, one uppercase, one lowercase, one number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

export default function ParentRegisterPage() {
  const router = useRouter();
  const { signUpParent, loading, user, isParent } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'unspecified' | undefined>(undefined);
  const [age, setAge] = useState<number | ''>('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user && isParent) {
      router.replace('/parent/dashboard');
    }
  }, [user, isParent, loading, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!email || !name || gender === undefined || age === '' || !phone || !password || !confirmPassword) {
        setError('Please fill in all required fields.');
        toast({ title: "Registration Failed", description: "Please fill in all required fields.", variant: "destructive" });
        return;
    }
    if (Number(age) < 18) {
        setError('Age must be 18 or older.');
        toast({ title: "Registration Failed", description: "Age must be 18 or older.", variant: "destructive" });
        return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      toast({ title: "Registration Failed", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setError('Password must be at least 8 characters, including uppercase, lowercase, and a number.');
      toast({ 
        title: "Weak Password", 
        description: "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, and one number.", 
        variant: "destructive",
        duration: 7000 
      });
      return;
    }

    const parentDetails = {
      name,
      gender,
      age: Number(age),
      email,
      phone,
      password,
    };

    const newParentUser = await signUpParent(parentDetails);

    if (newParentUser) {
      toast({ title: "Registration Successful!", description: "Welcome! Please log in to continue."});
      router.push('/parent/login'); 
    } else {
      setError('Registration failed. The email might already be in use or there was a server error.');
      toast({ title: "Registration Failed", description: "Please try again. Email might be in use.", variant: "destructive" });
    }
  };
  
  if (!loading && user && isParent) {
     return <div className="flex h-screen items-center justify-center"><p>Redirecting to dashboard...</p></div>;
  }
  if (loading && !user) {
     return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
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
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-background/70"/>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))} required min="18" className="bg-background/70"/>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={(value) => setGender(value as 'male' | 'female' | 'unspecified')} >
                <SelectTrigger id="gender" className="bg-background/70">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="unspecified">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background/70"/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="bg-background/70"/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-background/70"/>
                <p className="text-xs text-muted-foreground mt-1">
                  Min. 8 chars, with uppercase, lowercase, and a number.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="bg-background/70"/>
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
