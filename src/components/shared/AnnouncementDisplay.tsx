
"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Announcement } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Info } from 'lucide-react'; // Using Info for general announcements

const ANNOUNCEMENT_DOC_PATH = "announcements/current";

export default function AnnouncementDisplay() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const announcementDocRef = doc(db, ANNOUNCEMENT_DOC_PATH);
    const unsubscribe = onSnapshot(
      announcementDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Announcement;
          if (data.isActive) {
            setAnnouncement(data);
          } else {
            setAnnouncement(null); // Explicitly set to null if not active
          }
        } else {
          setAnnouncement(null); // No announcement document
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching announcement:", err);
        setError("Could not load announcement at this time.");
        setAnnouncement(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="my-6 p-4 text-center text-sm text-muted-foreground">
        Checking for announcements...
      </div>
    );
  }

  if (error) {
    return (
      <Card className="my-6 border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive text-base flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            Announcement Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive/90">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!announcement || !announcement.isActive) {
    return null; // No active announcement to display
  }

  return (
    <Card className="my-6 border-primary/30 bg-primary/5 shadow-md">
      <CardHeader>
        <CardTitle className="text-primary text-lg flex items-center">
          <Info className="mr-2 h-5 w-5" />
          {announcement.title || "Important Notice"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{announcement.content}</p>
        {announcement.updatedAt?.seconds && (
            <p className="text-xs text-muted-foreground mt-3 text-right">
                Last updated: {new Date(announcement.updatedAt.seconds * 1000).toLocaleDateString()}
            </p>
        )}
      </CardContent>
    </Card>
  );
}
