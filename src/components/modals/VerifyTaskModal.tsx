
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
import Image from 'next/image'; // For displaying image
import { ImageIcon } from 'lucide-react';

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
      // Reset feedback only if it's a new task or feedback hasn't been set from the task yet
      // This prevents overriding feedback if the modal reopens for the same task after an initial feedback input attempt
      if (task.verificationFeedback && task.verificationFeedback !== watch("verificationFeedback")) {
        setValue("verificationFeedback", task.verificationFeedback);
      } else if (!task.verificationFeedback) {
         setValue("verificationFeedback", "");
      }
    } else {
        setValue("verificationFeedback", ""); // Clear if no task
    }
  }, [task, setValue, watch]); // watch added to dependency

  const handleVerifySubmit: SubmitHandler<VerifyTaskFormValues> = async (data) => {
    setIsSubmittingVerify(true);
    await onVerify(data.verificationFeedback || "");
    setIsSubmittingVerify(false);
    reset({ verificationFeedback: "" });
    onClose();
  };

  const handleRejectSubmit: SubmitHandler<VerifyTaskFormValues> = async (data) => {
    setIsSubmittingReject(true);
    // Ensure some feedback is provided if rejecting, even if it's a default one.
    await onReject(data.verificationFeedback || "Please review and try again.");
    setIsSubmittingReject(false);
    reset({ verificationFeedback: "" });
    onClose();
  };
  
  const handleCloseDialog = () => {
    if (!isSubmittingVerify && !isSubmittingReject) {
      reset({ verificationFeedback: "" }); // Reset form on cancel
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
            Review the task details, child's notes, and submitted image (if any).
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

          {task.completionImageURL && (
            <div>
              <Label className="font-semibold">Submitted Image</Label>
              <div className="mt-1 relative w-full aspect-video rounded-md overflow-hidden border">
                 <a href={task.completionImageURL} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    <Image 
                        src={task.completionImageURL} 
                        alt="Child's submitted work" 
                        layout="fill"
                        objectFit="contain" 
                        className="bg-muted"
                        data-ai-hint="task submission"
                    />
                 </a>
              </div>
               <a href={task.completionImageURL} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-flex items-center">
                 <ImageIcon className="h-3 w-3 mr-1"/> Open image in new tab
               </a>
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
