
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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { HOBBY_OPTIONS, type UserProfile, type Hobby } from '@/types';
import { ArrowLeft } from 'lucide-react';

const childProfileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters.').max(50),
  gender: z.enum(['male', 'female'], { required_error: 'Gender is required.' }),
  age: z.coerce.number().min(1, 'Age must be at least 1.').max(18, 'Age must be 18 or younger.'),
  hobbies: z.array(z.string()).min(1, 'At least one hobby must be selected.'),
});

type ChildProfileFormValues = z.infer<typeof childProfileSchema>;

export default function ChildEditProfilePage() {
  const router = useRouter();
  const { user, userProfile, loading, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ChildProfileFormValues>({
    resolver: zodResolver(childProfileSchema),
    defaultValues: {
      displayName: '',
      gender: undefined,
      age: undefined,
      hobbies: [],
    },
  });

  useEffect(() => {
    if (userProfile) {
      reset({
        displayName: userProfile.displayName || '',
        gender: userProfile.gender as 'male' | 'female' || undefined,
        age: userProfile.age || undefined,
        hobbies: userProfile.hobbies || [],
      });
    }
  }, [userProfile, reset]);

  const onSubmit: SubmitHandler<ChildProfileFormValues> = async (data) => {
    if (!user) {
      toast({ title: 'Error', description: 'Not authenticated.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updateData: Partial<UserProfile> = {
        displayName: data.displayName,
        gender: data.gender,
        age: data.age,
        hobbies: data.hobbies as Hobby[],
      };
      await updateDoc(userDocRef, updateData);
      await refreshUserProfile(); // Refresh context
      toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.' });
      router.push('/child/dashboard');
    } catch (error) {
      console.error('Error updating child profile:', error);
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
              <Label htmlFor="displayName">Display Name</Label>
              <Controller
                name="displayName"
                control={control}
                render={({ field }) => <Input id="displayName" {...field} />}
              />
              {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
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
                  render={({ field }) => <Input id="age" type="number" {...field} />}
                />
                {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Hobbies (select at least one)</Label>
              <Controller
                name="hobbies"
                control={control}
                render={({ field }) => (
                  <ScrollArea className="h-40 rounded-md border p-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {HOBBY_OPTIONS.map((hobby) => (
                        <div key={hobby} className="flex items-center space-x-2">
                          <Checkbox
                            id={`hobby-${hobby}`}
                            checked={field.value?.includes(hobby)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), hobby])
                                : field.onChange(
                                    (field.value || []).filter(
                                      (value) => value !== hobby
                                    )
                                  );
                            }}
                          />
                          <Label htmlFor={`hobby-${hobby}`} className="font-normal text-sm">{hobby}</Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              />
              {errors.hobbies && <p className="text-sm text-destructive">{errors.hobbies.message}</p>}
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
