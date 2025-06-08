
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, ListChecks, Award, KeyRound, Copy, Trash2, VenetianMask, Activity, Cake, Palette, Brain, CookingPot, BookOpen, PersonStanding, Music, Gamepad2, Code2 } from "lucide-react";
import AddChildModal from "@/components/modals/AddChildModal";
import AddTaskModal from "@/components/modals/AddTaskModal";
import AddRewardModal from "@/components/modals/AddRewardModal";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc, getDoc } from "firebase/firestore";
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

const hobbyIcons: Record<string, React.ElementType> = {
  "运动": Activity,
  "阅读": BookOpen,
  "音乐": Music,
  "舞蹈": PersonStanding,
  "计算": Brain,
  "手工": VenetianMask, // Using a generic icon, could be Palette or similar
  "烘培": CookingPot,
  "书法": BookOpen, // Placeholder, could be a custom SVG or more specific Lucide icon if available
  "绘画": Palette,
  "编程": Code2,
  "游戏": Gamepad2, // Example if '游戏' was an option
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
        // Delete from parent's subcollection
        await deleteDoc(doc(db, "users", user.uid, "children", itemToDelete.id));
        toast({ title: "Child Record Deleted", description: `${itemToDelete.name}'s record has been removed.` });

        // If child has a main auth account, delete their profile from /users collection
        if (itemToDelete.childAuthUid) {
          const childProfileRef = doc(db, "users", itemToDelete.childAuthUid);
          const childProfileSnap = await getDoc(childProfileRef);
          if (childProfileSnap.exists()) {
             await deleteDoc(childProfileRef);
             toast({ title: "Child Profile Deleted", description: `Main profile for ${itemToDelete.name} also removed.` });
          }
          // Inform parent about manual Firebase Auth user deletion
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
          <h1 className="text-3xl font-bold tracking-tight font-headline">Welcome, Parent!</h1>
          <p className="text-muted-foreground">Manage your family's tasks and rewards.</p>
        </div>
      </div>

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
                              const IconComponent = hobbyIcons[hobby] || Palette; // Default icon
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
              <ListChecks className="inline-block mr-2 h-5 w-5 text-primary" /> Tasks
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setIsAddTaskModalOpen(true)} disabled={children.length === 0}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Task
            </Button>
            {children.length === 0 && <p className="text-xs text-muted-foreground mt-1">Add a child first to assign tasks.</p>}
          </CardHeader>
          <CardContent>
            {tasks.length > 0 ? (
              <ul className="space-y-2">
                {tasks.map(task => (
                  <li key={task.id} className="p-3 rounded-md bg-secondary/30 hover:bg-secondary/40 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="font-medium">{task.description}</span>
                        {task.assignedToNames && task.assignedToNames.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                Assigned to: {task.assignedToNames.join(', ')}
                            </p>
                        )}
                         <p className="text-xs text-muted-foreground capitalize">Status: {task.status}</p>
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
            ) : (
              <p className="text-sm text-muted-foreground">No tasks created yet.</p>
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
