
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, ListChecks, Award, KeyRound, Copy, Trash2, VenetianMask, Activity, Palette, Brain, CookingPot, BookOpen, PersonStanding, Music, Gamepad2, Code2, CheckSquare, BellRing } from "lucide-react"; // Removed Edit3
import AddChildModal from "@/components/modals/AddChildModal";
import AddTaskModal from "@/components/modals/AddTaskModal";
import AddRewardModal from "@/components/modals/AddRewardModal";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Child, Task, Reward } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
// import Link from "next/link"; // Removed Link as Edit3 button is removed


const hobbyIcons: Record<string, React.ElementType> = {
  "运动": Activity,
  "阅读": BookOpen,
  "音乐": Music,
  "舞蹈": PersonStanding,
  "计算": Brain,
  "手工": VenetianMask, 
  "烘培": CookingPot,
  "书法": BookOpen, 
  "绘画": Palette,
  "编程": Code2,
  "游戏": Gamepad2, 
};


export default function ParentDashboardPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const [children, setChildren] = useState<Child[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);

  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddRewardModalOpen, setIsAddRewardModalOpen] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'child' | 'task' | 'reward'; childAuthUid?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVerifyingTask, setIsVerifyingTask] = useState<string | null>(null);


  useEffect(() => {
    if (!user) return;
    const childrenQuery = query(collection(db, "users", user.uid, "children"), orderBy("name", "asc"));
    const unsubscribeChildren = onSnapshot(childrenQuery, (snapshot) => {
      const fetchedChildren: Child[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Child));
      setChildren(fetchedChildren);
    }, (error) => {
      console.error("Error fetching children:", error);
      toast({ title: "Error", description: "Could not fetch children.", variant: "destructive" });
    });

    const tasksQuery = query(collection(db, "tasks"), where("parentId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const fetchedTasks: Task[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(fetchedTasks);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      toast({ title: "Error", description: "Could not fetch tasks.", variant: "destructive" });
    });

    const rewardsQuery = query(collection(db, "rewards"), where("parentId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsubscribeRewards = onSnapshot(rewardsQuery, (snapshot) => {
      const fetchedRewards: Reward[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward));
      setRewards(fetchedRewards);
    }, (error) => {
      console.error("Error fetching rewards:", error);
      toast({ title: "Error", description: "Could not fetch rewards.", variant: "destructive" });
    });

    return () => {
      unsubscribeChildren();
      unsubscribeTasks();
      unsubscribeRewards();
    };
  }, [user, toast]);

  const handleDataRefreshNeeded = () => {
    console.log("Data refresh implicitly handled by onSnapshot listeners.");
  };

  const copyToClipboard = (text: string, itemName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: `${itemName} copied to clipboard.`});
    }).catch(err => {
      toast({ title: "Copy Failed", description: `Could not copy ${itemName}.`, variant: "destructive"});
      console.error('Failed to copy text: ', err);
    });
  };

  const handleDeleteConfirmation = (id: string, name: string, type: 'child' | 'task' | 'reward', childAuthUid?: string) => {
    setItemToDelete({ id, name, type, childAuthUid });
  };

  const executeDelete = async () => {
    if (!itemToDelete || !user) return;
    setIsDeleting(true);

    try {
      if (itemToDelete.type === 'child') {
        await deleteDoc(doc(db, "users", user.uid, "children", itemToDelete.id));
        toast({ title: "Child Record Deleted", description: `${itemToDelete.name}'s record has been removed.` });

        if (itemToDelete.childAuthUid) {
          const childProfileRef = doc(db, "users", itemToDelete.childAuthUid);
          const childProfileSnap = await getDoc(childProfileRef);
          if (childProfileSnap.exists()) {
             await deleteDoc(childProfileRef);
             toast({ title: "Child Profile Deleted", description: `Main profile for ${itemToDelete.name} also removed.` });
          }
           toast({
            title: "Manual Action May Be Required",
            description: `If ${itemToDelete.name} had direct login, their Firebase Auth account needs to be deleted manually from the Firebase console.`,
            variant: "default",
            duration: 10000,
          });
        }
      } else if (itemToDelete.type === 'task') {
        await deleteDoc(doc(db, "tasks", itemToDelete.id));
        toast({ title: "Task Deleted", description: `Task "${itemToDelete.name}" has been removed.` });
      } else if (itemToDelete.type === 'reward') {
        await deleteDoc(doc(db, "rewards", itemToDelete.id));
        toast({ title: "Reward Deleted", description: `Reward "${itemToDelete.name}" has been removed.` });
      }
      setItemToDelete(null); 
    } catch (error: any) {
      console.error(`Error deleting ${itemToDelete.type} (ID: ${itemToDelete.id}, ChildAuthUID: ${itemToDelete.childAuthUid || 'N/A'}):`, error);
      console.error("Details of item being deleted:", JSON.stringify(itemToDelete, null, 2));
      console.error("Current parent Firebase Auth user UID:", user.uid);
      console.error("Current parent user profile (from AuthContext):", JSON.stringify(userProfile, null, 2));
      
      toast({ 
        title: `Error Deleting ${itemToDelete.type}`, 
        description: error.message || "Could not complete deletion. Check console for details.", 
        variant: "destructive" 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVerifyTask = async (task: Task) => {
    if (!user || !task.assignedToUids || task.assignedToUids.length === 0) {
      toast({ title: "Error", description: "Task details incomplete or no children assigned.", variant: "destructive" });
      return;
    }
    setIsVerifyingTask(task.id);
    try {
      const batch = writeBatch(db);

      const taskRef = doc(db, "tasks", task.id);
      batch.update(taskRef, { status: "verified" });

      for (const childAuthUid of task.assignedToUids) {
        const childProfileRef = doc(db, "users", childAuthUid);
        const childProfileSnap = await getDoc(childProfileRef);
        if (childProfileSnap.exists()) {
          const currentPoints = childProfileSnap.data().points || 0;
          batch.update(childProfileRef, { points: currentPoints + task.points });
        } else {
          console.warn(`Child profile ${childAuthUid} not found for point update.`);
        }

        const childSubcollectionDoc = children.find(c => c.authUid === childAuthUid);
        if (childSubcollectionDoc && childSubcollectionDoc.id) {
          const childSubDocRef = doc(db, "users", user.uid, "children", childSubcollectionDoc.id);
          const childSubDocSnap = await getDoc(childSubDocRef);
          if (childSubDocSnap.exists()) {
              const currentSubPoints = childSubDocSnap.data().points || 0;
              batch.update(childSubDocRef, { points: currentSubPoints + task.points });
          } else {
              console.warn(`Child subcollection record for ${childAuthUid} (docId: ${childSubcollectionDoc.id}) not found for point update.`);
          }
        } else {
            console.warn(`Child subcollection record mapping not found for authUid ${childAuthUid}. This might happen if the child was recently added and the 'children' state hasn't updated yet, or if the child's subcollection document ID is missing.`);
        }
      }

      await batch.commit();
      toast({ title: "Task Verified!", description: `"${task.description}" has been verified and points awarded.` });
    } catch (error: any) {
      console.error("Error verifying task:", error);
      toast({ title: "Verification Failed", description: error.message || "Could not verify task.", variant: "destructive" });
    } finally {
      setIsVerifyingTask(null);
    }
  };

  const tasksAwaitingVerification = tasks.filter(task => task.status === 'completed');
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const verifiedTasks = tasks.filter(task => task.status === 'verified');


  return (
    <div className="space-y-8">
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {itemToDelete?.type} named "{itemToDelete?.name}".
              {itemToDelete?.type === 'child' && " Deleting a child will remove their app data. Their Firebase Authentication account (if direct login was enabled) will need to be manually deleted from the Firebase console."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? "Deleting..." : "Yes, delete it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Welcome, {userProfile?.name || "Parent"}!</h1>
          <p className="text-muted-foreground">Manage your family's tasks and rewards.</p>
        </div>
        {/* Edit Profile button removed, functionality moved to header */}
      </div>

      {/* Tasks Awaiting Verification */}
      {tasksAwaitingVerification.length > 0 && (
        <Card className="shadow-lg border-primary/50">
          <CardHeader>
            <CardTitle className="text-xl font-medium text-primary flex items-center">
              <BellRing className="inline-block mr-2 h-5 w-5" /> Tasks Awaiting Your Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {tasksAwaitingVerification.map(task => (
                <li key={task.id} className="p-3 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex-1">
                      <span className="font-medium">{task.description}</span>
                      {task.assignedToNames && task.assignedToNames.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                              Submitted by: {task.assignedToNames.join(', ')}
                          </p>
                      )}
                       <p className="text-xs text-primary">{task.points} pts</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleVerifyTask(task)}
                      disabled={isVerifyingTask === task.id}
                    >
                      {isVerifyingTask === task.id ? "Verifying..." : "Verify & Award Points"}
                      <CheckSquare className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">
              <Users className="inline-block mr-2 h-5 w-5 text-primary" /> Children
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setIsAddChildModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Child
            </Button>
          </CardHeader>
          <CardContent>
            {children.length > 0 ? (
              <ul className="space-y-3">
                {children.map(child => (
                  <li key={child.id || child.authUid} className="p-3 rounded-md bg-secondary/30 hover:bg-secondary/40 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-medium block">{child.name}</span>
                        <p className="text-xs text-muted-foreground">{child.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {child.gender}, Age: {child.age}
                        </p>
                        {child.hobbies && child.hobbies.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {child.hobbies.map(hobby => {
                              const IconComponent = hobbyIcons[hobby] || Palette; 
                              return (
                                <Badge variant="outline" key={hobby} className="text-xs py-0.5 px-1.5 bg-background/50">
                                  <IconComponent className="h-3 w-3 mr-1 opacity-70" />
                                  {hobby}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                       <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline">{child.points ?? 0} pts</Badge>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteConfirmation(child.id, child.name, 'child', child.authUid)}
                            title={`Delete ${child.name}`}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                       </div>
                    </div>
                    {child.initialPassword && (
                      <div className="mt-2 p-2 rounded-md bg-accent/50 border border-accent">
                        <div className="flex items-center justify-between">
                           <div>
                            <p className="text-xs font-semibold text-primary flex items-center">
                                <KeyRound className="h-3 w-3 mr-1.5" /> Initial Password:
                            </p>
                            <p className="text-sm font-mono tracking-wider text-foreground">{child.initialPassword}</p>
                           </div>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-7 w-7"
                             onClick={() => copyToClipboard(child.initialPassword!, `${child.name}'s initial password`)}
                             title="Copy password"
                           >
                             <Copy className="h-4 w-4" />
                           </Button>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">Share with {child.name} for first login. They should change it.</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No children added yet. Click "Add Child" to begin.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">
              <ListChecks className="inline-block mr-2 h-5 w-5 text-primary" /> Tasks Overview
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setIsAddTaskModalOpen(true)} disabled={children.length === 0}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Task
            </Button>
            {children.length === 0 && <p className="text-xs text-muted-foreground mt-1">Add a child first to assign tasks.</p>}
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks created yet.</p>
            ) : (
              <div className="space-y-4">
                {pendingTasks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Pending Tasks ({pendingTasks.length}):</h3>
                    <ul className="space-y-2">
                      {pendingTasks.map(task => (
                        <li key={task.id} className="p-3 rounded-md bg-secondary/30 hover:bg-secondary/40 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <span className="font-medium">{task.description}</span>
                              {task.assignedToNames && task.assignedToNames.length > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                      Assigned to: {task.assignedToNames.join(', ')}
                                  </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end ml-2">
                              <span className="text-sm text-primary whitespace-nowrap">{task.points} pts</span>
                              <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 mt-1 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteConfirmation(task.id, task.description, 'task')}
                                  title={`Delete task "${task.description}"`}
                                  >
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {verifiedTasks.length > 0 && (
                  <div>
                    <Separator className="my-3" />
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Verified & Awarded Tasks ({verifiedTasks.length}):</h3>
                    <ul className="space-y-2 opacity-70">
                      {verifiedTasks.map(task => (
                        <li key={task.id} className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <span className="font-medium line-through">{task.description}</span>
                              {task.assignedToNames && task.assignedToNames.length > 0 && (
                                  <p className="text-xs text-green-700 dark:text-green-300">
                                      Completed by: {task.assignedToNames.join(', ')}
                                  </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end ml-2">
                                <span className="text-xs text-green-600 dark:text-green-400">Points Awarded!</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 mt-1 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteConfirmation(task.id, task.description, 'task')}
                                  title={`Delete task "${task.description}"`}
                                  >
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {pendingTasks.length === 0 && verifiedTasks.length === 0 && tasksAwaitingVerification.length === 0 && (
                     <p className="text-sm text-muted-foreground">All tasks are either awaiting verification or none have been created.</p>
                )}

              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">
              <Award className="inline-block mr-2 h-5 w-5 text-primary" /> Rewards
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setIsAddRewardModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Reward
            </Button>
          </CardHeader>
          <CardContent>
            {rewards.length > 0 ? (
              <ul className="space-y-2">
                {rewards.map(reward => (
                  <li key={reward.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/30 hover:bg-secondary/40 transition-colors">
                    <div className="flex-1">
                      <span className="font-medium">{reward.description}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                        <span className="text-sm text-primary whitespace-nowrap">{reward.pointsCost} pts</span>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteConfirmation(reward.id, reward.description, 'reward')}
                            title={`Delete reward "${reward.description}"`}
                            >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No rewards created yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <AddChildModal 
        isOpen={isAddChildModalOpen} 
        onClose={() => setIsAddChildModalOpen(false)}
        onChildAdded={handleDataRefreshNeeded} 
      />
      <AddTaskModal 
        isOpen={isAddTaskModalOpen} 
        onClose={() => setIsAddTaskModalOpen(false)} 
        onTaskAdded={handleDataRefreshNeeded}
        parentChildren={children} 
      />
      <AddRewardModal 
        isOpen={isAddRewardModalOpen} 
        onClose={() => setIsAddRewardModalOpen(false)} 
        onRewardAdded={handleDataRefreshNeeded}
      />
    </div>
  );
}
