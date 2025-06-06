
"use client";

import { useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AddRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardAdded?: () => void;
}

const rewardFormSchema = z.object({
  description: z.string().min(3, { message: "Description must be at least 3 characters." }).max(100, { message: "Description too long." }),
  pointsCost: z.coerce.number().min(1, { message: "Points cost must be at least 1." }).max(10000, { message: "Points cost seems too high." }),
});

type RewardFormValues = z.infer<typeof rewardFormSchema>;

export default function AddRewardModal({ isOpen, onClose, onRewardAdded }: AddRewardModalProps) {
  const { user } = useAuth(); // To get parentId
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<RewardFormValues>({
    resolver: zodResolver(rewardFormSchema),
    defaultValues: {
      description: "",
      pointsCost: 50,
    }
  });

  const processSubmit: SubmitHandler<RewardFormValues> = async (data) => {
    if (!user) {
      toast({ title: "Error", description: "Parent not authenticated.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    console.log("Reward data to submit:", { ...data, parentId: user.uid }); // Placeholder

    // Placeholder for actual Firestore submission logic
    // const success = await addRewardToFirestore({ ...data, parentId: user.uid, createdAt: serverTimestamp() });
    const success = true; // Simulate success for now

    if (success) {
      toast({ title: "Reward Added (Placeholder)", description: `Reward "${data.description}" has been created.` });
      reset();
      onClose();
      if (onRewardAdded) {
        onRewardAdded();
      }
    } else {
      toast({ title: "Failed to Add Reward", description: "An error occurred.", variant: "destructive" });
    }
    setIsSubmitting(false);
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
          <DialogTitle>Create New Reward</DialogTitle>
          <DialogDescription>
            Define a new reward and set its point cost.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(processSubmit)} className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">Reward Description</Label>
            <Textarea id="description" {...register("description")} placeholder="e.g., 30 minutes of game time" className={errors.description ? "border-destructive" : ""}/>
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pointsCost">Points Cost</Label>
            <Input id="pointsCost" type="number" {...register("pointsCost")} className={errors.pointsCost ? "border-destructive" : ""}/>
            {errors.pointsCost && <p className="text-sm text-destructive">{errors.pointsCost.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Reward"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
