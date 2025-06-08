
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Task, Child } from '@/types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded?: () => void;
  parentChildren: Child[]; // List of children passed from parent dashboard
}

const taskFormSchema = z.object({
  description: z.string().min(3, { message: "Description must be at least 3 characters." }).max(100, { message: "Description too long." }),
  points: z.coerce.number().min(1, { message: "Points must be at least 1." }).max(1000, { message: "Points seem too high." }),
  assignedToUids: z.array(z.string()).min(1, { message: "At least one child must be selected." }),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function AddTaskModal({ isOpen, onClose, onTaskAdded, parentChildren }: AddTaskModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      description: "",
      points: 10,
      assignedToUids: [],
    }
  });

  useEffect(() => {
    if (!isOpen) {
      reset({ description: "", points: 10, assignedToUids: [] });
    }
  }, [isOpen, reset]);

  const processSubmit: SubmitHandler<TaskFormValues> = async (data) => {
    if (!user) {
      toast({ title: "Error", description: "Parent not authenticated.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const assignedToNames = parentChildren
      .filter(child => data.assignedToUids.includes(child.authUid!))
      .map(child => child.name);

    try {
      const taskData: Omit<Task, 'id' | 'createdAt'> & { createdAt: any } = {
        description: data.description,
        points: data.points,
        parentId: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
        assignedToUids: data.assignedToUids,
        assignedToNames: assignedToNames,
      };

      await addDoc(collection(db, 'tasks'), taskData);
      
      toast({ title: "Task Added", description: `Task "${data.description}" has been created successfully.` });
      reset();
      onClose();
      if (onTaskAdded) {
        onTaskAdded();
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Define a new task, assign points, and select which child(ren) to assign it to.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(processSubmit)} className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="description-add-task">Task Description</Label>
            <Textarea id="description-add-task" {...register("description")} placeholder="e.g., Clean your room" className={errors.description ? "border-destructive" : ""} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="points-add-task">Points</Label>
            <Input id="points-add-task" type="number" {...register("points")} className={errors.points ? "border-destructive" : ""} />
            {errors.points && <p className="text-xs text-destructive">{errors.points.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Assign to Child(ren) (select at least one)</Label>
            {parentChildren.length === 0 ? (
                <p className="text-sm text-muted-foreground">You haven't added any children yet. Please add a child first.</p>
            ) : (
            <Controller
              name="assignedToUids"
              control={control}
              render={({ field }) => (
                <ScrollArea className="h-40 rounded-md border p-2">
                  <div className="space-y-2">
                    {parentChildren.map((child) => (
                      <div key={child.authUid} className="flex items-center space-x-2">
                        <Checkbox
                          id={`assign-child-${child.authUid}`}
                          checked={field.value?.includes(child.authUid!)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...(field.value || []), child.authUid!])
                              : field.onChange(
                                  (field.value || []).filter(
                                    (uid) => uid !== child.authUid
                                  )
                                );
                          }}
                        />
                        <Label htmlFor={`assign-child-${child.authUid}`} className="font-normal text-sm">
                          {child.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            />
            )}
            {errors.assignedToUids && <p className="text-xs text-destructive">{errors.assignedToUids.message}</p>}
          </div>
          
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || parentChildren.length === 0}>
              {isSubmitting ? "Adding..." : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
