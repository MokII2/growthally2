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
    { id: 't1', description: '打扫房间', points: 10, assignedTo: 'Alex' },
    { id: 't2', description: '家庭作业', points: 15 },
  ];
  const rewards: MockReward[] = [
    { id: 'r1', description: '额外屏幕时间', pointsCost: 50 },
    { id: 'r2', description: '冰淇淋之旅', pointsCost: 100 },
  ];

  const handleAddChild = () => alert("添加孩子模态框占位符");
  const handleAddTask = () => alert("添加任务模态框占位符");
  const handleAddReward = () => alert("添加奖励模态框占位符");

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">欢迎，家长！</h1>
          <p className="text-muted-foreground">管理您家庭的任务和奖励。</p>
        </div>
        {/* Global actions can go here if any */}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Children Management */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">
              <Users className="inline-block mr-2 h-5 w-5 text-primary" /> 孩子
            </CardTitle>
            <Button size="sm" variant="outline" onClick={handleAddChild}>
              <PlusCircle className="mr-2 h-4 w-4" /> 添加孩子
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
              <p className="text-sm text-muted-foreground">尚未添加任何孩子。</p>
            )}
          </CardContent>
        </Card>

        {/* Tasks Management */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">
              <ListChecks className="inline-block mr-2 h-5 w-5 text-primary" /> 任务
            </CardTitle>
            <Button size="sm" variant="outline" onClick={handleAddTask}>
              <PlusCircle className="mr-2 h-4 w-4" /> 添加任务
            </Button>
          </CardHeader>
          <CardContent>
            {tasks.length > 0 ? (
              <ul className="space-y-2">
                {tasks.map(task => (
                  <li key={task.id} className="p-2 rounded-md bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{task.description}</span>
                      <span className="text-sm text-primary">{task.points} 积分</span>
                    </div>
                    {task.assignedTo && <p className="text-xs text-muted-foreground">分配给: {task.assignedTo}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">尚未创建任何任务。</p>
            )}
          </CardContent>
        </Card>

        {/* Rewards Management */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">
              <Award className="inline-block mr-2 h-5 w-5 text-primary" /> 奖励
            </CardTitle>
            <Button size="sm" variant="outline" onClick={handleAddReward}>
              <PlusCircle className="mr-2 h-4 w-4" /> 添加奖励
            </Button>
          </CardHeader>
          <CardContent>
            {rewards.length > 0 ? (
              <ul className="space-y-2">
                {rewards.map(reward => (
                  <li key={reward.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/30">
                    <span className="font-medium">{reward.description}</span>
                    <span className="text-sm text-primary">{reward.pointsCost} 积分</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">尚未创建任何奖励。</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
