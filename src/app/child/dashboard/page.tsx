
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Star, Trophy, Clock, RotateCcw, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Task, Reward, ClaimedReward } from "@/types";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, writeBatch, increment, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import CompleteTaskModal from "@/components/modals/CompleteTaskModal";
import { format } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ChildDashboardPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claimedRewardHistory, setClaimedRewardHistory] = useState<ClaimedReward[]>([]);
  const [currentPoints, setCurrentPoints] = useState(userProfile?.points ?? 0);

  const [isCompleteTaskModalOpen, setIsCompleteTaskModalOpen] = useState(false);
  const [selectedTaskForCompletion, setSelectedTaskForCompletion] = useState<Task | null>(null);

  useEffect(() => {
    if (userProfile?.points !== undefined) {
      setCurrentPoints(userProfile.points);
    }
  }, [userProfile?.points]);

  useEffect(() => {
    if (!user || !userProfile || !userProfile.parentId) return;

    // Fetch Tasks
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

    // Fetch Rewards
    const rewardsQuery = query(collection(db, "rewards"), where("parentId", "==", userProfile.parentId));
    const unsubscribeRewards = onSnapshot(rewardsQuery, (snapshot) => {
      const fetchedRewards: Reward[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward));
      setRewards(fetchedRewards);
    }, (error) => {
      console.error("Error fetching rewards:", error);
      toast({ title: "Error", description: "Could not fetch rewards.", variant: "destructive" });
    });

    // Fetch User Profile for points updates
    const userProfileRef = doc(db, "users", user.uid);
    const unsubscribeUserProfile = onSnapshot(userProfileRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedProfile = docSnap.data() as any;
        setCurrentPoints(updatedProfile.points ?? 0);
      }
    });

    // Fetch Claimed Reward History
    const claimedRewardsQuery = query(
        collection(db, "users", user.uid, "claimedRewards"), 
        orderBy("claimedAt", "desc")
    );
    const unsubscribeClaimedRewards = onSnapshot(claimedRewardsQuery, (snapshot) => {
        const fetchedHistory: ClaimedReward[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClaimedReward));
        setClaimedRewardHistory(fetchedHistory);
    }, (error) => {
        console.error("Error fetching claimed reward history:", error);
        toast({ title: "Error", description: "Could not fetch reward history.", variant: "destructive" });
    });

    return () => {
      unsubscribeTasks();
      unsubscribeRewards();
      unsubscribeUserProfile();
      unsubscribeClaimedRewards();
    };
  }, [user, userProfile, toast]);

  const handleOpenCompleteTaskModal = (task: Task) => {
    setSelectedTaskForCompletion(task);
    setIsCompleteTaskModalOpen(true);
  };

  const handleCompleteTaskSubmit = async (completionNotes: string) => {
    if (!user || !userProfile || !selectedTaskForCompletion) {
      toast({ title: "Error", description: "Cannot submit task. Please try again.", variant: "destructive"});
      return;
    }
    
    const taskRef = doc(db, "tasks", selectedTaskForCompletion.id);
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

      await updateDoc(taskRef, { 
        status: "completed",
        completionNotes: completionNotes 
      });

      toast({ title: "Task Submitted!", description: `"${taskData.description}" has been submitted for parent verification.` });
      setSelectedTaskForCompletion(null);
    } catch (error) {
      console.error("Error submitting task for verification:", error);
      toast({ title: "Error", description: "Could not submit task.", variant: "destructive" });
    }
  };
  
  const handleClaimReward = async (reward: Reward) => {
    if (!user || !userProfile) {
      toast({ title: "Authentication Error", description: "Please log in again." });
      return;
    }
    if (currentPoints < reward.pointsCost) {
      toast({ title: "Cannot Claim Reward", description: "Not enough points." });
      return;
    }

    const batch = writeBatch(db);
    try {
      // 1. Deduct points from child's main profile
      const userProfileRef = doc(db, "users", user.uid);
      batch.update(userProfileRef, {
        points: increment(-reward.pointsCost)
      });

      // 2. Deduct points from parent's subcollection record for the child
      if (userProfile.parentId) {
        const childSubDocRef = doc(db, "users", userProfile.parentId, "children", user.uid);
        batch.update(childSubDocRef, {
          points: increment(-reward.pointsCost)
        });
      }

      // 3. Add a record to the child's claimedRewards subcollection
      const claimedRewardRef = doc(collection(db, "users", user.uid, "claimedRewards")); // Auto-generates ID
      const claimedRewardData: Omit<ClaimedReward, 'id'> = {
        originalRewardId: reward.id,
        rewardDescription: reward.description,
        pointsCost: reward.pointsCost,
        claimedAt: serverTimestamp(),
        parentId: reward.parentId,
        childUid: user.uid,
      };
      batch.set(claimedRewardRef, claimedRewardData);
      
      await batch.commit();
      toast({ title: "Reward Claimed!", description: `You've claimed "${reward.description}".` });
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
          <Card className="p-4 bg-primary/10 shadow-md">
            <div className="flex items-center space-x-2">
              <Star className="h-6 w-6 text-primary" />
              <span className="text-2xl font-bold text-primary">{currentPoints}</span>
              <span className="text-sm text-muted-foreground">pts</span>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-medium">
              <CheckCircle2 className="inline-block mr-2 h-5 w-5 text-primary" /> Your Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[400px] pr-3"> {/* Added ScrollArea for tasks list */}
              {pendingTasks.length > 0 ? (
                <ul className="space-y-3">
                  {pendingTasks.map(task => (
                    <li key={task.id} className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{task.description}</p>
                          <p className="text-sm text-primary">{task.points} pts</p>
                          {task.verificationFeedback && task.status === 'pending' && (
                            <div className="mt-1.5 p-2 rounded-md bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800">
                              <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 flex items-center">
                                <RotateCcw className="h-3 w-3 mr-1.5"/> Parent's Feedback (Please Revise):
                              </p>
                              <p className="text-xs italic text-orange-600 dark:text-orange-400 mt-0.5">"{task.verificationFeedback}"</p>
                            </div>
                          )}
                        </div>
                        <Button size="sm" onClick={() => handleOpenCompleteTaskModal(task)} className="ml-2 self-start">
                          Mark as Done
                        </Button>
                      </div>
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
                              <div className="flex-1">
                                  <p className="font-medium line-through">{task.description}</p>
                                  {task.completionNotes && <p className="text-xs italic text-yellow-700 dark:text-yellow-300 mt-0.5">Your notes: "{task.completionNotes}"</p>}
                              </div>
                              <span className="text-xs text-yellow-600 dark:text-yellow-400 ml-2">Awaiting Verification</span>
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
                              <div className="flex-1">
                                  <p className="font-medium line-through">{task.description}</p>
                                  {task.verificationFeedback && <p className="text-xs italic text-green-700 dark:text-green-300 mt-0.5">Parent: "{task.verificationFeedback}"</p>}
                              </div>
                              <span className="text-xs text-green-600 dark:text-green-400 ml-2">Points Awarded!</span>
                            </li>
                          ))}
                        </ul>
                    </div>
              )}
            </ScrollArea>
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

      {/* Claimed Rewards History Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-medium">
            <Gift className="inline-block mr-2 h-5 w-5 text-primary" /> Your Claimed Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          {claimedRewardHistory.length > 0 ? (
            <ScrollArea className="max-h-[300px] pr-2">
              <ul className="space-y-3">
                {claimedRewardHistory.map(claimed => (
                  <li key={claimed.id} className="p-3 rounded-lg bg-accent/50 border border-accent">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-foreground/90">{claimed.rewardDescription}</p>
                        <p className="text-xs text-muted-foreground">
                          Cost: <span className="font-semibold text-primary">{claimed.pointsCost} pts</span>
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 sm:mt-0 sm:ml-4">
                        Claimed: {claimed.claimedAt?.seconds ? format(new Date(claimed.claimedAt.seconds * 1000), "MMM d, yyyy 'at' h:mm a") : "Processing..."}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">You haven't claimed any rewards yet. Complete tasks to earn points!</p>
          )}
        </CardContent>
      </Card>

      {selectedTaskForCompletion && (
        <CompleteTaskModal
          isOpen={isCompleteTaskModalOpen}
          onClose={() => {
            setIsCompleteTaskModalOpen(false);
            setSelectedTaskForCompletion(null);
          }}
          onSubmit={handleCompleteTaskSubmit}
          taskDescription={selectedTaskForCompletion.description}
        />
      )}
    </div>
  );
}
