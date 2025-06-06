
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, ListChecks, Award } from "lucide-react"; // Removed Edit3, Trash2 for now
import AddChildModal from "@/components/modals/AddChildModal";
import AddTaskModal from "@/components/modals/AddTaskModal";
import AddRewardModal from "@/components/modals/AddRewardModal";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Child, Task, Reward } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function ParentDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [children, setChildren] = useState<Child[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);

  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddRewardModalOpen, setIsAddRewardModalOpen] = useState(false);

  // Fetch children
  useEffect(() => {
    if (!user) return;
    const childrenQuery = query(collection(db, "users", user.uid, "children"));
    const unsubscribe = onSnapshot(childrenQuery, (snapshot) => {
      const fetchedChildren: Child[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Child));
      setChildren(fetchedChildren);
    }, (error) => {
      console.error("Error fetching children:", error);
      toast({ title: "Error", description: "Could not fetch children.", variant: "destructive" });
    });
    return () => unsubscribe();
  }, [user, toast]);

  // Fetch tasks
  useEffect(() => {
    if (!user) return;
    const tasksQuery = query(
      collection(db, "tasks"),
      where("parentId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const fetchedTasks: Task[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(fetchedTasks);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      toast({ title: "Error", description: "Could not fetch tasks.", variant: "destructive" });
    });
    return () => unsubscribe();
  }, [user, toast]);

  // Fetch rewards
  useEffect(() => {
    if (!user) return;
    const rewardsQuery = query(
      collection(db, "rewards"),
      where("parentId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(rewardsQuery, (snapshot) => {
      const fetchedRewards: Reward[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward));
      setRewards(fetchedRewards);
    }, (error) => {
      console.error("Error fetching rewards:", error);
      toast({ title: "Error", description: "Could not fetch rewards.", variant: "destructive" });
    });
    return () => unsubscribe();
  }, [user, toast]);

  const handleDataRefreshNeeded = () => {
    // onSnapshot handles real-time updates, so this is less critical
    // but can be used for other one-off refresh needs if any.
    console.log("Data refresh explicitly triggered (though onSnapshot should cover most cases).");
  };
  
  // Placeholder delete functions - will be implemented later
  // const handleDeleteChild = (childId: string) => alert(`Delete child ${childId} - Placeholder`);
  // const handleDeleteTask = (taskId: string) => alert(`Delete task ${taskId} - Placeholder`);
  // const handleDeleteReward = (rewardId: string) => alert(`Delete reward ${rewardId} - Placeholder`);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Welcome, Parent!</h1>
          <p className="text-muted-foreground">Manage your family's tasks and rewards.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Children Management */}
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
              <ul className="space-y-2">
                {children.map(child => (
                  <li key={child.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/30 hover:bg-secondary/40 transition-colors">
                    <div>
                      <span className="font-medium">{child.name}</span>
                      <p className="text-xs text-muted-foreground">{child.email}</p>
                    </div>
                    {/* Edit/Delete buttons placeholder - for future implementation
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => alert(`Edit ${child.name}`)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteChild(child.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    */}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No children added yet. Click "Add Child" to begin.</p>
            )}
          </CardContent>
        </Card>

        {/* Tasks Management */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">
              <ListChecks className="inline-block mr-2 h-5 w-5 text-primary" /> Tasks
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setIsAddTaskModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </CardHeader>
          <CardContent>
            {tasks.length > 0 ? (
              <ul className="space-y-2">
                {tasks.map(task => (
                  <li key={task.id} className="p-3 rounded-md bg-secondary/30 hover:bg-secondary/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{task.description}</span>
                      <span className="text-sm text-primary">{task.points} Points</span>
                    </div>
                    {task.assignedToName && <p className="text-xs text-muted-foreground">Assigned to: {task.assignedToName}</p>}
                    <p className="text-xs text-muted-foreground capitalize">Status: {task.status}</p>
                     {/* Edit/Delete buttons placeholder
                    <div className="flex items-center space-x-1 mt-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => alert(`Edit ${task.description}`)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    */}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No tasks created yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Rewards Management */}
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
                    <div>
                      <span className="font-medium">{reward.description}</span>
                    </div>
                    <span className="text-sm text-primary">{reward.pointsCost} Points</span>
                    {/* Edit/Delete buttons placeholder
                    <div className="flex items-center space-x-1">
                       <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => alert(`Edit ${reward.description}`)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteReward(reward.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    */}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No rewards created yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AddChildModal 
        isOpen={isAddChildModalOpen} 
        onClose={() => setIsAddChildModalOpen(false)}
        onChildAdded={handleDataRefreshNeeded} 
      />
      <AddTaskModal 
        isOpen={isAddTaskModalOpen} 
        onClose={() => setIsAddTaskModalOpen(false)} 
        onTaskAdded={handleDataRefreshNeeded}
      />
      <AddRewardModal 
        isOpen={isAddRewardModalOpen} 
        onClose={() => setIsAddRewardModalOpen(false)} 
        onRewardAdded={handleDataRefreshNeeded}
      />
    </div>
  );
}
