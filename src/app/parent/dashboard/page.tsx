
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, ListChecks, Award, Edit3, Trash2 } from "lucide-react";
import AddChildModal from "@/components/modals/AddChildModal";
import AddTaskModal from "@/components/modals/AddTaskModal";
import AddRewardModal from "@/components/modals/AddRewardModal";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Child, Task, Reward } from "@/types"; // Assuming these types exist
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

  // TODO: State for edit modals
  // const [editingChild, setEditingChild] = useState<Child | null>(null);
  // const [editingTask, setEditingTask] = useState<Task | null>(null);
  // const [editingReward, setEditingReward] = useState<Reward | null>(null);

  // Fetch children (from parent's subcollection)
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

  // TODO: Implement actual Firestore fetching for tasks and rewards
  // For now, using mock data structure, but it will be empty until Firestore logic is added
  // useEffect(() => {
  // if (!user) return;
  // Mock data for tasks as Firestore integration is pending
  // const mockTasks: Task[] = [
  // { id: 't1', description: 'Clean Room', points: 10, parentId: user.uid, status: 'pending', createdAt: new Date(), assignedToName: 'Alex' },
  // { id: 't2', description: 'Homework', points: 15, parentId: user.uid, status: 'verified', createdAt: new Date() },
  // ];
  // setTasks(mockTasks);

  // Mock data for rewards
  // const mockRewards: Reward[] = [
  //   { id: 'r1', description: 'Extra Screen Time', pointsCost: 50, parentId: user.uid, createdAt: new Date() },
  //   { id: 'r2', description: 'Ice Cream Trip', pointsCost: 100, parentId: user.uid, createdAt: new Date() },
  // ];
  // setRewards(mockRewards);
  // }, [user]);


  const handleRefreshData = () => {
    // This function could be called by modals to indicate data has changed.
    // With onSnapshot, data should refresh automatically.
    // If not using onSnapshot for some data, manual re-fetch logic would go here.
    console.log("Data refresh triggered (relevant if not using onSnapshot everywhere).");
  };
  
  // Placeholder delete functions - replace with Firestore logic
  const handleDeleteChild = (childId: string) => alert(`Delete child ${childId} - Placeholder`);
  const handleDeleteTask = (taskId: string) => alert(`Delete task ${taskId} - Placeholder`);
  const handleDeleteReward = (rewardId: string) => alert(`Delete reward ${rewardId} - Placeholder`);


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
                    {/* 
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
                     {/*
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
                    {/*
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
        onChildAdded={handleRefreshData} 
      />
      <AddTaskModal 
        isOpen={isAddTaskModalOpen} 
        onClose={() => setIsAddTaskModalOpen(false)} 
        onTaskAdded={handleRefreshData}
      />
      <AddRewardModal 
        isOpen={isAddRewardModalOpen} 
        onClose={() => setIsAddRewardModalOpen(false)} 
        onRewardAdded={handleRefreshData}
      />
    </div>
  );
}
