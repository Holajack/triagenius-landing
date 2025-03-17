import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import NavigationBar from "@/components/dashboard/NavigationBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle2, Settings, Moon, Sun, Clock, Palette, Clock3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import { StudyEnvironment, WorkStyle } from "@/types/onboarding";
import { supabase } from "@/integrations/supabase/client";
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

const Profile = () => {
  const { theme, toggleTheme } = useTheme();
  const { state, dispatch } = useOnboarding();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEnvDialogOpen, setIsEnvDialogOpen] = useState(false);
  const [isWorkStyleDialogOpen, setIsWorkStyleDialogOpen] = useState(false);
  const [tempFocusGoal, setTempFocusGoal] = useState(state.weeklyFocusGoal || 10);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  
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
              <AvatarImage src="/placeholder.svg" alt="Profile" />
              <AvatarFallback>US</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">User Name</h3>
              <p className="text-sm text-muted-foreground">user@example.com</p>
            </div>
          </div>
          <Button variant="outline" className="w-full">Edit Profile</Button>
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
