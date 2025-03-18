
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import NavigationBar from "@/components/dashboard/NavigationBar";
import { BellIcon, EyeIcon, MoonIcon, VolumeIcon, Info, ShieldAlert } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDevicePermissions } from "@/hooks/use-device-permissions";
import { Button } from "@/components/ui/button";

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

  const isMobile = useIsMobile();
  const isPwa = localStorage.getItem('isPWA') === 'true';
  
  // Use our new device permissions hook
  const { permissionStatus, requestPermission, applyDeviceSetting } = useDevicePermissions();
  
  // Load saved settings from localStorage on initial render
  useEffect(() => {
    // Load saved settings from localStorage
    const loadSavedSettings = () => {
      const settings = [
        { key: 'notificationsEnabled', setter: setNotificationsEnabled },
        { key: 'sessionCompletionNotifications', setter: setSessionCompletionNotifications },
        { key: 'breakReminderNotifications', setter: setBreakReminderNotifications },
        { key: 'friendRequestNotifications', setter: setFriendRequestNotifications },
        { key: 'messageNotifications', setter: setMessageNotifications },
        { key: 'dndEnabled', setter: setDndEnabled },
        { key: 'dndDuringFocus', setter: setDndDuringFocus },
        { key: 'dndDuringBreaks', setter: setDndDuringBreaks },
        { key: 'darkModeEnabled', setter: setDarkModeEnabled },
        { key: 'highContrastMode', setter: setHighContrastMode },
        { key: 'reducedAnimations', setter: setReducedAnimations },
        { key: 'soundEnabled', setter: setSoundEnabled },
        { key: 'focusSounds', setter: setFocusSounds },
      ];
      
      settings.forEach(({ key, setter }) => {
        const savedValue = localStorage.getItem(`setting_${key}`);
        if (savedValue !== null) {
          try {
            setter(JSON.parse(savedValue));
          } catch (e) {
            console.error(`Error parsing saved setting for ${key}:`, e);
          }
        }
      });
      
      const savedVolume = localStorage.getItem('setting_volume');
      if (savedVolume) {
        try {
          setVolume(JSON.parse(savedVolume));
        } catch (e) {
          console.error('Error parsing saved volume setting:', e);
        }
      }
    };
    
    loadSavedSettings();
  }, []);

  // Request permission and apply device setting
  const handleSettingChange = async (
    setting: string, 
    value: boolean | string,
    updateFunction: (value: any) => void,
    permissionType?: 'notification' | 'dnd' | 'display' | 'audio'
  ) => {
    // Update app's internal setting state
    updateFunction(value);
    
    // Save to local storage
    localStorage.setItem(`setting_${setting}`, JSON.stringify(value));
    
    // Handle device permissions and settings if we're in a PWA and it's a boolean setting
    if (typeof value === 'boolean' && permissionType && isPwa) {
      if (value === true) {
        // We're enabling a setting that needs permission
        const success = await applyDeviceSetting(permissionType, true);
        
        if (success) {
          toast.success(`Updated ${setting} setting and applied to device`);
        } else {
          toast.error(`Couldn't apply ${setting} to device`, {
            description: "Permission denied or feature not supported on this device",
            action: {
              label: "Retry",
              onClick: () => requestPermission(permissionType)
            }
          });
        }
      } else {
        // We're disabling a setting
        await applyDeviceSetting(permissionType, false);
        toast.success(`Updated ${setting} setting`);
      }
    } else {
      // Regular setting update (no permission needed)
      toast.success(`Updated ${setting} setting`);
    }
  };

  // Handle manual permission request
  const handleRequestPermission = async (type: 'notification' | 'dnd' | 'display' | 'audio') => {
    const granted = await requestPermission(type);
    
    if (granted) {
      toast.success(`${type} permission granted`, {
        description: "You can now enable related features"
      });
    } else {
      toast.error(`${type} permission denied`, {
        description: "Please enable in your device settings to use this feature"
      });
    }
  };
  
  return (
    <div className="container max-w-4xl px-3 sm:px-6 pb-24">
      <div className="space-y-4 pb-4 pt-2">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your app preferences and permissions
        </p>
        
        {isPwa && (
          <Alert variant="default" className="bg-primary/10 border-0">
            <Info className="h-4 w-4" />
            <AlertDescription>
              This app will request device permissions when enabling certain settings to provide the best experience on your device.
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <Tabs defaultValue="notifications" className="mb-24">
        <TabsList className="mb-4 flex w-full overflow-x-auto pb-1">
          <TabsTrigger value="notifications" className="flex-1 min-w-[100px]">Notifications</TabsTrigger>
          <TabsTrigger value="dnd" className="flex-1 min-w-[100px]">Do Not Disturb</TabsTrigger>
          <TabsTrigger value="display" className="flex-1 min-w-[100px]">Display</TabsTrigger>
          <TabsTrigger value="sound" className="flex-1 min-w-[100px]">Sound</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BellIcon className="h-5 w-5 text-primary" />
                <CardTitle>Notification Settings</CardTitle>
              </div>
              <CardDescription>
                Control how and when you receive notifications
                {isPwa && (
                  <span className="block mt-1 text-xs">
                    {permissionStatus.notifications === 'granted' ? 
                      "✓ Permission granted" : 
                      permissionStatus.notifications === 'denied' ?
                      "⚠️ Permission blocked in device settings" :
                      "⚠️ Permission required to enable notifications"}
                  </span>
                )}
              </CardDescription>
              {isPwa && permissionStatus.notifications !== 'granted' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleRequestPermission('notification')}
                >
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Request Notification Permission
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
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
                    handleSettingChange("notificationsEnabled", checked, setNotificationsEnabled, "notification")
                  }
                  disabled={isPwa && permissionStatus.notifications === 'denied'}
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
                      handleSettingChange("sessionCompletionNotifications", checked, setSessionCompletionNotifications, "notification")
                    }
                    disabled={!notificationsEnabled || (isPwa && permissionStatus.notifications === 'denied')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Break Reminders</p>
                  </div>
                  <Switch 
                    checked={breakReminderNotifications}
                    onCheckedChange={(checked) => 
                      handleSettingChange("breakReminderNotifications", checked, setBreakReminderNotifications, "notification")
                    }
                    disabled={!notificationsEnabled || (isPwa && permissionStatus.notifications === 'denied')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Friend Requests</p>
                  </div>
                  <Switch 
                    checked={friendRequestNotifications}
                    onCheckedChange={(checked) => 
                      handleSettingChange("friendRequestNotifications", checked, setFriendRequestNotifications, "notification")
                    }
                    disabled={!notificationsEnabled || (isPwa && permissionStatus.notifications === 'denied')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Messages</p>
                  </div>
                  <Switch 
                    checked={messageNotifications}
                    onCheckedChange={(checked) => 
                      handleSettingChange("messageNotifications", checked, setMessageNotifications, "notification")
                    }
                    disabled={!notificationsEnabled || (isPwa && permissionStatus.notifications === 'denied')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dnd" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MoonIcon className="h-5 w-5 text-primary" />
                <CardTitle>Do Not Disturb</CardTitle>
              </div>
              <CardDescription>
                Control when notifications are silenced
                {isPwa && (
                  <span className="block mt-1 text-xs">
                    {permissionStatus.dnd === 'granted' ? 
                      "✓ Permission granted" : 
                      permissionStatus.dnd === 'denied' ?
                      "⚠️ Permission blocked in device settings" :
                      "⚠️ Permission required to control Do Not Disturb"}
                  </span>
                )}
              </CardDescription>
              {isPwa && permissionStatus.dnd !== 'granted' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleRequestPermission('dnd')}
                >
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Request DND Permission
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
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
                    handleSettingChange("dndEnabled", checked, setDndEnabled, "dnd")
                  }
                  disabled={isPwa && permissionStatus.dnd === 'denied'}
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
                      handleSettingChange("dndDuringFocus", checked, setDndDuringFocus, "dnd")
                    }
                    disabled={isPwa && permissionStatus.dnd === 'denied'}
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
                      handleSettingChange("dndDuringBreaks", checked, setDndDuringBreaks, "dnd")
                    }
                    disabled={isPwa && permissionStatus.dnd === 'denied'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="display" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <EyeIcon className="h-5 w-5 text-primary" />
                <CardTitle>Display Settings</CardTitle>
              </div>
              <CardDescription>
                Customize how the app looks
                {isPwa && (
                  <span className="block mt-1 text-xs">
                    {permissionStatus.display === 'granted' ? 
                      "✓ Permission granted" : 
                      permissionStatus.display === 'denied' ?
                      "⚠️ Permission blocked in device settings" :
                      "⚠️ Some settings may require device permissions"}
                  </span>
                )}
              </CardDescription>
              {isPwa && permissionStatus.display !== 'granted' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleRequestPermission('display')}
                >
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Request Display Permission
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
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
                    handleSettingChange("darkModeEnabled", checked, setDarkModeEnabled, "display")
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
                    handleSettingChange("highContrastMode", checked, setHighContrastMode, "display")
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
                    handleSettingChange("reducedAnimations", checked, setReducedAnimations, "display")
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sound" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <VolumeIcon className="h-5 w-5 text-primary" />
                <CardTitle>Sound Settings</CardTitle>
              </div>
              <CardDescription>
                Configure audio preferences
                {isPwa && (
                  <span className="block mt-1 text-xs">
                    {permissionStatus.audio === 'granted' ? 
                      "✓ Permission granted" : 
                      permissionStatus.audio === 'denied' ?
                      "⚠️ Permission blocked in device settings" :
                      "⚠️ Some settings may require audio permissions"}
                  </span>
                )}
              </CardDescription>
              {isPwa && permissionStatus.audio !== 'granted' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleRequestPermission('audio')}
                >
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Request Audio Permission
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
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
                    handleSettingChange("soundEnabled", checked, setSoundEnabled, "audio")
                  }
                  disabled={isPwa && permissionStatus.audio === 'denied'}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-medium">Volume Level</h4>
                <RadioGroup 
                  value={volume} 
                  onValueChange={(value) => 
                    handleSettingChange("volume", value, setVolume, "audio")
                  }
                  disabled={!soundEnabled || (isPwa && permissionStatus.audio === 'denied')}
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
                    handleSettingChange("focusSounds", checked, setFocusSounds, "audio")
                  }
                  disabled={!soundEnabled || (isPwa && permissionStatus.audio === 'denied')}
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
