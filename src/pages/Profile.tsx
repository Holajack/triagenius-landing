import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import NavigationBar from "@/components/dashboard/NavigationBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  UserCircle2, Settings, Moon, Sun, Clock, Palette, Clock3, LogOut, 
  Briefcase, GraduationCap, MapPin, BookOpen, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import { StudyEnvironment, WorkStyle } from "@/types/onboarding";
import { supabase } from "@/integrations/supabase/client";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface ExtendedProfileData {
  university?: string | null;
  major?: string | null;
  business?: string | null;
  profession?: string | null;
  state?: string | null;
  classes?: string[] | null;
  show_university?: boolean;
  show_business?: boolean;
  show_state?: boolean;
  show_classes?: boolean;
}

const Profile = () => {
  const { theme, toggleTheme } = useTheme();
  const { state, dispatch } = useOnboarding();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEnvDialogOpen, setIsEnvDialogOpen] = useState(false);
  const [isWorkStyleDialogOpen, setIsWorkStyleDialogOpen] = useState(false);
  const [tempFocusGoal, setTempFocusGoal] = useState(state.weeklyFocusGoal || 10);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isExtendedProfileOpen, setIsExtendedProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    avatarUrl: "",
  });
  const [extendedProfileData, setExtendedProfileData] = useState<ExtendedProfileData>({
    university: null,
    major: null,
    business: null,
    profession: null,
    state: null,
    classes: null,
    show_university: true,
    show_business: true,
    show_state: true,
    show_classes: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const extendedProfileForm = useForm<ExtendedProfileData>({
    resolver: zodResolver(
      z.object({
        university: z.string().nullable().optional(),
        major: z.string().nullable().optional(),
        business: z.string().nullable().optional(),
        profession: z.string().nullable().optional(),
        state: z.string().nullable().optional(),
        classes: z.array(z.string()).nullable().optional(),
        show_university: z.boolean().default(true),
        show_business: z.boolean().default(true),
        show_state: z.boolean().default(true),
        show_classes: z.boolean().default(true),
      })
    ),
    defaultValues: {
      university: "",
      major: "",
      business: "",
      profession: "",
      state: "",
      classes: [],
      show_university: true,
      show_business: true,
      show_state: true,
      show_classes: true,
    }
  });
  
  useEffect(() => {
    extendedProfileForm.reset({
      university: extendedProfileData.university || "",
      major: extendedProfileData.major || "",
      business: extendedProfileData.business || "",
      profession: extendedProfileData.profession || "",
      state: extendedProfileData.state || "",
      classes: extendedProfileData.classes || [],
      show_university: extendedProfileData.show_university ?? true,
      show_business: extendedProfileData.show_business ?? true,
      show_state: extendedProfileData.show_state ?? true,
      show_classes: extendedProfileData.show_classes ?? true,
    });
  }, [extendedProfileData, extendedProfileForm]);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Fetch profile data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, email, avatar_url, university, major, business, profession, state, classes, show_university, show_business, show_state, show_classes')
            .eq('id', user.id)
            .single();
            
          if (profileError) {
            throw profileError;
          }
          
          setProfileData({
            username: profileData?.username || user.email?.split('@')[0] || 'User',
            email: profileData?.email || user.email || '',
            avatarUrl: profileData?.avatar_url || '',
          });
          
          setExtendedProfileData({
            university: profileData?.university || null,
            major: profileData?.major || null,
            business: profileData?.business || null,
            profession: profileData?.profession || null,
            state: profileData?.state || null,
            classes: profileData?.classes || null,
            show_university: profileData?.show_university ?? true,
            show_business: profileData?.show_business ?? true,
            show_state: profileData?.show_state ?? true,
            show_classes: profileData?.show_classes ?? true,
          });
        } else {
          navigate('/auth');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [navigate]);
  
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error("Failed to log out", {
          description: error.message
        });
        return;
      }
      
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("An error occurred during logout");
      console.error("Logout error:", error);
    }
  };

  const handleSaveFocusGoal = () => {
    dispatch({ type: 'SET_WEEKLY_FOCUS_GOAL', payload: tempFocusGoal });
    setIsDialogOpen(false);
    toast.success("Weekly focus goal updated successfully", {
      description: `Your weekly focus goal is now set to ${tempFocusGoal} hours`
    });
  };

  const adjustFocusGoal = (adjustment: number) => {
    const newValue = tempFocusGoal + adjustment;
    if (newValue >= 1 && newValue <= 40) {
      setTempFocusGoal(newValue);
    }
  };

  const handleSelectEnvironment = (environment: StudyEnvironment) => {
    dispatch({ type: 'SET_ENVIRONMENT', payload: environment });
    setIsEnvDialogOpen(false);
    toast.success("Environment updated successfully", {
      description: `Your study environment has been updated to ${formatName(environment)}`
    });
  };

  const handleSelectWorkStyle = (workStyle: WorkStyle) => {
    dispatch({ type: 'SET_WORK_STYLE', payload: workStyle });
    setIsWorkStyleDialogOpen(false);
    toast.success("Work style updated successfully", {
      description: `Your work style has been updated to ${formatName(workStyle)}`
    });
  };

  const formatName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ');
  };

  const getAvatarFallback = () => {
    if (!profileData.username) return "U";
    return profileData.username.substring(0, 2).toUpperCase();
  };
  
  const handleProfileUpdated = () => {
    // Refresh profile data
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, email, avatar_url, university, major, business, profession, state, classes, show_university, show_business, show_state, show_classes')
            .eq('id', user.id)
            .single();
            
          if (profileError) {
            throw profileError;
          }
          
          setProfileData({
            username: profileData?.username || user.email?.split('@')[0] || 'User',
            email: profileData?.email || user.email || '',
            avatarUrl: profileData?.avatar_url || '',
          });
          
          setExtendedProfileData({
            university: profileData?.university || null,
            major: profileData?.major || null,
            business: profileData?.business || null,
            profession: profileData?.profession || null,
            state: profileData?.state || null,
            classes: profileData?.classes || null,
            show_university: profileData?.show_university ?? true,
            show_business: profileData?.show_business ?? true,
            show_state: profileData?.show_state ?? true,
            show_classes: profileData?.show_classes ?? true,
          });
        }
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    };
    
    fetchUserProfile();
  };
  
  const handleExtendedProfileSubmit = async (data: ExtendedProfileData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to update your profile");
        return;
      }
      
      // Process classes - split by comma and trim
      let classes = null;
      if (typeof data.classes === 'string' && data.classes.trim()) {
        classes = data.classes.split(',').map(c => c.trim()).filter(Boolean);
      } else if (Array.isArray(data.classes) && data.classes.length > 0) {
        classes = data.classes;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          university: data.university || null,
          major: data.major || null,
          business: data.business || null,
          profession: data.profession || null,
          state: data.state || null,
          classes: classes,
          show_university: data.show_university,
          show_business: data.show_business,
          show_state: data.show_state,
          show_classes: data.show_classes
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast.success("Profile information updated successfully");
      setIsExtendedProfileOpen(false);
      handleProfileUpdated();
    } catch (error) {
      console.error('Error updating extended profile:', error);
      toast.error("Failed to update profile information");
    }
  };

  const environments: Array<{id: StudyEnvironment; title: string; icon: JSX.Element}> = [
    { id: 'office', title: 'Office', icon: <Palette className="h-5 w-5 text-blue-600" /> },
    { id: 'park', title: 'Nature', icon: <Palette className="h-5 w-5 text-green-600" /> },
    { id: 'home', title: 'Home', icon: <Palette className="h-5 w-5 text-amber-600" /> },
    { id: 'coffee-shop', title: 'Coffee Shop', icon: <Palette className="h-5 w-5 text-amber-500" /> },
    { id: 'library', title: 'Library', icon: <Palette className="h-5 w-5 text-gray-600" /> },
  ];

  const workStyles: Array<{id: WorkStyle; title: string; icon: JSX.Element}> = [
    { id: 'pomodoro', title: 'Sprints', icon: <Clock3 className="h-5 w-5 text-triage-purple" /> },
    { id: 'balanced', title: 'Balanced', icon: <Clock3 className="h-5 w-5 rotate-90 text-triage-purple" /> },
    { id: 'deep-work', title: 'Deep Work', icon: <Clock3 className="h-5 w-5 rotate-180 text-triage-purple" /> },
  ];

  if (isLoading) {
    return (
      <div className="container max-w-md mx-auto px-4 pb-20 pt-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-triage-purple"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto px-4 pb-20">
      <PageHeader title="Your Profile" subtitle="Manage your account settings" />

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <UserCircle2 className="h-5 w-5 mr-2 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profileData.avatarUrl || "/placeholder.svg"} alt="Profile" />
              <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{profileData.username}</h3>
              <p className="text-sm text-muted-foreground">{profileData.email}</p>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            {extendedProfileData.university && (
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">
                  {extendedProfileData.university}
                  {extendedProfileData.major && `, ${extendedProfileData.major}`}
                  {!extendedProfileData.show_university && (
                    <span className="ml-2 text-xs text-muted-foreground flex items-center">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Private
                    </span>
                  )}
                </p>
              </div>
            )}
            
            {extendedProfileData.business && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">
                  {extendedProfileData.business}
                  {extendedProfileData.profession && `, ${extendedProfileData.profession}`}
                  {!extendedProfileData.show_business && (
                    <span className="ml-2 text-xs text-muted-foreground flex items-center">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Private
                    </span>
                  )}
                </p>
              </div>
            )}
            
            {extendedProfileData.state && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">
                  {extendedProfileData.state}
                  {!extendedProfileData.show_state && (
                    <span className="ml-2 text-xs text-muted-foreground flex items-center">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Private
                    </span>
                  )}
                </p>
              </div>
            )}
            
            {extendedProfileData.classes && extendedProfileData.classes.length > 0 && (
              <div className="flex items-start gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm flex items-center">
                    Classes
                    {!extendedProfileData.show_classes && (
                      <span className="ml-2 text-xs text-muted-foreground flex items-center">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Private
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {extendedProfileData.classes.join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsEditProfileOpen(true)}
            >
              Edit Profile
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsExtendedProfileOpen(true)}
            >
              Edit Educational & Professional Info
            </Button>
          </div>
          
          <EditProfileDialog 
            open={isEditProfileOpen} 
            onOpenChange={setIsEditProfileOpen} 
            onProfileUpdated={handleProfileUpdated}
            initialData={profileData}
          />
          
          <Dialog open={isExtendedProfileOpen} onOpenChange={setIsExtendedProfileOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Profile Information</DialogTitle>
              </DialogHeader>
              
              <Form {...extendedProfileForm}>
                <form onSubmit={extendedProfileForm.handleSubmit(handleExtendedProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium flex items-center">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Education
                      </h3>
                      
                      <FormField
                        control={extendedProfileForm.control}
                        name="university"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-center">
                              <FormLabel>University</FormLabel>
                              <FormField
                                control={extendedProfileForm.control}
                                name="show_university"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                      <div className="flex items-center space-x-2">
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                        <span className="text-xs text-muted-foreground">{field.value ? 'Public' : 'Private'}</span>
                                      </div>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="e.g. Stanford University" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={extendedProfileForm.control}
                        name="major"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field of Study / Major</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="e.g. Computer Science" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={extendedProfileForm.control}
                        name="classes"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-center">
                              <FormLabel>Classes</FormLabel>
                              <FormField
                                control={extendedProfileForm.control}
                                name="show_classes"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                      <div className="flex items-center space-x-2">
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                        <span className="text-xs text-muted-foreground">{field.value ? 'Public' : 'Private'}</span>
                                      </div>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                }}
                                placeholder="e.g. Math 101, Physics 202 (comma separated)"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium flex items-center">
                        <Briefcase className="h-4 w-4 mr-2" />
                        Professional
                      </h3>
                      
                      <FormField
                        control={extendedProfileForm.control}
                        name="business"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-center">
                              <FormLabel>Company / Business</FormLabel>
                              <FormField
                                control={extendedProfileForm.control}
                                name="show_business"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                      <div className="flex items-center space-x-2">
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                        <span className="text-xs text-muted-foreground">{field.value ? 'Public' : 'Private'}</span>
                                      </div>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="e.g. Google" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={extendedProfileForm.control}
                        name="profession"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title / Role</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="e.g. Software Engineer" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={extendedProfileForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-center">
                              <FormLabel>State</FormLabel>
                              <FormField
                                control={extendedProfileForm.control}
                                name="show_state"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                      <div className="flex items-center space-x-2">
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                        <span className="text-xs text-muted-foreground">{field.value ? 'Public' : 'Private'}</span>
                                      </div>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="e.g. California" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full">Save Information</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Settings className="h-5 w-5 mr-2 text-primary" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">Toggle light and dark mode</p>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleTheme}
                className="h-9 w-9"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Focus Goal</p>
                <p className="text-sm text-muted-foreground">Your target study hours per week</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-9">
                    <Clock className="h-4 w-4 mr-2" />
                    {state.weeklyFocusGoal || 10} hours
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set Weekly Focus Goal</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Hours per week</label>
                        <div className="flex items-center gap-4 mt-2">
                          <Slider
                            value={[tempFocusGoal]}
                            min={1}
                            max={40}
                            step={1}
                            onValueChange={(value) => setTempFocusGoal(value[0])}
                            className="flex-1"
                          />
                          <div className="flex items-center">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-r-none"
                              onClick={() => adjustFocusGoal(-1)}
                              disabled={tempFocusGoal <= 1}
                            >
                              -
                            </Button>
                            <Input 
                              type="number" 
                              value={tempFocusGoal} 
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (value >= 1 && value <= 40) {
                                  setTempFocusGoal(value);
                                }
                              }}
                              className="w-14 rounded-none text-center" 
                              min={1}
                              max={40}
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-l-none"
                              onClick={() => adjustFocusGoal(1)}
                              disabled={tempFocusGoal >= 40}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Setting a realistic goal helps you stay consistent. The recommended range is 5-15 hours per week.
                      </p>
                    </div>
                    <Button onClick={handleSaveFocusGoal} className="w-full">
                      Save Goal
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Environment</p>
                <p className="text-sm text-muted-foreground">Your study environment theme</p>
              </div>
              <Dialog open={isEnvDialogOpen} onOpenChange={setIsEnvDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-9">
                    <Palette className="h-4 w-4 mr-2" />
                    {state.environment ? formatName(state.environment) : 'Not set'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Choose Environment</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="space-y-3">
                      {environments.map((env) => (
                        <div 
                          key={env.id}
                          className={`flex items-center p-3 rounded-md cursor-pointer hover:bg-muted transition-colors ${
                            state.environment === env.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => handleSelectEnvironment(env.id)}
                        >
                          <div className="mr-3">{env.icon}</div>
                          <span className="font-medium">{env.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Work Style</p>
                <p className="text-sm text-muted-foreground">Your preferred work method</p>
              </div>
              <Dialog open={isWorkStyleDialogOpen} onOpenChange={setIsWorkStyleDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-9">
                    <Clock3 className="h-4 w-4 mr-2" />
                    {state.workStyle ? formatName(state.workStyle) : 'Not set'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Choose Work Style</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="space-y-3">
                      {workStyles.map((style) => (
                        <div 
                          key={style.id}
                          className={`flex items-center p-3 rounded-md cursor-pointer hover:bg-muted transition-colors ${
                            state.workStyle === style.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => handleSelectWorkStyle(style.id)}
                        >
                          <div className="mr-3">{style.icon}</div>
                          <span className="font-medium">{style.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Separator />

            <div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/settings")}
              >
                Advanced Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => setIsLogoutDialogOpen(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
            
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will need to sign in again to access your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>Log Out</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <NavigationBar />
    </div>
  );
};

export default Profile;
