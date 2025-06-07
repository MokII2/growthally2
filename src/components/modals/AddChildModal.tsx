
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChildAdded?: () => void; 
}

const childFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50, { message: "Name must be less than 50 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
});

type ChildFormValues = z.infer<typeof childFormSchema>;

export default function AddChildModal({ isOpen, onClose, onChildAdded }: AddChildModalProps) {
  const { signUpChildAndLinkToParent, user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ChildFormValues>({
    resolver: zodResolver(childFormSchema),
    defaultValues: {
      name: "",
      email: "",
    }
  });

  const processSubmit: SubmitHandler<ChildFormValues> = async (data) => {
    if (!user) {
      toast({ title: "Error", description: "Parent not authenticated.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      const result = await signUpChildAndLinkToParent(user.uid, { name: data.name, email: data.email });
      if (result && result.userProfile) {
        toast({ 
          title: "Child Account Created!", 
          description: `${result.userProfile.displayName}'s account is ready. You can find their initial password on your dashboard.`,
          duration: 7000 
        });
        reset();
        onClose(); // Close modal on success
        if (onChildAdded) {
            onChildAdded(); 
        }
      } else {
        // This 'else' might not be strictly necessary anymore if signUpChildAndLinkToParent always throws on failure.
        // Kept for robustness in case of unexpected non-throwing failures.
        throw new Error("Failed to add child or result was unexpected.");
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({ 
          title: "Failed to Add Child", 
          description: "This email address is already in use. Please use a different email for the child.", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Failed to Add Child", 
          description: error.message || "An unexpected error occurred. Please try again.", 
          variant: "destructive" 
        });
      }
      console.error("Error in AddChildModal processSubmit:", error);
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
          <DialogTitle>Add New Child Account</DialogTitle>
          <DialogDescription>
            Enter the child's name and email. An account with an initial password will be created. You can view this password on your dashboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(processSubmit)} className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name-add-child">Child's Name</Label>
            <Input id="name-add-child" {...register("name")} placeholder="e.g., Alex Smith" className={errors.name ? "border-destructive" : ""} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-add-child">Child's Email</Label>
            <Input id="email-add-child" type="email" {...register("email")} placeholder="e.g., alex@example.com" className={errors.email ? "border-destructive" : ""} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Create Child Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
