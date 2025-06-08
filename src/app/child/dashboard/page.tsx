
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Star, Trophy, Clock, Edit3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Task, Reward } from "@/types";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ChildDashboardPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [currentPoints, setCurrentPoints] = useState(userProfile?.points ?? 0);

  useEffect(() => {
    if (userProfile?.points !== undefined) {
      setCurrentPoints(userProfile.points);
    }
  }, [userProfile?.points]);

  useEffect(() => {
    if (!user || !userProfile || !userProfile.parentId) return;

    const tasksQuery = query(
      collection(db, "tasks"),
      where("parentId", "==", userProfile.parentId),
      where("assignedToUids", "array-contains", user.uid)
    );

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const fetchedTasks: Task[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(fetchedTasks);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      toast({ title: "Error", description: "Could not fetch tasks.", variant: "destructive" });
    });

    const rewardsQuery = query(collection(db, "rewards"), where("parentId", "==", userProfile.parentId));
    const unsubscribeRewards = onSnapshot(rewardsQuery, (snapshot) => {
      const fetchedRewards: Reward[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward));
      setRewards(fetchedRewards);
    }, (error) => {
      console.error("Error fetching rewards:", error);
      toast({ title: "Error", description: "Could not fetch rewards.", variant: "destructive" });
    });

    const userProfileRef = doc(db, "users", user.uid);
    const unsubscribeUserProfile = onSnapshot(userProfileRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedProfile = docSnap.data() as any; 
        setCurrentPoints(updatedProfile.points ?? 0);
      }
    });

    return () => {
      unsubscribeTasks();
      unsubscribeRewards();
      unsubscribeUserProfile();
    };
  }, [user, userProfile, toast]);

  const handleMarkTaskDone = async (taskId: string) => {
    if (!user || !userProfile) { 
      toast({ title: "Authentication Error", description: "Please log in again.", variant: "destructive"});
      return;
    }
    
    const taskRef = doc(db, "tasks", taskId);
    try {
      const taskSnap = await getDoc(taskRef);
      if (!taskSnap.exists()) {
        toast({ title: "Error", description: "Task not found.", variant: "destructive" });
        return;
      }
      const taskData = taskSnap.data() as Task;

      if (taskData.status !== 'pending') {
        toast({ title: "Info", description: "This task is no longer pending.", variant: "default" });
        return;
      }

      await updateDoc(taskRef, { status: "completed" }); 

      toast({ title: "Task Submitted!", description: `"${taskData.description}" has been submitted for parent verification.` });
    } catch (error) {
      console.error("Error submitting task for verification:", error);
      toast({ title: "Error", description: "Could not submit task.", variant: "destructive" });
    }
  };

  const handleClaimReward = async (reward: Reward) => {
    if (!user || !userProfile || currentPoints < reward.pointsCost) {
      toast({ title: "Cannot Claim Reward", description: "Not enough points or user not found.", variant: "destructive"});
      return;
    }
    const newPoints = currentPoints - reward.pointsCost;
    try {
      const userProfileRef = doc(db, "users", user.uid);
      await updateDoc(userProfileRef, {
        points: newPoints
      });
      
      // Also update points in parent's subcollection for the child
      if (userProfile.parentId) {
        const parentChildrenRef = collection(db, "users", userProfile.parentId, "children");
        const q = query(parentChildrenRef, where("authUid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const childSubDoc = querySnapshot.docs[0];
          const childSubDocRef = doc(db, "users", userProfile.parentId, "children", childSubDoc.id);
          await updateDoc(childSubDocRef, {
            points: newPoints 
          });
          console.log("Successfully updated points in parent's subcollection for child:", user.uid);
        } else {
          console.warn("Could not find child record in parent's subcollection to update points. Child UID:", user.uid, "Parent UID:", userProfile.parentId);
        }
      }

      toast({ title: "Reward Claimed!", description: `You've claimed "${reward.description}". Your parent will be notified.` });
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast({ title: "Error Claiming Reward", description: "Could not claim reward.", variant: "destructive" });
    }
  };

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const completedTasksAwaitingVerification = tasks.filter(task => task.status === 'completed'); 
  const verifiedTasks = tasks.filter(task => task.status === 'verified');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Hello, {userProfile?.displayName || "Kiddo"}!
          </h1>
          <p className="text-muted-foreground">Here are your tasks and available rewards.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/child/profile/edit">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
            </Link>
          </Button>
          <Card className="p-4 bg-primary/10 shadow-md">
            <div className="flex items-center space-x-2">
              <Star className="h-6 w-6 text-primary" />
              <span className="text-2xl font-bold text-primary">{currentPoints}</span>
              <span className="text-sm text-muted-foreground">pts</span>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-medium">
              <CheckCircle2 className="inline-block mr-2 h-5 w-5 text-primary" /> Your Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTasks.length > 0 ? (
              <ul className="space-y-3">
                {pendingTasks.map(task => (
                  <li key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div>
                      <p className="font-medium">{task.description}</p>
                      <p className="text-sm text-primary">{task.points} pts</p>
                    </div>
                    <Button size="sm" onClick={() => handleMarkTaskDone(task.id)}>
                      Mark as Done
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No pending tasks. Great job!</p>
            )}
            
            {completedTasksAwaitingVerification.length > 0 && (
                 <div className="mt-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center">
                        <Clock className="h-4 w-4 mr-1.5 text-yellow-500" />
                        Tasks Submitted (Awaiting Parent Verification):
                    </h3>
                     <ul className="space-y-2 opacity-70">
                        {completedTasksAwaitingVerification.map(task => (
                          <li key={task.id} className="flex items-center justify-between p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30">
                            <span className="font-medium line-through">{task.description}</span>
                            <span className="text-xs text-yellow-600 dark:text-yellow-400">Awaiting Verification</span>
                          </li>
                        ))}
                    </ul>
                 </div>
            )}

            {verifiedTasks.length > 0 && (
                 <div className="mt-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Verified & Awarded Tasks:</h3>
                     <ul className="space-y-2 opacity-50">
                        {verifiedTasks.map(task => (
                          <li key={task.id} className="flex items-center justify-between p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                            <span className="font-medium line-through">{task.description}</span>
                            <span className="text-xs text-green-600 dark:text-green-400">Points Awarded!</span>
                          </li>
                        ))}
                    </ul>
                 </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-medium">
              <Trophy className="inline-block mr-2 h-5 w-5 text-primary" /> Available Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rewards.length > 0 ? (
              <ul className="space-y-3">
                {rewards.map(reward => (
                  <li key={reward.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div>
                      <p className="font-medium">{reward.description}</p>
                      <p className="text-sm text-primary">{reward.pointsCost} pts</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleClaimReward(reward)}
                      disabled={currentPoints < reward.pointsCost}
                    >
                      Claim Reward
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No rewards available currently. Keep up the good work!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
