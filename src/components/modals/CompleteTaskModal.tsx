
"use client";

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input"; // Added Input for file
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, auth } from "@/lib/firebase"; // Assuming auth is needed for user ID
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { ImagePlus, X } from 'lucide-react';

interface CompleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (completionNotes: string, imageURL?: string) => void;
  taskDescription: string;
  taskId: string; // Needed for storage path
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const completeTaskSchema = z.object({
  completionNotes: z.string().max(500, "Notes are too long (max 500 characters).").optional(),
  completionImage: z.custom<FileList | null>()
    .refine(files => files === null || files === undefined || files.length === 0 || (files.length === 1 && files[0].size <= MAX_FILE_SIZE), `Max image size is 5MB.`)
    .refine(files => files === null || files === undefined || files.length === 0 || (files.length === 1 && ALLOWED_FILE_TYPES.includes(files[0].type)), "Only .jpg, .jpeg, .png, .gif, .webp formats are supported.")
    .optional(),
});

type CompleteTaskFormValues = z.infer<typeof completeTaskSchema>;

export default function CompleteTaskModal({ isOpen, onClose, onSubmit, taskDescription, taskId }: CompleteTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { control, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<CompleteTaskFormValues>({
    resolver: zodResolver(completeTaskSchema),
    defaultValues: {
      completionNotes: "",
      completionImage: null,
    }
  });

  const watchedImage = watch("completionImage");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: `Max image size is 5MB.`, variant: "destructive" });
        setValue("completionImage", null);
        setSelectedImagePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
         toast({ title: "Invalid file type", description: "Only .jpg, .jpeg, .png, .gif, .webp formats are supported.", variant: "destructive" });
        setValue("completionImage", null);
        setSelectedImagePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
        return;
      }
      setValue("completionImage", files);
      setSelectedImagePreview(URL.createObjectURL(file));
    } else {
      setValue("completionImage", null);
      setSelectedImagePreview(null);
    }
  };

  const removeSelectedImage = () => {
    setValue("completionImage", null);
    setSelectedImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the actual file input
    }
  };

  const processSubmit: SubmitHandler<CompleteTaskFormValues> = async (data) => {
    setIsSubmitting(true);
    setUploadProgress(null);
    let imageURL: string | undefined = undefined;

    const file = data.completionImage?.[0];

    if (file && auth.currentUser) {
      const storage = getStorage();
      // Path: task_completions/{userId}/{taskId}/{fileName}
      const filePath = `task_completions/${auth.currentUser.uid}/${taskId}/${Date.now()}_${file.name}`;
      const imageStorageRef = storageRef(storage, filePath);

      try {
        const uploadTask = uploadBytesResumable(imageStorageRef, file);
        
        await new Promise<void>((resolve, reject) => {
            uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error("Upload failed:", error);
              toast({ title: "Image Upload Failed", description: error.message, variant: "destructive"});
              reject(error);
            },
            async () => {
              imageURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });

      } catch (error) {
        setIsSubmitting(false);
        setUploadProgress(null);
        // Toast is handled in the uploadTask error callback
        return;
      }
    }

    await onSubmit(data.completionNotes || "", imageURL);
    
    setIsSubmitting(false);
    setUploadProgress(null);
    setSelectedImagePreview(null);
    reset();
    onClose();
  };

  const handleCloseDialog = () => {
    if (!isSubmitting) {
      reset();
      setSelectedImagePreview(null);
      setUploadProgress(null);
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
            Great job! Add notes and optionally upload an image of your completed task.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(processSubmit)} className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="completionNotes">Your Completion Notes (Optional)</Label>
            <Controller
              name="completionNotes"
              control={control}
              render={({ field }) => (
                <Textarea 
                  id="completionNotes" 
                  {...field}
                  placeholder="e.g., I organized all my toys and put them in the correct bins." 
                  rows={3}
                  className={errors.completionNotes ? "border-destructive" : ""}
                />
              )}
            />
            {errors.completionNotes && <p className="text-xs text-destructive">{errors.completionNotes.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="completionImage">Upload Image (Optional)</Label>
            <Input 
              id="completionImage" 
              type="file" 
              accept={ALLOWED_FILE_TYPES.join(",")}
              onChange={handleFileChange}
              className={errors.completionImage ? "border-destructive" : ""}
              ref={fileInputRef}
              disabled={isSubmitting}
            />
            {errors.completionImage && <p className="text-xs text-destructive">{errors.completionImage.message}</p>}
             {selectedImagePreview && (
              <div className="mt-2 relative w-32 h-32 border rounded-md overflow-hidden">
                <img src={selectedImagePreview} alt="Selected preview" className="w-full h-full object-cover" />
                <Button 
                  type="button"
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-1 right-1 h-6 w-6 opacity-80 hover:opacity-100"
                  onClick={removeSelectedImage}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {uploadProgress !== null && (
              <div className="mt-2">
                <Progress value={uploadProgress} className="w-full h-2" />
                <p className="text-xs text-muted-foreground text-center mt-1">{Math.round(uploadProgress)}% uploaded</p>
              </div>
            )}
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || uploadProgress !== null && uploadProgress < 100}>
              {isSubmitting ? (uploadProgress !== null ? "Uploading..." : "Submitting...") : "Submit for Verification"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
