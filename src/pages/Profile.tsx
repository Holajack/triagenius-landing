
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import NavigationBar from "@/components/dashboard/NavigationBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle2, Settings, Moon, Sun, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import PageHeader from "@/components/common/PageHeader";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Profile = () => {
  const { theme, toggleTheme } = useTheme();
  const { state, dispatch } = useOnboarding();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempFocusGoal, setTempFocusGoal] = useState(state.weeklyFocusGoal || 10);

  const handleSaveFocusGoal = () => {
    dispatch({ type: 'SET_WEEKLY_FOCUS_GOAL', payload: tempFocusGoal });
    setIsDialogOpen(false);
    toast.success("Weekly focus goal updated successfully", {
      description: `Your weekly focus goal is now set to ${tempFocusGoal} hours`
    });
  };

  // This function allows for incremental adjustments in 1-hour steps
  const adjustFocusGoal = (adjustment: number) => {
    const newValue = tempFocusGoal + adjustment;
    if (newValue >= 1 && newValue <= 40) {
      setTempFocusGoal(newValue);
    }
  };

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
            
            <Separator />
            
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
                        <FormLabel>Hours per week</FormLabel>
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
            
            <div>
              <p className="font-medium">Study Environment</p>
              <p className="text-sm text-muted-foreground mb-2">Your current environment</p>
              <div className="bg-muted px-3 py-2 rounded-md text-sm">
                {state.environment ? state.environment.charAt(0).toUpperCase() + state.environment.slice(1).replace('-', ' ') : 'Not set'}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <p className="font-medium">Work Style</p>
              <p className="text-sm text-muted-foreground mb-2">Your preferred work method</p>
              <div className="bg-muted px-3 py-2 rounded-md text-sm">
                {state.workStyle ? state.workStyle.charAt(0).toUpperCase() + state.workStyle.slice(1).replace('-', ' ') : 'Not set'}
              </div>
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

      <NavigationBar />
    </div>
  );
};

export default Profile;
