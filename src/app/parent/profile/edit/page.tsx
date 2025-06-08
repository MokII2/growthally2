
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { ArrowLeft } from 'lucide-react';

const parentProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(50),
  gender: z.enum(['male', 'female', ''], { required_error: 'Gender is required.' }),
  age: z.coerce.number().min(18, 'Age must be 18 or older.'),
  phone: z.string().min(5, 'Phone number seems too short.').max(20, 'Phone number seems too long.'),
});

type ParentProfileFormValues = z.infer<typeof parentProfileSchema>;

export default function ParentEditProfilePage() {
  const router = useRouter();
  const { user, userProfile, loading, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ParentProfileFormValues>({
    resolver: zodResolver(parentProfileSchema),
    defaultValues: {
      name: '',
      gender: '',
      age: '' as any, // Initialize with empty string
      phone: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      reset({
        name: userProfile.name || '',
        gender: userProfile.gender || '',
        age: userProfile.age !== undefined && userProfile.age !== null ? userProfile.age : ('' as any), // Use empty string if age is null/undefined
        phone: userProfile.phone || '',
      });
    }
  }, [userProfile, reset]);

  const onSubmit: SubmitHandler<ParentProfileFormValues> = async (data) => {
    if (!user) {
      toast({ title: 'Error', description: 'Not authenticated.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updateData: Partial<UserProfile> = {
        name: data.name,
        gender: data.gender,
        age: data.age,
        phone: data.phone,
      };
      await updateDoc(userDocRef, updateData);
      await refreshUserProfile(); // Refresh context
      toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.' });
      router.push('/parent/dashboard');
    } catch (error) {
      console.error('Error updating parent profile:', error);
      toast({ title: 'Update Failed', description: 'Could not update your profile.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><p>Loading profile...</p></div>;
  }

  if (!userProfile) {
     return <div className="flex h-screen items-center justify-center"><p>Profile not found. Please try again later.</p></div>;
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Edit Your Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input id="name" {...field} />}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Controller
                  name="age"
                  control={control}
                  render={({ field }) => <Input id="age" type="number" {...field} 
                    // Ensure value is not undefined for the input
                    value={field.value === undefined || field.value === null ? '' : field.value} 
                  />}
                />
                {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => <Input id="phone" type="tel" {...field} />}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
