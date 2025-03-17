
import { useTheme } from "@/contexts/ThemeContext";
import NavigationBar from "@/components/dashboard/NavigationBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Settings as SettingsIcon, Music, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/common/PageHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Settings = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

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
    // More categories can be added here in the future
  };

  return (
    <div className="container max-w-md mx-auto px-4 pb-20">
      <PageHeader title="Settings" subtitle="Customize your experience" />

      <Tabs defaultValue="general" className="mb-6">
        <TabsList className="w-full">
          <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
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
