
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import NavigationBar from "@/components/dashboard/NavigationBar";
import { BellIcon, EyeIcon, MoonIcon, VolumeIcon, Info } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  
  // Check for existing permissions
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  
  useEffect(() => {
    // Check if we have notification permission
    if ('Notification' in window) {
      setHasNotificationPermission(Notification.permission === 'granted');
    }
    
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
  
  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error("Notifications are not supported by your browser");
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setHasNotificationPermission(permission === 'granted');
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error("Failed to request notification permission");
      return false;
    }
  };

  // Request Do Not Disturb permission (Not available in all browsers)
  const requestDNDPermission = async () => {
    // This is only available in some browsers/devices
    // For this example, we'll simulate requesting it
    if ('permissions' in navigator && 'query' in navigator.permissions) {
      try {
        // Request audio output permissions as a proxy for DND
        await requestPermission('notifications');
        return true;
      } catch (error) {
        console.error('Error requesting DND permission:', error);
        toast.error("Your device doesn't support Do Not Disturb control");
        return false;
      }
    } else {
      toast.error("Your device doesn't support Do Not Disturb control");
      return false;
    }
  };
  
  // Request display settings permission
  const requestDisplayPermission = async () => {
    // This is a simulated permission since browser APIs don't directly control system display
    if ('permissions' in navigator && 'query' in navigator.permissions) {
      try {
        // Request wake lock as a proxy for display settings
        await requestPermission('screen-wake-lock');
        return true;
      } catch (error) {
        console.error('Error requesting display permission:', error);
        toast.error("Your device doesn't support display setting control");
        return false;
      }
    } else {
      toast.error("Your device doesn't support display setting control");
      return false;
    }
  };
  
  // Request audio permission
  const requestAudioPermission = async () => {
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
      try {
        // Request microphone access as a proxy for audio settings
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop all tracks immediately after getting permission
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch (error) {
        console.error('Error requesting audio permission:', error);
        toast.error("Failed to get audio permissions");
        return false;
      }
    } else {
      toast.error("Your device doesn't support audio control");
      return false;
    }
  };
  
  // Generic permission request helper
  const requestPermission = async (permissionName: PermissionName) => {
    if ('permissions' in navigator && 'query' in navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: permissionName });
        
        if (result.state === 'granted') {
          return true;
        } else if (result.state === 'prompt') {
          // This will trigger the permission prompt
          return false;
        } else {
          toast.error(`Permission for ${permissionName} was denied`);
          return false;
        }
      } catch (error) {
        console.error(`Error checking ${permissionName} permission:`, error);
        return false;
      }
    }
    return false;
  };
  
  const handleSettingChange = async (
    setting: string, 
    value: boolean | string,
    updateFunction: (value: any) => void,
    permissionType?: 'notification' | 'dnd' | 'display' | 'audio'
  ) => {
    // Request appropriate permission if needed
    let permissionGranted = true;
    
    if (value === true && permissionType && isPwa) {
      switch (permissionType) {
        case 'notification':
          permissionGranted = await requestNotificationPermission();
          break;
        case 'dnd':
          permissionGranted = await requestDNDPermission();
          break;
        case 'display':
          permissionGranted = await requestDisplayPermission();
          break;
        case 'audio':
          permissionGranted = await requestAudioPermission();
          break;
      }
    }
    
    // Only update if permission was granted or if turning off the setting
    if (permissionGranted || value === false) {
      // Call the update function with the new value
      updateFunction(value);
      
      // Save to local storage
      localStorage.setItem(`setting_${setting}`, JSON.stringify(value));
      
      // Show success notification
      toast.success(`Updated ${setting} setting`);
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
                    {hasNotificationPermission ? 
                      "✓ Permission granted" : 
                      "⚠️ Permission required to enable notifications"}
                  </span>
                )}
              </CardDescription>
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
                      handleSettingChange("breakReminderNotifications", checked, setBreakReminderNotifications, "notification")
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
                      handleSettingChange("friendRequestNotifications", checked, setFriendRequestNotifications, "notification")
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
                      handleSettingChange("messageNotifications", checked, setMessageNotifications, "notification")
                    }
                    disabled={!notificationsEnabled}
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
                    Enabling this may request system-level permissions
                  </span>
                )}
              </CardDescription>
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
                    Some settings may affect your device's display
                  </span>
                )}
              </CardDescription>
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
                    Enabling sounds may request audio permissions
                  </span>
                )}
              </CardDescription>
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
                    handleSettingChange("focusSounds", checked, setFocusSounds, "audio")
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
