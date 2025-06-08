
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { HOBBY_OPTIONS, type Hobby } from '@/types';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChildAdded?: () => void; 
}

const childFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50, { message: "Name must be less than 50 characters." }),
  emailPrefix: z.string().min(1, {message: "Email prefix is required."}).regex(/^[a-zA-Z0-9._-]+$/, { message: "Invalid characters in email prefix." }),
  gender: z.enum(["male", "female"], { required_error: "Gender is required." }),
  age: z.coerce.number().min(1, { message: "Age must be at least 1." }).max(18, { message: "Age must be 18 or younger." }),
  hobbies: z.array(z.string()).min(1, { message: "At least one hobby must be selected." }),
});

type ChildFormValues = z.infer<typeof childFormSchema>;

export default function AddChildModal({ isOpen, onClose, onChildAdded }: AddChildModalProps) {
  const { signUpChildAndLinkToParent, user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<ChildFormValues>({
    resolver: zodResolver(childFormSchema),
    defaultValues: {
      name: "",
      emailPrefix: "",
      gender: undefined,
      age: undefined,
      hobbies: [],
    }
  });

  const processSubmit: SubmitHandler<ChildFormValues> = async (data) => {
    if (!user) {
      toast({ title: "Error", description: "Parent not authenticated.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      const result = await signUpChildAndLinkToParent(user.uid, { 
        name: data.name, 
        emailPrefix: data.emailPrefix,
        gender: data.gender,
        age: data.age,
        hobbies: data.hobbies 
      });
      if (result && result.userProfile) {
        toast({ 
          title: "Child Account Created!", 
          description: `${result.userProfile.displayName}'s account is ready. You can find their initial password on your dashboard.`,
          duration: 7000 
        });
        reset();
        onClose(); 
        if (onChildAdded) {
            onChildAdded(); 
        }
      } 
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({ 
          title: "Failed to Add Child", 
          description: `The email ${data.emailPrefix}@growthally.com is already in use. Please use a different email prefix.`, 
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Child Account</DialogTitle>
          <DialogDescription>
            Enter the child's details. An account with an initial password will be created. Email will be {`{prefix}`}@growthally.com.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(processSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-1.5">
            <Label htmlFor="name-add-child">Child's Name</Label>
            <Input id="name-add-child" {...register("name")} placeholder="e.g., Alex Smith" className={errors.name ? "border-destructive" : ""} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emailPrefix-add-child">Child's Email Prefix</Label>
            <div className="flex items-center">
              <Input id="emailPrefix-add-child" {...register("emailPrefix")} placeholder="e.g., alex.smith" className={`rounded-r-none ${errors.emailPrefix ? "border-destructive" : ""}`} />
              <span className="inline-flex items-center px-3 text-sm text-muted-foreground border border-l-0 border-input rounded-r-md bg-secondary h-10">
                @growthally.com
              </span>
            </div>
            {errors.emailPrefix && <p className="text-xs text-destructive">{errors.emailPrefix.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="gender-add-child">Gender</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="gender-add-child" className={errors.gender ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="age-add-child">Age</Label>
              <Input id="age-add-child" type="number" {...register("age")} placeholder="e.g., 8" className={errors.age ? "border-destructive" : ""} />
              {errors.age && <p className="text-xs text-destructive">{errors.age.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Hobbies (select at least one)</Label>
            <Controller
              name="hobbies"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 border rounded-md max-h-40 overflow-y-auto">
                  {HOBBY_OPTIONS.map((hobby) => (
                    <div key={hobby} className="flex items-center space-x-2">
                      <Checkbox
                        id={`hobby-${hobby}`}
                        checked={field.value?.includes(hobby)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? field.onChange([...(field.value || []), hobby])
                            : field.onChange(
                                (field.value || []).filter(
                                  (value) => value !== hobby
                                )
                              );
                        }}
                      />
                      <Label htmlFor={`hobby-${hobby}`} className="font-normal text-sm">{hobby}</Label>
                    </div>
                  ))}
                </div>
              )}
            />
            {errors.hobbies && <p className="text-xs text-destructive">{errors.hobbies.message}</p>}
          </div>

          <DialogFooter className="mt-2">
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
