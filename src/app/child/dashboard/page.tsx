"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Star, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Mock data for demonstration
interface MockTask { id: string; description: string; points: number; status: 'pending' | 'completed'; }
interface MockReward { id: string; description: string; pointsCost: number; }

export default function ChildDashboardPage() {
  const { userProfile } = useAuth();

  const currentPoints = userProfile?.points ?? 0;

  const tasks: MockTask[] = [
    { id: 't1', description: 'Tidy up your toys', points: 10, status: 'pending' },
    { id: 't2', description: 'Read a book for 20 minutes', points: 15, status: 'pending' },
    { id: 't3', description: 'Help set the table', points: 5, status: 'completed' },
  ];

  const rewards: MockReward[] = [
    { id: 'r1', description: '30 minutes of game time', pointsCost: 50 },
    { id: 'r2', description: 'Choose a movie for family night', pointsCost: 100 },
  ];

  const handleMarkTaskDone = (taskId: string) => alert(`Mark task ${taskId} as done (placeholder)`);
  const handleClaimReward = (rewardId: string) => alert(`Claim reward ${rewardId} (placeholder)`);

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
            <span className="text-sm text-muted-foreground">Points</span>
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
            {tasks.filter(task => task.status === 'pending').length > 0 ? (
              <ul className="space-y-3">
                {tasks.filter(task => task.status === 'pending').map(task => (
                  <li key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div>
                      <p className="font-medium">{task.description}</p>
                      <p className="text-sm text-primary">{task.points} points</p>
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
            {tasks.filter(task => task.status === 'completed').length > 0 && (
                 <div className="mt-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Completed Tasks (Awaiting Verification):</h3>
                     <ul className="space-y-2 opacity-70">
                        {tasks.filter(task => task.status === 'completed').map(task => (
                          <li key={task.id} className="flex items-center justify-between p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                            <span className="font-medium line-through">{task.description}</span>
                            <span className="text-xs text-green-600 dark:text-green-400">Completed</span>
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
                      <p className="text-sm text-primary">{reward.pointsCost} points</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleClaimReward(reward.id)}
                      disabled={currentPoints < reward.pointsCost}
                    >
                      Claim Reward
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No rewards available at the moment.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
