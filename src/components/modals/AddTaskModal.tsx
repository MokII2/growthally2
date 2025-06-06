
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Task } from '@/types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded?: () => void;
}

const taskFormSchema = z.object({
  description: z.string().min(3, { message: "Description must be at least 3 characters." }).max(100, { message: "Description too long." }),
  points: z.coerce.number().min(1, { message: "Points must be at least 1." }).max(1000, { message: "Points seem too high." }),
  // assignedTo: z.string().optional(), // Child's UID - For future implementation
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function AddTaskModal({ isOpen, onClose, onTaskAdded }: AddTaskModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      description: "",
      points: 10,
    }
  });

  const processSubmit: SubmitHandler<TaskFormValues> = async (data) => {
    if (!user) {
      toast({ title: "Error", description: "Parent not authenticated.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const taskData: Omit<Task, 'id' | 'createdAt'> & { createdAt: any } = {
        description: data.description,
        points: data.points,
        parentId: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
        // assignedTo: data.assignedTo || null, // For future implementation
        // assignedToName: data.assignedTo ? findChildName(data.assignedTo) : null // For future implementation
      };
      await addDoc(collection(db, 'tasks'), taskData);
      
      toast({ title: "Task Added", description: `Task "${data.description}" has been created successfully.` });
      reset();
      onClose();
      if (onTaskAdded) {
        onTaskAdded(); // Callback to potentially refresh list, though onSnapshot handles it
      }
    } catch (error: any) {
      console.error("Error adding task:", error);
      toast({ title: "Failed to Add Task", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCloseDialog = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Define a new task and assign points to it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(processSubmit)} className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">Task Description</Label>
            <Textarea id="description" {...register("description")} placeholder="e.g., Clean your room" className={errors.description ? "border-destructive" : ""}/>
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="points">Points</Label>
            <Input id="points" type="number" {...register("points")} className={errors.points ? "border-destructive" : ""} />
            {errors.points && <p className="text-sm text-destructive">{errors.points.message}</p>}
          </div>
          {/* TODO: Add child assignment dropdown here */}
          {/* <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign to (Optional)</Label>
            <Select> ... </Select>
          </div> */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
