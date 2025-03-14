
import { useTheme } from "@/contexts/ThemeContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import NavigationBar from "@/components/dashboard/NavigationBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle2, Settings, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/common/PageHeader";

const Profile = () => {
  const { theme, toggleTheme } = useTheme();
  const { state } = useOnboarding();

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
          </div>
        </CardContent>
      </Card>

      <NavigationBar />
    </div>
  );
};

export default Profile;
