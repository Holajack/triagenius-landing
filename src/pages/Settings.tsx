
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import NavigationBar from "@/components/dashboard/NavigationBar";
import { BellIcon, EyeIcon, MoonIcon, VolumeIcon } from "lucide-react";

const Settings = () => {
  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [sessionCompletionNotifications, setSessionCompletionNotifications] = useState(true);
  const [breakReminderNotifications, setBreakReminderNotifications] = useState(true);
  const [friendRequestNotifications, setFriendRequestNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  
  // Do Not Disturb settings
  const [dndEnabled, setDndEnabled] = useState(false);
  const [dndDuringFocus, setDndDuringFocus] = useState(true);
  const [dndDuringBreaks, setDndDuringBreaks] = useState(false);
  
  // Display settings
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [reducedAnimations, setReducedAnimations] = useState(false);
  
  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState("medium"); // low, medium, high
  const [focusSounds, setFocusSounds] = useState(true);
  
  const handleSettingChange = (
    setting: string, 
    value: boolean | string,
    updateFunction: (value: any) => void
  ) => {
    // Call the update function with the new value
    updateFunction(value);
    
    // Save to local storage (could be extended to save to database)
    localStorage.setItem(`setting_${setting}`, JSON.stringify(value));
    
    // Show success notification
    toast.success(`Updated ${setting} setting`);
  };
  
  return (
    <div className="container max-w-4xl pb-24">
      <div className="space-y-6 pb-6 pt-2">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your app preferences and permissions
        </p>
      </div>
      
      <Tabs defaultValue="notifications" className="mb-24">
        <TabsList className="mb-6">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="dnd">Do Not Disturb</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="sound">Sound</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BellIcon className="h-5 w-5 text-primary" />
                <CardTitle>Notification Settings</CardTitle>
              </div>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Enable Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Allow the app to send you notifications
                  </p>
                </div>
                <Switch 
                  checked={notificationsEnabled}
                  onCheckedChange={(checked) => 
                    handleSettingChange("notificationsEnabled", checked, setNotificationsEnabled)
                  }
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Notification Types</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Session Completion</p>
                  </div>
                  <Switch 
                    checked={sessionCompletionNotifications}
                    onCheckedChange={(checked) => 
                      handleSettingChange("sessionCompletionNotifications", checked, setSessionCompletionNotifications)
                    }
                    disabled={!notificationsEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Break Reminders</p>
                  </div>
                  <Switch 
                    checked={breakReminderNotifications}
                    onCheckedChange={(checked) => 
                      handleSettingChange("breakReminderNotifications", checked, setBreakReminderNotifications)
                    }
                    disabled={!notificationsEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Friend Requests</p>
                  </div>
                  <Switch 
                    checked={friendRequestNotifications}
                    onCheckedChange={(checked) => 
                      handleSettingChange("friendRequestNotifications", checked, setFriendRequestNotifications)
                    }
                    disabled={!notificationsEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Messages</p>
                  </div>
                  <Switch 
                    checked={messageNotifications}
                    onCheckedChange={(checked) => 
                      handleSettingChange("messageNotifications", checked, setMessageNotifications)
                    }
                    disabled={!notificationsEnabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dnd" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MoonIcon className="h-5 w-5 text-primary" />
                <CardTitle>Do Not Disturb</CardTitle>
              </div>
              <CardDescription>
                Control when notifications are silenced
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Enable Do Not Disturb</h4>
                  <p className="text-sm text-muted-foreground">
                    Silence all notifications
                  </p>
                </div>
                <Switch 
                  checked={dndEnabled}
                  onCheckedChange={(checked) => 
                    handleSettingChange("dndEnabled", checked, setDndEnabled)
                  }
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Automatic DND</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">During Focus Sessions</p>
                    <p className="text-xs text-muted-foreground">Automatically enable DND when focusing</p>
                  </div>
                  <Switch 
                    checked={dndDuringFocus}
                    onCheckedChange={(checked) => 
                      handleSettingChange("dndDuringFocus", checked, setDndDuringFocus)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">During Breaks</p>
                    <p className="text-xs text-muted-foreground">Automatically enable DND during break times</p>
                  </div>
                  <Switch 
                    checked={dndDuringBreaks}
                    onCheckedChange={(checked) => 
                      handleSettingChange("dndDuringBreaks", checked, setDndDuringBreaks)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <EyeIcon className="h-5 w-5 text-primary" />
                <CardTitle>Display Settings</CardTitle>
              </div>
              <CardDescription>
                Customize how the app looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Dark Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <Switch 
                  checked={darkModeEnabled}
                  onCheckedChange={(checked) => 
                    handleSettingChange("darkModeEnabled", checked, setDarkModeEnabled)
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">High Contrast Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    Increase contrast for better visibility
                  </p>
                </div>
                <Switch 
                  checked={highContrastMode}
                  onCheckedChange={(checked) => 
                    handleSettingChange("highContrastMode", checked, setHighContrastMode)
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Reduced Animations</h4>
                  <p className="text-sm text-muted-foreground">
                    Minimize motion effects
                  </p>
                </div>
                <Switch 
                  checked={reducedAnimations}
                  onCheckedChange={(checked) => 
                    handleSettingChange("reducedAnimations", checked, setReducedAnimations)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sound" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <VolumeIcon className="h-5 w-5 text-primary" />
                <CardTitle>Sound Settings</CardTitle>
              </div>
              <CardDescription>
                Configure audio preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Enable Sounds</h4>
                  <p className="text-sm text-muted-foreground">
                    Play sound effects and alerts
                  </p>
                </div>
                <Switch 
                  checked={soundEnabled}
                  onCheckedChange={(checked) => 
                    handleSettingChange("soundEnabled", checked, setSoundEnabled)
                  }
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-medium">Volume Level</h4>
                <RadioGroup 
                  value={volume} 
                  onValueChange={(value) => 
                    handleSettingChange("volume", value, setVolume)
                  }
                  disabled={!soundEnabled}
                  className="flex flex-row space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low">Low</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high">High</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Focus Sounds</h4>
                  <p className="text-sm text-muted-foreground">
                    Play ambient sounds during focus sessions
                  </p>
                </div>
                <Switch 
                  checked={focusSounds}
                  onCheckedChange={(checked) => 
                    handleSettingChange("focusSounds", checked, setFocusSounds)
                  }
                  disabled={!soundEnabled}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <NavigationBar />
    </div>
  );
};

export default Settings;
