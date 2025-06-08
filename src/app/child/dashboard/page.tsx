
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Star, Trophy, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Task, Reward } from "@/types";
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

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

    // Fetch tasks assigned to this child
    // A task is for this child if their user.uid is in the task's assignedToUids array
    const tasksQuery = query(
      collection(db, "tasks"),
      where("parentId", "==", userProfile.parentId), // Tasks created by their parent
      where("assignedToUids", "array-contains", user.uid) // Task is assigned to this child
    );

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const fetchedTasks: Task[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(fetchedTasks);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      toast({ title: "Error", description: "Could not fetch tasks.", variant: "destructive" });
    });

    // Fetch rewards available from this child's parent
    const rewardsQuery = query(collection(db, "rewards"), where("parentId", "==", userProfile.parentId));
    const unsubscribeRewards = onSnapshot(rewardsQuery, (snapshot) => {
      const fetchedRewards: Reward[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward));
      setRewards(fetchedRewards);
    }, (error) => {
      console.error("Error fetching rewards:", error);
      toast({ title: "Error", description: "Could not fetch rewards.", variant: "destructive" });
    });

    // Listen for changes to the child's own points directly
    const userProfileRef = doc(db, "users", user.uid);
    const unsubscribeUserProfile = onSnapshot(userProfileRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedProfile = docSnap.data() as any; // Cast to any or a more specific type if needed
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
    if (!user) return;
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { status: "completed" });
      // Points are awarded by parent upon verification, not here.
      toast({ title: "Task Submitted!", description: "Your task has been marked as completed and is awaiting parent verification." });
    } catch (error) {
      console.error("Error marking task done:", error);
      toast({ title: "Error", description: "Could not submit task.", variant: "destructive" });
    }
  };

  const handleClaimReward = async (reward: Reward) => {
    if (!user || !userProfile || currentPoints < reward.pointsCost) {
      toast({ title: "Cannot Claim Reward", description: "Not enough points or user not found.", variant: "destructive"});
      return;
    }
    try {
      // This is a simplified claim process.
      // In a real app, you might create a "claimed_rewards" record or send a notification to the parent.
      // For now, we just deduct points.
      const userProfileRef = doc(db, "users", user.uid);
      await updateDoc(userProfileRef, {
        points: currentPoints - reward.pointsCost
      });
      // No need to update currentPoints state directly, onSnapshot will do it.
      toast({ title: "Reward Claimed!", description: `You've claimed "${reward.description}". Your parent will be notified.` });

      // Placeholder: Notify parent (e.g., create a notification document or update a field)
      // For example, one might add to a subcollection under the parent's user document:
      // await addDoc(collection(db, "users", userProfile.parentId!, "notifications"), {
      //   type: "reward_claimed",
      //   childName: userProfile.displayName,
      //   childId: user.uid,
      //   rewardDescription: reward.description,
      //   pointsCost: reward.pointsCost,
      //   timestamp: serverTimestamp(),
      //   read: false,
      // });

    } catch (error) {
      console.error("Error claiming reward:", error);
      toast({ title: "Error Claiming Reward", description: "Could not claim reward.", variant: "destructive" });
    }
  };

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const completedTasksAwaitingVerification = tasks.filter(task => task.status === 'completed');
  const verifiedTasks = tasks.filter(task => task.status === 'verified'); // Assuming parent verifies

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Hello, {userProfile?.displayName || "Kiddo"}!
          </h1>
          <p className="text-muted-foreground">Here are your tasks and available rewards.</p>
        </div>
        <Card className="p-4 bg-primary/10 shadow-md">
          <div className="flex items-center space-x-2">
            <Star className="h-6 w-6 text-primary" />
            <span className="text-2xl font-bold text-primary">{currentPoints}</span>
            <span className="text-sm text-muted-foreground">pts</span>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Assigned Tasks */}
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
                        <AlertTriangle className="h-4 w-4 mr-1.5 text-yellow-500" />
                        Completed Tasks (Awaiting Parent Verification):
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

        {/* Available Rewards */}
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
