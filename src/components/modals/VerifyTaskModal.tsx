
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Task } from '@/types';
import { Separator } from '../ui/separator';

interface VerifyTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (feedback: string) => Promise<void>;
  onReject: (feedback: string) => Promise<void>;
  task: Task | null;
}

const verifyTaskSchema = z.object({
  verificationFeedback: z.string().max(500, "Feedback is too long (max 500 characters).").optional(),
});

type VerifyTaskFormValues = z.infer<typeof verifyTaskSchema>;

export default function VerifyTaskModal({ isOpen, onClose, onVerify, onReject, task }: VerifyTaskModalProps) {
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<VerifyTaskFormValues>({
    resolver: zodResolver(verifyTaskSchema),
    defaultValues: {
      verificationFeedback: "",
    }
  });

  useEffect(() => {
    if (task) {
      setValue("verificationFeedback", task.verificationFeedback || "");
    }
  }, [task, setValue]);

  const handleVerifySubmit: SubmitHandler<VerifyTaskFormValues> = async (data) => {
    setIsSubmittingVerify(true);
    await onVerify(data.verificationFeedback || "");
    setIsSubmittingVerify(false);
    reset();
    onClose();
  };

  const handleRejectSubmit: SubmitHandler<VerifyTaskFormValues> = async (data) => {
    setIsSubmittingReject(true);
    await onReject(data.verificationFeedback || "Please review and try again."); // Default rejection message
    setIsSubmittingReject(false);
    reset();
    onClose();
  };
  
  const handleCloseDialog = () => {
    if (!isSubmittingVerify && !isSubmittingReject) {
      reset();
      onClose();
    }
  };

  if (!isOpen || !task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Verify Task: {task.description}</DialogTitle>
          <DialogDescription>
            Review the task details and child's notes. Provide feedback and either verify or return the task.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div>
            <Label className="font-semibold">Task Details</Label>
            <p className="text-sm text-muted-foreground">{task.description} ({task.points} pts)</p>
          </div>

          {task.completionNotes && (
            <div>
              <Label className="font-semibold">Child's Completion Notes</Label>
              <p className="text-sm p-2 bg-secondary/30 rounded-md whitespace-pre-wrap">{task.completionNotes}</p>
            </div>
          )}
          <Separator />
          <form id="verifyTaskForm" className="space-y-3"> {/* Give form an ID to be targeted by footer buttons */}
            <div>
                <Label htmlFor="verificationFeedback">Your Feedback/Encouragement (Optional)</Label>
                <Textarea 
                id="verificationFeedback" 
                {...register("verificationFeedback")} 
                placeholder="e.g., Great job on cleaning your room! It looks fantastic." 
                rows={3}
                className={errors.verificationFeedback ? "border-destructive" : ""}
                />
                {errors.verificationFeedback && <p className="text-xs text-destructive">{errors.verificationFeedback.message}</p>}
            </div>
          </form>
        </div>

        <DialogFooter className="mt-2 sm:justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleSubmit(handleRejectSubmit)} 
            disabled={isSubmittingVerify || isSubmittingReject}
            form="verifyTaskForm" 
          >
            {isSubmittingReject ? "Returning..." : "Return to Child"}
          </Button>
          <div className="flex space-x-2 mt-2 sm:mt-0">
            <Button type="button" variant="ghost" onClick={handleCloseDialog} disabled={isSubmittingVerify || isSubmittingReject}>Cancel</Button>
            <Button 
              type="button" 
              onClick={handleSubmit(handleVerifySubmit)} 
              disabled={isSubmittingVerify || isSubmittingReject}
              form="verifyTaskForm"
            >
              {isSubmittingVerify ? "Verifying..." : "Verify & Award Points"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
