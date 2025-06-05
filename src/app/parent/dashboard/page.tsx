"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, ListChecks, Award } from "lucide-react";

// Mock data structures for demonstration
interface MockChild { id: string; name: string; }
interface MockTask { id: string; description: string; points: number; assignedTo?: string; }
interface MockReward { id: string; description: string; pointsCost: number; }

export default function ParentDashboardPage() {
  // Placeholder state and functions - to be replaced with Firestore data and modals
  const children: MockChild[] = [
    { id: '1', name: 'Alex' },
    { id: '2', name: 'Jamie' },
  ];
  const tasks: MockTask[] = [
    { id: 't1', description: 'Clean room', points: 10, assignedTo: 'Alex' },
    { id: 't2', description: 'Homework', points: 15 },
  ];
  const rewards: MockReward[] = [
    { id: 'r1', description: 'Extra screen time', pointsCost: 50 },
    { id: 'r2', description: 'Ice cream trip', pointsCost: 100 },
  ];

  const handleAddChild = () => alert("Add Child Modal Placeholder");
  const handleAddTask = () => alert("Add Task Modal Placeholder");
  const handleAddReward = () => alert("Add Reward Modal Placeholder");

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Welcome, Parent!</h1>
          <p className="text-muted-foreground">Manage your family's tasks and rewards.</p>
        </div>
        {/* Global actions can go here if any */}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Children Management */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">
              <Users className="inline-block mr-2 h-5 w-5 text-primary" /> Children
            </CardTitle>
            <Button size="sm" variant="outline" onClick={handleAddChild}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Child
            </Button>
          </CardHeader>
          <CardContent>
            {children.length > 0 ? (
              <ul className="space-y-2">
                {children.map(child => (
                  <li key={child.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/30">
                    <span className="font-medium">{child.name}</span>
                    {/* Add more child info or actions here */}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No children added yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Tasks Management */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">
              <ListChecks className="inline-block mr-2 h-5 w-5 text-primary" /> Tasks
            </CardTitle>
            <Button size="sm" variant="outline" onClick={handleAddTask}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </CardHeader>
          <CardContent>
            {tasks.length > 0 ? (
              <ul className="space-y-2">
                {tasks.map(task => (
                  <li key={task.id} className="p-2 rounded-md bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{task.description}</span>
                      <span className="text-sm text-primary">{task.points} pts</span>
                    </div>
                    {task.assignedTo && <p className="text-xs text-muted-foreground">Assigned to: {task.assignedTo}</p>}
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
            <Button size="sm" variant="outline" onClick={handleAddReward}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Reward
            </Button>
          </CardHeader>
          <CardContent>
            {rewards.length > 0 ? (
              <ul className="space-y-2">
                {rewards.map(reward => (
                  <li key={reward.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/30">
                    <span className="font-medium">{reward.description}</span>
                    <span className="text-sm text-primary">{reward.pointsCost} pts</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No rewards created yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
