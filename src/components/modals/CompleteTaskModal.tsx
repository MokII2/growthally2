
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface CompleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (completionNotes: string) => void;
  taskDescription: string;
}

const completeTaskSchema = z.object({
  completionNotes: z.string().max(500, "Notes are too long (max 500 characters).").optional(),
});

type CompleteTaskFormValues = z.infer<typeof completeTaskSchema>;

export default function CompleteTaskModal({ isOpen, onClose, onSubmit, taskDescription }: CompleteTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CompleteTaskFormValues>({
    resolver: zodResolver(completeTaskSchema),
    defaultValues: {
      completionNotes: "",
    }
  });

  const processSubmit: SubmitHandler<CompleteTaskFormValues> = async (data) => {
    setIsSubmitting(true);
    await onSubmit(data.completionNotes || "");
    setIsSubmitting(false);
    reset();
    onClose();
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
          <DialogTitle>Complete Task: {taskDescription}</DialogTitle>
          <DialogDescription>
            Great job! You can add some notes about how you completed the task.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(processSubmit)} className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="completionNotes">Your Completion Notes (Optional)</Label>
            <Textarea 
              id="completionNotes" 
              {...register("completionNotes")} 
              placeholder="e.g., I organized all my toys and put them in the correct bins." 
              rows={4}
              className={errors.completionNotes ? "border-destructive" : ""}
            />
            {errors.completionNotes && <p className="text-xs text-destructive">{errors.completionNotes.message}</p>}
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit for Verification"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
