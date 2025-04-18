
import React, { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UserIcon, BriefcaseIcon, GraduationCapIcon, MapPinIcon } from 'lucide-react';

export const ProfileSetupStep = () => {
  const { user } = useUser();
  const [profileData, setProfileData] = useState({
    username: '',
    full_name: '',
    university: '',
    major: '',
    business: '',
    profession: '',
    state: '',
    classes: [] as string[],
    avatar_url: '',
    display_name_preference: 'username' as 'username' | 'full_name'
  });
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url, university, major, business, profession, state, classes, display_name_preference')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        // Prefill with existing data if available
        setProfileData({
          username: data.username || user.email?.split('@')[0] || '',
          full_name: data.full_name || '',
          university: data.university || '',
          major: data.major || '',
          business: data.business || '',
          profession: data.profession || '',
          state: data.state || '',
          classes: Array.isArray(data.classes) ? data.classes : [],
          avatar_url: data.avatar_url || '',
          display_name_preference: (data.display_name_preference as 'username' | 'full_name') || 'username'
        });
      } catch (error) {
        console.error("Error loading profile data:", error);
        // If no profile exists yet, use email username as default
        if (user.email) {
          setProfileData(prev => ({
            ...prev,
            username: user.email?.split('@')[0] || ''
          }));
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [user]);

  const handleChange = (field: string, value: string | string[]) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  };

  const saveProfileData = async () => {
    if (!user || !isDirty) return;
    
    try {
      setLoading(true);
      setIsDirty(false);
      
      let formattedClasses: string[] = [];
      
      if (typeof profileData.classes === 'string') {
        formattedClasses = (profileData.classes as unknown as string)
          .split(',')
          .map(c => c.trim())
          .filter(c => c.length > 0);
      } else if (Array.isArray(profileData.classes)) {
        formattedClasses = profileData.classes;
      }
      
      // Update existing profile rather than trying to create a new one
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profileData.username || user.email?.split('@')[0],
          full_name: profileData.full_name,
          university: profileData.university,
          major: profileData.major,
          business: profileData.business,
          profession: profileData.profession,
          state: profileData.state,
          classes: formattedClasses,
          avatar_url: profileData.avatar_url,
          display_name_preference: profileData.display_name_preference
        })
        .eq('id', user.id);
      
      if (error) {
        console.error("Profile update error:", error);
        throw error;
      }
      
      toast.success("Profile information saved");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile information");
    } finally {
      setLoading(false);
    }
  };

  // This function is called by the onboarding context when transitioning to the next step
  useEffect(() => {
    window.onbeforeunload = () => {
      if (isDirty) {
        saveProfileData();
      }
      return undefined;
    };
    
    return () => {
      window.onbeforeunload = null;
      if (isDirty) {
        saveProfileData();
      }
    };
  }, [profileData, isDirty]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center mb-6">
        <Avatar className="h-20 w-20 mb-4">
          <AvatarImage src={profileData.avatar_url || ""} />
          <AvatarFallback className="text-xl">
            {profileData.username?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <p className="text-sm text-muted-foreground">
          You can set your avatar later in the profile settings
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center">
            <UserIcon className="w-4 h-4 mr-2 text-muted-foreground" />
            <Label htmlFor="username">Username</Label>
          </div>
          <Input 
            id="username" 
            value={profileData.username} 
            onChange={(e) => handleChange('username', e.target.value)}
            placeholder="Choose a username"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <UserIcon className="w-4 h-4 mr-2 text-muted-foreground" />
            <Label htmlFor="full_name">Full Name *</Label>
          </div>
          <Input 
            id="full_name" 
            value={profileData.full_name} 
            onChange={(e) => handleChange('full_name', e.target.value)}
            placeholder="e.g. Taylor Jordan"
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center">
            <GraduationCapIcon className="w-4 h-4 mr-2 text-muted-foreground" />
            <Label htmlFor="university">University/School</Label>
          </div>
          <Input 
            id="university" 
            value={profileData.university} 
            onChange={(e) => handleChange('university', e.target.value)}
            placeholder="e.g. Stanford University"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center">
            <GraduationCapIcon className="w-4 h-4 mr-2 text-muted-foreground" />
            <Label htmlFor="major">Major/Field of Study</Label>
          </div>
          <Input 
            id="major" 
            value={profileData.major} 
            onChange={(e) => handleChange('major', e.target.value)}
            placeholder="e.g. Computer Science"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center">
            <BriefcaseIcon className="w-4 h-4 mr-2 text-muted-foreground" />
            <Label htmlFor="profession">Job Title/Role</Label>
          </div>
          <Input 
            id="profession" 
            value={profileData.profession} 
            onChange={(e) => handleChange('profession', e.target.value)}
            placeholder="e.g. Software Engineer"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center">
            <MapPinIcon className="w-4 h-4 mr-2 text-muted-foreground" />
            <Label htmlFor="state">State/Location</Label>
          </div>
          <Input 
            id="state" 
            value={profileData.state} 
            onChange={(e) => handleChange('state', e.target.value)}
            placeholder="e.g. California"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center">
            <GraduationCapIcon className="w-4 h-4 mr-2 text-muted-foreground" />
            <Label htmlFor="classes">Current Classes</Label>
          </div>
          <Textarea 
            id="classes" 
            value={Array.isArray(profileData.classes) ? profileData.classes.join(', ') : profileData.classes} 
            onChange={(e) => handleChange('classes', e.target.value)}
            placeholder="Enter classes separated by commas"
            className="min-h-[80px]"
          />
        </div>
      </div>
    </div>
  );
};
