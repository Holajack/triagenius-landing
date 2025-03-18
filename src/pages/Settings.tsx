import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import NavigationBar from "@/components/dashboard/NavigationBar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  BellIcon, 
  BellOffIcon, 
  MoonIcon, 
  SunIcon, 
  VolumeIcon, 
  Volume2Icon, 
  EyeIcon,
  ClockIcon,
  SaveIcon
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/integrations/supabase/client";
import { requestNotificationPermission } from "@/components/pwa/ServiceWorker";

// Interface for app settings
interface AppSettings {
  notifications: {
    enabled: boolean;
    focusComplete: boolean;
    newMessages: boolean;
    friendRequests: boolean;
    studyRooms: boolean;
    aiInsights: boolean;
  };
  doNotDisturb: {
    enabled: boolean;
    duringFocus: boolean;
    duringReflection: boolean;
    duringBreak: boolean;
    duringReports: boolean;
  };
  display: {
    darkMode: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
    largeText: boolean;
  };
  sound: {
    enabled: boolean;
    focusTimerSounds: boolean;
    notificationSounds: boolean;
    ambientSounds: boolean;
  };
}

const Settings = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Initialize with default settings
  const [settings, setSettings] = useState<AppSettings>({
    notifications: {
      enabled: false,
      focusComplete: true,
      newMessages: true,
      friendRequests: true,
      studyRooms: true,
      aiInsights: true
    },
    doNotDisturb: {
      enabled: false,
      duringFocus: true,
      duringReflection: true,
      duringBreak: false,
      duringReports: false
    },
    display: {
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      highContrast: false,
      reducedMotion: false,
      largeText: false
    },
    sound: {
      enabled: true,
      focusTimerSounds: true,
      notificationSounds: true,
      ambientSounds: true
    }
  });
  
  // Load settings from local storage on component mount
  useEffect(() => {
    const loadSettings = async () => {
      // Check notification permission
      try {
        const hasPermission = await requestNotificationPermission(false);
        setNotificationsEnabled(hasPermission);
        
        // Update the settings notification enabled state
        setSettings(prev => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            enabled: hasPermission
          }
        }));
      } catch (error) {
        console.error('Error checking notification permission:', error);
      }
      
      // Load settings from localStorage
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(prev => ({
            ...prev,
            ...parsedSettings,
            // Keep notification permission in sync with browser
            notifications: {
              ...parsedSettings.notifications,
              enabled: notificationsEnabled
            }
          }));
        } catch (error) {
          console.error('Error parsing saved settings:', error);
        }
      }
    };
    
    loadSettings();
  }, []);
  
  // Save settings to local storage
  const saveSettings = () => {
    setLoading(true);
    
    try {
      localStorage.setItem('appSettings', JSON.stringify(settings));
      
      // Apply display settings
      if (settings.display.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      if (settings.display.reducedMotion) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
      
      if (settings.display.largeText) {
        document.documentElement.classList.add('large-text');
      } else {
        document.documentElement.classList.remove('large-text');
      }
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle enabling notifications
  const handleEnableNotifications = async () => {
    try {
      const result = await requestNotificationPermission();
      setNotificationsEnabled(result);
      
      setSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          enabled: result
        }
      }));
      
      if (result) {
        toast.success('Notifications enabled');
      } else {
        toast.error('Notification permission denied', {
          description: 'Please enable notifications in your browser settings'
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Could not enable notifications');
    }
  };
  
  // Handle toggling a setting
  const handleToggleSetting = (category: keyof AppSettings, setting: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };
  
  return (
    <div className="container max-w-6xl pb-24">
      <div className="space-y-6 pb-6 pt-2">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your app preferences and permissions
        </p>
      </div>

      <Tabs defaultValue="notifications" className="mb-24">
        <TabsList className="mb-6">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="doNotDisturb">Do Not Disturb</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="sound">Sound</TabsTrigger>
        </TabsList>
        
        <div className="flex justify-end mb-4">
          <Button onClick={saveSettings} disabled={loading}>
            <SaveIcon className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
        
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Control when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow the app to send you notifications
                  </p>
                </div>
                {notificationsEnabled ? (
                  <Switch 
                    checked={settings.notifications.enabled}
                    onCheckedChange={(checked) => handleToggleSetting('notifications', 'enabled', checked)}
                  />
                ) : (
                  <Button onClick={handleEnableNotifications} variant="outline" size="sm">
                    <BellIcon className="mr-2 h-4 w-4" />
                    Enable
                  </Button>
                )}
              </div>
              
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-medium">Notification Types</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Focus Session Complete</Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified when your focus session is complete
                      </p>
                    </div>
                    <Switch 
                      checked={settings.notifications.focusComplete}
                      onCheckedChange={(checked) => handleToggleSetting('notifications', 'focusComplete', checked)}
                      disabled={!settings.notifications.enabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">New Messages</Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified when you receive new messages
                      </p>
                    </div>
                    <Switch 
                      checked={settings.notifications.newMessages}
                      onCheckedChange={(checked) => handleToggleSetting('notifications', 'newMessages', checked)}
                      disabled={!settings.notifications.enabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Friend Requests</Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified about new friend requests
                      </p>
                    </div>
                    <Switch 
                      checked={settings.notifications.friendRequests}
                      onCheckedChange={(checked) => handleToggleSetting('notifications', 'friendRequests', checked)}
                      disabled={!settings.notifications.enabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Study Room Updates</Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified about study room activity
                      </p>
                    </div>
                    <Switch 
                      checked={settings.notifications.studyRooms}
                      onCheckedChange={(checked) => handleToggleSetting('notifications', 'studyRooms', checked)}
                      disabled={!settings.notifications.enabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">AI Insights</Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified when AI generates new insights
                      </p>
                    </div>
                    <Switch 
                      checked={settings.notifications.aiInsights}
                      onCheckedChange={(checked) => handleToggleSetting('notifications', 'aiInsights', checked)}
                      disabled={!settings.notifications.enabled}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="doNotDisturb" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Do Not Disturb</CardTitle>
              <CardDescription>
                Control when notifications and disruptions are minimized
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Do Not Disturb</Label>
                  <p className="text-sm text-muted-foreground">
                    Silence notifications during key activities
                  </p>
                </div>
                <Switch 
                  checked={settings.doNotDisturb.enabled}
                  onCheckedChange={(checked) => handleToggleSetting('doNotDisturb', 'enabled', checked)}
                />
              </div>
              
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-medium">Automatically Enable During:</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Focus Sessions</Label>
                      <p className="text-xs text-muted-foreground">
                        Silence notifications during focus sessions
                      </p>
                    </div>
                    <Switch 
                      checked={settings.doNotDisturb.duringFocus}
                      onCheckedChange={(checked) => handleToggleSetting('doNotDisturb', 'duringFocus', checked)}
                      disabled={!settings.doNotDisturb.enabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Session Reflections</Label>
                      <p className="text-xs text-muted-foreground">
                        Stay focused while reflecting on your sessions
                      </p>
                    </div>
                    <Switch 
                      checked={settings.doNotDisturb.duringReflection}
                      onCheckedChange={(checked) => handleToggleSetting('doNotDisturb', 'duringReflection', checked)}
                      disabled={!settings.doNotDisturb.enabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Break Timer</Label>
                      <p className="text-xs text-muted-foreground">
                        Keep break time quiet and relaxing
                      </p>
                    </div>
                    <Switch 
                      checked={settings.doNotDisturb.duringBreak}
                      onCheckedChange={(checked) => handleToggleSetting('doNotDisturb', 'duringBreak', checked)}
                      disabled={!settings.doNotDisturb.enabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Session Reports</Label>
                      <p className="text-xs text-muted-foreground">
                        Eliminate distractions while reviewing reports
                      </p>
                    </div>
                    <Switch 
                      checked={settings.doNotDisturb.duringReports}
                      onCheckedChange={(checked) => handleToggleSetting('doNotDisturb', 'duringReports', checked)}
                      disabled={!settings.doNotDisturb.enabled}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Customize how the app looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use dark theme for the application
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SunIcon className="h-4 w-4 text-muted-foreground" />
                    <Switch 
                      checked={settings.display.darkMode}
                      onCheckedChange={(checked) => handleToggleSetting('display', 'darkMode', checked)}
                    />
                    <MoonIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">High Contrast</Label>
                    <p className="text-xs text-muted-foreground">
                      Increase contrast for better visibility
                    </p>
                  </div>
                  <Switch 
                    checked={settings.display.highContrast}
                    onCheckedChange={(checked) => handleToggleSetting('display', 'highContrast', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Reduced Motion</Label>
                    <p className="text-xs text-muted-foreground">
                      Minimize animations throughout the app
                    </p>
                  </div>
                  <Switch 
                    checked={settings.display.reducedMotion}
                    onCheckedChange={(checked) => handleToggleSetting('display', 'reducedMotion', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Larger Text</Label>
                    <p className="text-xs text-muted-foreground">
                      Increase text size for better readability
                    </p>
                  </div>
                  <Switch 
                    checked={settings.display.largeText}
                    onCheckedChange={(checked) => handleToggleSetting('display', 'largeText', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sound" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sound Settings</CardTitle>
              <CardDescription>
                Control audio preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Sounds</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable all sounds in the app
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <VolumeIcon className="h-4 w-4 text-muted-foreground" />
                  <Switch 
                    checked={settings.sound.enabled}
                    onCheckedChange={(checked) => handleToggleSetting('sound', 'enabled', checked)}
                  />
                  <Volume2Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-medium">Sound Types</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Focus Timer Sounds</Label>
                      <p className="text-xs text-muted-foreground">
                        Timer beeps and milestone sounds
                      </p>
                    </div>
                    <Switch 
                      checked={settings.sound.focusTimerSounds}
                      onCheckedChange={(checked) => handleToggleSetting('sound', 'focusTimerSounds', checked)}
                      disabled={!settings.sound.enabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Notification Sounds</Label>
                      <p className="text-xs text-muted-foreground">
                        Sounds for alerts and notifications
                      </p>
                    </div>
                    <Switch 
                      checked={settings.sound.notificationSounds}
                      onCheckedChange={(checked) => handleToggleSetting('sound', 'notificationSounds', checked)}
                      disabled={!settings.sound.enabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Ambient Sounds</Label>
                      <p className="text-xs text-muted-foreground">
                        Background audio during focus sessions
                      </p>
                    </div>
                    <Switch 
                      checked={settings.sound.ambientSounds}
                      onCheckedChange={(checked) => handleToggleSetting('sound', 'ambientSounds', checked)}
                      disabled={!settings.sound.enabled}
                    />
                  </div>
                </div>
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
