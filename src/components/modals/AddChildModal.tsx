
"use client";

import { useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

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
  const [generatedPasswordInfo, setGeneratedPasswordInfo] = useState<{ email: string; password?: string } | null>(null);


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
    setGeneratedPasswordInfo(null); // Reset password info

    try {
      const result = await signUpChildAndLinkToParent(user.uid, { name: data.name, email: data.email });
      if (result && result.userProfile) {
        toast({ 
          title: "Child Account Created!", 
          description: `${result.userProfile.displayName}'s account is ready.`,
          duration: 7000 
        });
        if (result.generatedPassword) {
          setGeneratedPasswordInfo({ email: result.userProfile.email!, password: result.generatedPassword });
        }
        reset();
        // Keep modal open to show password, or close and show in toast only.
        // For now, we'll show it in an alert inside the modal. Parent can close manually.
        // onClose(); // Parent closes manually after seeing password
        if (onChildAdded) {
            onChildAdded(); 
        }
      } else {
        throw new Error("Failed to add child. The email might already be in use or another error occurred.");
      }
    } catch (error: any) {
      toast({ title: "Failed to Add Child", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    if (!isSubmitting) {
      reset();
      setGeneratedPasswordInfo(null);
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
            Enter the child's name and email. An account with an initial password will be created.
          </DialogDescription>
        </DialogHeader>
        {!generatedPasswordInfo ? (
          <form onSubmit={handleSubmit(processSubmit)} className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Child's Name</Label>
              <Input id="name" {...register("name")} placeholder="e.g., Alex Smith" className={errors.name ? "border-destructive" : ""} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Child's Email</Label>
              <Input id="email" type="email" {...register("email")} placeholder="e.g., alex@example.com" className={errors.email ? "border-destructive" : ""} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating Account..." : "Create Child Account"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-4">
            <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700">
              <Terminal className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="font-semibold text-green-700 dark:text-green-300">Account Created Successfully!</AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-400">
                Please provide the following credentials to your child:
                <ul className="mt-2 list-disc list-inside text-sm">
                  <li><strong>Email:</strong> {generatedPasswordInfo.email}</li>
                  <li><strong>Initial Password:</strong> <strong className="text-base font-mono tracking-wider bg-green-100 dark:bg-green-800 px-1 py-0.5 rounded">{generatedPasswordInfo.password}</strong></li>
                </ul>
                They can log in and should be prompted to change their password or can use the "Forgot Password" option later.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
