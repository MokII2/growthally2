
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm, type SubmitHandler, watch } from "react-hook-form"; // Added watch
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

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch: watchForm } = useForm<VerifyTaskFormValues>({ // Renamed watch to watchForm
    resolver: zodResolver(verifyTaskSchema),
    defaultValues: {
      verificationFeedback: "",
    }
  });

  useEffect(() => {
    if (task) {
      if (task.verificationFeedback && task.verificationFeedback !== watchForm("verificationFeedback")) {
        setValue("verificationFeedback", task.verificationFeedback);
      } else if (!task.verificationFeedback) {
         setValue("verificationFeedback", "");
      }
    } else {
        setValue("verificationFeedback", "");
    }
  }, [task, setValue, watchForm]);

  const handleVerifySubmit: SubmitHandler<VerifyTaskFormValues> = async (data) => {
    setIsSubmittingVerify(true);
    await onVerify(data.verificationFeedback || "");
    setIsSubmittingVerify(false);
    reset({ verificationFeedback: "" });
    onClose();
  };

  const handleRejectSubmit: SubmitHandler<VerifyTaskFormValues> = async (data) => {
    setIsSubmittingReject(true);
    await onReject(data.verificationFeedback || "Please review and try again.");
    setIsSubmittingReject(false);
    reset({ verificationFeedback: "" });
    onClose();
  };

  const handleCloseDialog = () => {
    if (!isSubmittingVerify && !isSubmittingReject) {
      reset({ verificationFeedback: "" });
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
            Review the task details and child's notes.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
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
          <form id="verifyTaskForm" className="space-y-3">
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

        <DialogFooter className="mt-2 sm:justify-between border-t pt-4">
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
