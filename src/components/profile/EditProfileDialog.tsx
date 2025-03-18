
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/hooks/use-user";

interface EditProfileDialogProps {
  open: boolean;  // Keep this prop name as 'open' instead of 'isOpen'
  onOpenChange: (open: boolean) => void;
  onUpdate: (avatar: string) => void;
}

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
});

const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function EditProfileDialog({ open, onOpenChange, onUpdate }: EditProfileDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedAvatar, setUploadedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });
  
  // Fetch the current user data when the dialog opens
  useEffect(() => {
    if (open && user) {
      form.reset({
        username: user.username || "",
        email: user.email || "",
      });
      
      // Reset avatar preview
      setAvatarPreview(user.avatarUrl || null);
      setUploadedAvatar(null);
    }
  }, [open, user, form]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > AVATAR_MAX_SIZE) {
      toast.error("File is too large", { description: "Maximum file size is 5MB" });
      return;
    }
    
    setUploadedAvatar(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
  
  async function uploadAvatar(userId: string): Promise<string | null> {
    if (!uploadedAvatar) return null;
    
    try {
      // Create a unique file path using user ID and timestamp
      const filePath = `${userId}/${Date.now()}-${uploadedAvatar.name}`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, uploadedAvatar, {
          upsert: true,
        });
      
      if (error) throw error;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      return publicUrl;
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar", { 
        description: error.message || "Please try again later" 
      });
      return null;
    }
  }
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to update your profile");
        setIsLoading(false);
        return;
      }
      
      // Upload avatar if a new one was selected
      let avatarUrl = null;
      if (uploadedAvatar) {
        avatarUrl = await uploadAvatar(user.id);
      }
      
      // Prepare profile update data
      const updateData: any = {
        username: values.username,
        email: values.email,
      };
      
      // Only add avatar_url if we have a new one
      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }
      
      // Update the profile in the profiles table
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Update email in auth if it changed
      const { error: updateEmailError } = await supabase.auth.updateUser({
        email: values.email,
      });
      
      if (updateEmailError) {
        throw updateEmailError;
      }
      
      toast.success("Profile updated successfully");
      onUpdate(avatarUrl || "");
      onOpenChange(false);
      
    } catch (error: any) {
      toast.error("Failed to update profile", { 
        description: error.message || "Please try again later" 
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information below
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center mb-4">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          
          <Avatar 
            className="h-24 w-24 cursor-pointer border-2 border-dashed border-gray-300 hover:border-primary transition-colors"
            onClick={handleAvatarClick}
          >
            {avatarPreview ? (
              <AvatarImage src={avatarPreview} alt="Avatar preview" />
            ) : (
              <AvatarFallback className="text-2xl">
                {user?.username?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            )}
          </Avatar>
          
          <Button 
            variant="ghost" 
            size="sm" 
            type="button" 
            className="mt-2"
            onClick={handleAvatarClick}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload photo
          </Button>
          
          <p className="text-xs text-muted-foreground mt-1">
            Click to upload or replace avatar (max 5MB)
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Your username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
