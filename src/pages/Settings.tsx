import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import NavigationBar from "@/components/dashboard/NavigationBar";
import { 
  BellIcon, 
  EyeIcon, 
  MoonIcon, 
  VolumeIcon, 
  Info, 
  ShieldAlert,
  ExternalLinkIcon,
  HeartIcon,
  Music,
  ShieldCheck
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDevicePermissions, PermissionType } from "@/hooks/use-device-permissions";
import { Button } from "@/components/ui/button";
import { SoundFilesManager } from "@/components/settings/SoundFilesManager";

const Settings = () => {
  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [sessionCompletionNotifications, setSessionCompletionNotifications] = useState(true);
  const [breakReminderNotifications, setBreakReminderNotifications] = useState(true);
  const [friendRequestNotifications, setFriendRequestNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  
  // App preferences (not device settings)
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [reducedAnimations, setReducedAnimations] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState("medium"); // low, medium, high
  const [focusSounds, setFocusSounds] = useState(true);

  const isMobile = useIsMobile();
  const isPwa = localStorage.getItem('isPWA') === 'true';
  
  // Use our device permissions hook
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
    permissionType?: PermissionType
  ) => {
    // Update app's internal setting state
    updateFunction(value);
    
    // Save to local storage
    localStorage.setItem(`setting_${setting}`, JSON.stringify(value));
    
    // Handle device permissions for notifications if we're in a PWA 
    if (typeof value === 'boolean' && permissionType === 'notifications' && isPwa) {
      if (value === true) {
        // Directly request notification permission when enabling
        const permission = await requestPermission(permissionType);
        
        if (permission) {
          // If permission granted, apply the device setting
          const success = await applyDeviceSetting(permissionType, true);
          
          if (success) {
            toast.success(`${setting} enabled with device permission`);
          } else {
            toast.error(`Couldn't apply ${setting} to device`, {
              description: "Feature may not be fully supported on this device",
              action: {
                label: "Retry",
                onClick: () => handleSettingChange(setting, value, updateFunction, permissionType)
              }
            });
          }
        } else {
          toast.error(`Permission for ${setting} was denied`, {
            description: "Please enable in your device settings to use this feature",
            action: {
              label: "Try Again",
              onClick: () => requestPermission(permissionType)
            }
          });
        }
      } else {
        // We're disabling notification - disable it if possible
        await applyDeviceSetting(permissionType, false);
        toast.success(`${setting} disabled`);
      }
    } else {
      // Regular setting update (no permission needed)
      toast.success(`Updated ${setting} setting`);
    }
  };

  // Handle manual permission request for notifications
  const handleRequestPermission = async (type: PermissionType) => {
    if (type !== 'notifications') {
      toast.info("This permission can only be managed in your device settings");
      return;
    }
    
    toast.loading(`Requesting ${type} permission...`, { id: 'permission-request' });
    
    const granted = await requestPermission(type);
    
    if (granted) {
      toast.success(`${type} permission granted`, {
        id: 'permission-request',
        description: "You can now enable related features"
      });
    } else {
      toast.error(`${type} permission denied`, {
        id: 'permission-request',
        description: "Please enable in your device settings to use this feature"
      });
    }
  };

  // Provide instructions to open device settings based on platform
  const openDeviceSettings = (settingType: string) => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isIOS) {
      toast.info(`To manage ${settingType} settings on iOS:`, {
        description: "Open Settings app > Find our app > Enable required permissions",
        duration: 5000
      });
    } else {
      toast.info(`To manage ${settingType} settings on Android:`, {
        description: "Open Settings app > Apps > Find our app > Permissions",
        duration: 5000
      });
    }
  };
  
  return (
    <div className="container max-w-4xl px-3 sm:px-6 pb-24">
      <div className="space-y-4 pb-4 pt-2">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your app preferences and device permissions
        </p>
        
        {isPwa && (
          <Alert variant="default" className="bg-primary/10 border-0">
            <Info className="h-4 w-4" />
            <AlertDescription>
              As a progressive web app, some device features require enabling permissions in your device settings.
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <Tabs defaultValue="notifications" className="mb-10">
        <TabsList className="grid grid-cols-4 w-full mb-4">
          <TabsTrigger value="notifications" className="text-xs sm:text-sm px-1 sm:px-3">
            <span className="truncate">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="dnd" className="text-xs sm:text-sm px-1 sm:px-3">
            <span className="truncate">Do Not Disturb</span>
          </TabsTrigger>
          <TabsTrigger value="display" className="text-xs sm:text-sm px-1 sm:px-3">
            <span className="truncate">Display</span>
          </TabsTrigger>
          <TabsTrigger value="sound" className="text-xs sm:text-sm px-1 sm:px-3">
            <span className="truncate">Sound</span>
          </TabsTrigger>
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
                  onClick={() => handleRequestPermission('notifications')}
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
                    handleSettingChange("notificationsEnabled", checked, setNotificationsEnabled, "notifications")
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
                      handleSettingChange("sessionCompletionNotifications", checked, setSessionCompletionNotifications, "notifications")
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
                      handleSettingChange("breakReminderNotifications", checked, setBreakReminderNotifications, "notifications")
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
                      handleSettingChange("friendRequestNotifications", checked, setFriendRequestNotifications, "notifications")
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
                      handleSettingChange("messageNotifications", checked, setMessageNotifications, "notifications")
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
                Recommendations for controlling notifications during focus sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Alert variant="default" className="bg-muted">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Currently, PWA apps cannot directly control your device's Do Not Disturb settings. 
                  Here are some recommendations:
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="space-y-2 border p-4 rounded-md">
                  <h4 className="font-medium">During Focus Sessions</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    We recommend enabling Do Not Disturb mode manually before starting a focus session.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full sm:w-auto" 
                    onClick={() => openDeviceSettings('Do Not Disturb')}
                  >
                    <ExternalLinkIcon className="h-4 w-4 mr-2" />
                    How to enable DND mode
                  </Button>
                </div>
                
                <div className="space-y-2 border p-4 rounded-md">
                  <h4 className="font-medium">Schedule DND Sessions</h4>
                  <p className="text-sm text-muted-foreground">
                    Most devices allow scheduling Do Not Disturb mode for specific time periods:
                  </p>
                  
                  <ul className="text-sm list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>On iOS: Settings → Focus → Do Not Disturb → Add Schedule</li>
                    <li>On Android: Settings → Sound & Vibration → Do Not Disturb → Schedule</li>
                  </ul>
                </div>
                
                <div className="space-y-2 border p-4 rounded-md">
                  <h4 className="font-medium">Device-specific focus modes</h4>
                  <p className="text-sm text-muted-foreground">
                    Many devices offer focus modes designed specifically for productivity:
                  </p>
                  
                  <ul className="text-sm list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>On iOS: Try the "Focus" mode in Settings</li>
                    <li>On Android: Try "Focus mode" in Digital Wellbeing settings</li>
                  </ul>
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
                Customize how the app looks and device display recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-4">
                <h4 className="font-medium">App Display Settings</h4>
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
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Device Display Recommendations</h4>
                
                <Alert variant="default" className="bg-muted">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    To maintain focus during study sessions, we recommend adjusting these device display settings:
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2 border p-4 rounded-md">
                  <h4 className="font-medium">Screen Brightness</h4>
                  <p className="text-sm text-muted-foreground">
                    For eye comfort during long focus sessions, consider:
                  </p>
                  <ul className="text-sm list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>Enabling auto-brightness to adjust based on ambient light</li>
                    <li>Using night mode/blue light filter during evening sessions</li>
                    <li>Reducing brightness in low-light environments</li>
                  </ul>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full sm:w-auto mt-2" 
                    onClick={() => openDeviceSettings('screen brightness')}
                  >
                    <ExternalLinkIcon className="h-4 w-4 mr-2" />
                    Adjust screen settings
                  </Button>
                </div>
                
                <div className="space-y-2 border p-4 rounded-md">
                  <h4 className="font-medium">Keep Screen Awake</h4>
                  <p className="text-sm text-muted-foreground">
                    To prevent your screen from turning off during focus sessions:
                  </p>
                  <ul className="text-sm list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>On iOS: Settings → Display & Brightness → Auto-Lock → Set to a longer duration</li>
                    <li>On Android: Settings → Display → Screen timeout → Increase duration</li>
                  </ul>
                </div>
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
                Configure app audio preferences and device recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-4">
                <h4 className="font-medium">App Sound Settings</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Enable Sounds</h4>
                    <p className="text-sm text-muted-foreground">
                      Play sound effects and alerts in the app
                    </p>
                  </div>
                  <Switch 
                    checked={soundEnabled}
                    onCheckedChange={(checked) => 
                      handleSettingChange("soundEnabled", checked, setSoundEnabled)
                    }
                  />
                </div>
                
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
              </div>
              
              <Separator />
              
              {/* Sound Files Manager */}
              <SoundFilesManager />
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Device Sound Recommendations</h4>
                
                <Alert variant="default" className="bg-muted">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    For optimal focus during study sessions, consider these device sound settings:
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2 border p-4 rounded-md">
                  <h4 className="font-medium">Silent Mode / Vibrate</h4>
                  <p className="text-sm text-muted-foreground">
                    We recommend enabling silent mode or vibrate-only during focus sessions to minimize distractions.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full sm:w-auto mt-2" 
                    onClick={() => openDeviceSettings('sound')}
                  >
                    <ExternalLinkIcon className="h-4 w-4 mr-2" />
                    Adjust sound settings
                  </Button>
                </div>
                
                <div className="space-y-2 border p-4 rounded-md">
                  <h4 className="font-medium">External Audio Devices</h4>
                  <p className="text-sm text-muted-foreground">
                    Consider using:
                  </p>
                  <ul className="text-sm list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>Noise-cancelling headphones to block background noise</li>
                    <li>Bluetooth speakers for ambient focus sounds</li>
                    <li>Earbuds with transparency mode for awareness of surroundings when needed</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Attribution Section */}
      <Card className="mb-24">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <HeartIcon className="h-5 w-5 text-primary" />
            <CardTitle>Attribution</CardTitle>
          </div>
          <CardDescription>
            Credits for resources used in this application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nature Sounds */}
          <div className="space-y-2">
            <h4 className="font-medium">Nature</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Sound Effect by <a href="https://pixabay.com/users/soul_serenity_ambience-6817262/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=229896" className="text-primary hover:underline">Soul_Serenity_Ambience</a> from <a href="https://pixabay.com/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=229896" className="text-primary hover:underline">Pixabay</a>
              </p>
            </div>
          </div>
          
          {/* Music Attribution */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Music Attribution</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              The Triage System uses music from various sources. Below are the attributions for the music tracks used in the app.
            </p>
            
            {/* Lo-Fi Music */}
            <div className="space-y-1 pl-4">
              <h5 className="text-sm font-medium">Lo-Fi Music</h5>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                <li>Marshmallow by Lukrembo</li>
                <li>Biscuit by Lukrembo</li>
                <li>Donut by Lukrembo</li>
                <li>Sunset by Lukrembo</li>
                <li>honey jam by massobeats</li>
              </ul>
            </div>
            
            {/* Ambient */}
            <div className="space-y-1 pl-4">
              <h5 className="text-sm font-medium">Ambient</h5>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                <li>Flourish by Pufino</li>
                <li>Creek by Pufino</li>
                <li>Wallflower by Epic Spectrum</li>
              </ul>
            </div>
            
            {/* Classic */}
            <div className="space-y-1 pl-4">
              <h5 className="text-sm font-medium">Classic</h5>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                <li>Enlivening by Pufino</li>
                <li>Sky Clearing by Epic Spectrum</li>
                <li>Farewell by Guillermo Guareschi</li>
                <li>Wings of Freedom by Alegend</li>
                <li>Dragon Kingdom by Walen</li>
                <li>Sky With Yellow Spots by Aeris</li>
              </ul>
            </div>
          </div>
          
          {/* Legal Information */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Legal Information</h4>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                The Triage System respects intellectual property rights and provides attribution for all resources used within the application.
              </p>
              <p>
                If you believe any content violates your rights, please contact us.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <NavigationBar />
    </div>
  );
};

export default Settings;
