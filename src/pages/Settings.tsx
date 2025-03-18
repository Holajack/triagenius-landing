import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import NavigationBar from "@/components/dashboard/NavigationBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Settings as SettingsIcon, Music, Info, Bell, Shield, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/common/PageHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { requestNotificationPermission } from "@/components/pwa/ServiceWorker";

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return Notification.permission === 'granted';
  });
  const [dndEnabled, setDndEnabled] = useState<boolean>(() => {
    return localStorage.getItem('dndEnabled') === 'true';
  });
  const [dndDuringFocus, setDndDuringFocus] = useState<boolean>(() => {
    return localStorage.getItem('dndDuringFocus') === 'true' || true;
  });
  const [dndDuringReflection, setDndDuringReflection] = useState<boolean>(() => {
    return localStorage.getItem('dndDuringReflection') === 'true' || false;
  });
  const [dataSaving, setDataSaving] = useState<boolean>(() => {
    return localStorage.getItem('dataSavingMode') === 'true' || false;
  });
  const [autoPlayMusic, setAutoPlayMusic] = useState<boolean>(() => {
    return localStorage.getItem('autoPlayMusic') !== 'false';
  });
  const [highContrastMode, setHighContrastMode] = useState<boolean>(() => {
    return localStorage.getItem('highContrastMode') === 'true' || false;
  });

  // Music attribution data organized by categories
  const musicAttributions = {
    lofi: [
      {
        title: "Marshmallow",
        artist: "Lukrembo",
        source: "https://freetouse.com/music",
        license: "No Copyright Music for Video (Free)",
      },
      {
        title: "Biscuit",
        artist: "Lukrembo",
        source: "https://freetouse.com/music",
        license: "Copyright Free Music for Video",
      },
      {
        title: "Donut",
        artist: "Lukrembo",
        source: "https://freetouse.com/music",
        license: "Copyright Free Music for Videos",
      },
      {
        title: "Sunset",
        artist: "Lukrembo",
        source: "https://freetouse.com/music",
        license: "Royalty Free Music for Video (Safe)",
      },
      {
        title: "honey jam",
        artist: "massobeats",
        source: "https://freetouse.com/music",
        license: "Free Music Without Copyright (Safe)",
      },
    ],
    nature: [
      {
        title: "Flourish",
        artist: "Pufino",
        source: "https://freetouse.com/music",
        license: "Free To Use Music for Video",
      },
      {
        title: "Creek",
        artist: "Pufino",
        source: "https://freetouse.com/music",
        license: "Music for Video (Free Download)",
      },
      {
        title: "Wallflower",
        artist: "Epic Spectrum",
        source: "https://freetouse.com/music",
        license: "Royalty Free Music for Videos (Safe)",
      },
    ],
    classic: [
      {
        title: "Enlivening",
        artist: "Pufino",
        source: "https://freetouse.com/music",
        license: "No Copyright Background Music",
      },
      {
        title: "Sky Clearing",
        artist: "Epic Spectrum",
        source: "https://freetouse.com/music",
        license: "Background Music for Video (Free)",
      },
      {
        title: "Farewell",
        artist: "Guillermo Guareschi",
        source: "https://freetouse.com/music",
        license: "Free No Copyright Music Download",
      },
      {
        title: "Wings of Freedom",
        artist: "Alegend",
        source: "https://freetouse.com/music",
        license: "Music for Video (Free Download)",
      },
      {
        title: "Dragon Kingdom",
        artist: "Walen",
        source: "https://freetouse.com/music",
        license: "Music for Video (Free Download)",
      },
      {
        title: "Sky With Yellow Spots",
        artist: "Aeris",
        source: "https://freetouse.com/music",
        license: "Free No Copyright Music Download",
      },
    ],
  };

  const handleToggleNotifications = async () => {
    try {
      const permissionResult = await requestNotificationPermission();
      setNotificationsEnabled(permissionResult);
      
      if (permissionResult) {
        toast.success("Notifications enabled");
      } else {
        toast.error("Notification permission denied", {
          description: "Please enable notifications in your browser settings"
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Failed to update notification settings");
    }
  };

  const handleToggleDND = (value: boolean) => {
    setDndEnabled(value);
    localStorage.setItem('dndEnabled', value.toString());
    toast.success(value ? "Do Not Disturb enabled" : "Do Not Disturb disabled");
  };

  const handleToggleDNDDuringFocus = (value: boolean) => {
    setDndDuringFocus(value);
    localStorage.setItem('dndDuringFocus', value.toString());
  };

  const handleToggleDNDDuringReflection = (value: boolean) => {
    setDndDuringReflection(value);
    localStorage.setItem('dndDuringReflection', value.toString());
  };

  const handleToggleDataSaving = (value: boolean) => {
    setDataSaving(value);
    localStorage.setItem('dataSavingMode', value.toString());
    toast.success(`Data saving mode ${value ? 'enabled' : 'disabled'}`);
  };

  const handleToggleAutoPlayMusic = (value: boolean) => {
    setAutoPlayMusic(value);
    localStorage.setItem('autoPlayMusic', value.toString());
  };

  const handleToggleHighContrastMode = (value: boolean) => {
    setHighContrastMode(value);
    localStorage.setItem('highContrastMode', value.toString());
    document.documentElement.classList.toggle('high-contrast-mode', value);
    toast.success(`High contrast mode ${value ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="container max-w-md mx-auto px-4 pb-20">
      <PageHeader title="Settings" subtitle="Customize your experience" />

      <Tabs defaultValue="general" className="mb-6">
        <TabsList className="w-full grid-cols-3">
          <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
          <TabsTrigger value="permissions" className="flex-1">Permissions</TabsTrigger>
          <TabsTrigger value="attribution" className="flex-1">Attribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="pt-4">
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2 text-primary" />
                System Settings
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
                    <p className="font-medium">High Contrast Mode</p>
                    <p className="text-sm text-muted-foreground">Increase visual contrast</p>
                  </div>
                  <Switch 
                    checked={highContrastMode}
                    onCheckedChange={handleToggleHighContrastMode}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Data Saving Mode</p>
                    <p className="text-sm text-muted-foreground">Use less data for images and animations</p>
                  </div>
                  <Switch 
                    checked={dataSaving}
                    onCheckedChange={handleToggleDataSaving}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-play Music</p>
                    <p className="text-sm text-muted-foreground">Start music automatically in focus sessions</p>
                  </div>
                  <Switch 
                    checked={autoPlayMusic}
                    onCheckedChange={handleToggleAutoPlayMusic}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <p className="font-medium">App Version</p>
                  <p className="text-sm text-muted-foreground">1.0.0</p>
                </div>
                
                <Separator />
                
                <div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate("/profile")}
                  >
                    User Profile Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions" className="pt-4">
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifications</p>
                    <p className="text-sm text-muted-foreground">Allow app to send notifications</p>
                  </div>
                  <Switch 
                    checked={notificationsEnabled}
                    onCheckedChange={handleToggleNotifications}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Do Not Disturb</p>
                    <p className="text-sm text-muted-foreground">Pause notifications</p>
                  </div>
                  <Switch 
                    checked={dndEnabled}
                    onCheckedChange={handleToggleDND}
                  />
                </div>
                
                <Collapsible className="mt-2" open={dndEnabled}>
                  <CollapsibleContent className="space-y-3 pl-4 pr-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm">During focus sessions</p>
                      <Switch 
                        checked={dndDuringFocus}
                        onCheckedChange={handleToggleDNDDuringFocus}
                        disabled={!dndEnabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm">During session reflections</p>
                      <Switch 
                        checked={dndDuringReflection}
                        onCheckedChange={handleToggleDNDDuringReflection}
                        disabled={!dndEnabled}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                
                <Separator />
                
                <div className="rounded-md bg-muted p-4">
                  <p className="text-sm text-muted-foreground">
                    Additional permissions for camera, microphone and location can be managed in your browser settings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="attribution" className="pt-4">
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Music className="h-5 w-5 mr-2 text-primary" />
                Music Attribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                The Triage System uses music from various sources. Below are the attributions for the music tracks used in the app.
              </p>
              
              <div className="space-y-6">
                {/* Lo-Fi Music Section */}
                <div>
                  <h3 className="text-base font-medium mb-2 text-primary">Lo-Fi Music</h3>
                  <Accordion type="single" collapsible className="w-full">
                    {musicAttributions.lofi.map((track, index) => (
                      <AccordionItem key={`lofi-${index}`} value={`lofi-track-${index}`}>
                        <AccordionTrigger className="text-sm font-medium">
                          {track.title} by {track.artist}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pl-2">
                            <p className="text-sm">Artist: {track.artist}</p>
                            <p className="text-sm">License: {track.license}</p>
                            <div className="flex items-center text-sm text-primary">
                              <a 
                                href={track.source} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center hover:underline"
                              >
                                Source <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
                
                {/* Nature Music Section */}
                <div>
                  <h3 className="text-base font-medium mb-2 text-primary">Nature</h3>
                  <Accordion type="single" collapsible className="w-full">
                    {musicAttributions.nature.map((track, index) => (
                      <AccordionItem key={`nature-${index}`} value={`nature-track-${index}`}>
                        <AccordionTrigger className="text-sm font-medium">
                          {track.title} by {track.artist}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pl-2">
                            <p className="text-sm">Artist: {track.artist}</p>
                            <p className="text-sm">License: {track.license}</p>
                            <div className="flex items-center text-sm text-primary">
                              <a 
                                href={track.source} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center hover:underline"
                              >
                                Source <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
                
                {/* Classic Music Section */}
                <div>
                  <h3 className="text-base font-medium mb-2 text-primary">Classic</h3>
                  <Accordion type="single" collapsible className="w-full">
                    {musicAttributions.classic.map((track, index) => (
                      <AccordionItem key={`classic-${index}`} value={`classic-track-${index}`}>
                        <AccordionTrigger className="text-sm font-medium">
                          {track.title} by {track.artist}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pl-2">
                            <p className="text-sm">Artist: {track.artist}</p>
                            <p className="text-sm">License: {track.license}</p>
                            <div className="flex items-center text-sm text-primary">
                              <a 
                                href={track.source} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center hover:underline"
                              >
                                Source <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Info className="h-5 w-5 mr-2 text-primary" />
                Legal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                The Triage System respects intellectual property rights and provides attribution for all resources used within the application.
              </p>
              <p className="text-sm text-muted-foreground">
                If you believe any content violates your rights, please contact us.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NavigationBar />
    </div>
  );
};

export default Settings;
