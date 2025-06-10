
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Announcement } from '@/types';
import { Info } from 'lucide-react';

const announcementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.').max(100, 'Title is too long.'),
  content: z.string().min(10, 'Content must be at least 10 characters.').max(1000, 'Content is too long.'),
  isActive: z.boolean(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

const ANNOUNCEMENT_DOC_PATH = "announcements/current"; // Single document for the current announcement

export default function ManageAnnouncementPage() {
  const { user, userProfile, isAdministrator } = useAuth();
  const { toast } = useToast();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
      isActive: false,
    },
  });

  useEffect(() => {
    const fetchAnnouncement = async () => {
      setIsLoadingData(true);
      try {
        const announcementDocRef = doc(db, ANNOUNCEMENT_DOC_PATH);
        const docSnap = await getDoc(announcementDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Announcement;
          reset(data); // Populate form with existing data
        }
      } catch (error) {
        console.error("Error fetching announcement:", error);
        toast({ title: "Error", description: "Could not load existing announcement.", variant: "destructive" });
      } finally {
        setIsLoadingData(false);
      }
    };

    if (isAdministrator) {
      fetchAnnouncement();
    }
  }, [isAdministrator, reset, toast]);

  const onSubmit: SubmitHandler<AnnouncementFormValues> = async (data) => {
    if (!user || !isAdministrator) {
      toast({ title: "Error", description: "Not authorized.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const announcementDocRef = doc(db, ANNOUNCEMENT_DOC_PATH);
      const announcementData: Announcement = {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };
      await setDoc(announcementDocRef, announcementData, { merge: true }); // Use setDoc with merge to create or update
      toast({ title: "Announcement Updated", description: "The site announcement has been saved." });
    } catch (error) {
      console.error("Error updating announcement:", error);
      toast({ title: "Update Failed", description: "Could not save the announcement.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return <div className="flex h-screen items-center justify-center"><p>Loading announcement data...</p></div>;
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <Info className="mr-2 h-6 w-6 text-primary" /> Manage Site Announcement
          </CardTitle>
          <CardDescription>
            Set a global announcement that will be displayed on the login/role selection pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Announcement Title</Label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => <Input id="title" {...field} placeholder="e.g., Welcome Back!" />}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Announcement Content</Label>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <Textarea
                    id="content"
                    rows={5}
                    {...field}
                    placeholder="Enter the full announcement message here..."
                  />
                )}
              />
              {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="isActive"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isActive" className="text-base">
                Show this announcement publicly?
              </Label>
            </div>
             {errors.isActive && <p className="text-sm text-destructive">{errors.isActive.message}</p>}


            <Button type="submit" className="w-full" disabled={isSubmitting || isLoadingData}>
              {isSubmitting ? 'Saving...' : 'Save Announcement'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
