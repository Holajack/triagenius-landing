
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { MapPin, Sun, Cloud, Wind, Droplets, Mountain, Route } from 'lucide-react';

const TerrainControls = () => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center">
          <Mountain className="h-5 w-5 mr-2 text-primary" />
          Terrain Controls
        </CardTitle>
        <CardDescription>
          Customize the terrain visualization and explore points of interest
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="environment" className="space-y-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="environment" className="flex items-center gap-1 text-xs">
              <Sun className="h-3 w-3" /> Environment
            </TabsTrigger>
            <TabsTrigger value="waypoints" className="flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3" /> Points of Interest
            </TabsTrigger>
            <TabsTrigger value="routes" className="flex items-center gap-1 text-xs">
              <Route className="h-3 w-3" /> Routes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="environment" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Sun Position</label>
                  <span className="text-xs text-muted-foreground">3:30 PM</span>
                </div>
                <Slider defaultValue={[65]} max={100} step={1} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Wind Intensity</label>
                  <span className="text-xs text-muted-foreground">Medium</span>
                </div>
                <Slider defaultValue={[50]} max={100} step={1} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Dust Particles</label>
                  <span className="text-xs text-muted-foreground">Light</span>
                </div>
                <Slider defaultValue={[30]} max={100} step={1} />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Weather Presets</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    <Sun className="h-3 w-3 mr-1" /> Clear Sky
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    <Cloud className="h-3 w-3 mr-1" /> Cloudy
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    <Wind className="h-3 w-3 mr-1" /> Windy
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    <Droplets className="h-3 w-3 mr-1" /> Light Rain
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="waypoints" className="space-y-4">
            <div className="space-y-3">
              <div className="text-sm">Discovered Points of Interest</div>
              
              {[
                { name: "Summit Ridge", type: "Peak", elevation: "3,240m" },
                { name: "Canyon Valley", type: "Valley", elevation: "1,850m" },
                { name: "Eastern Plateau", type: "Plateau", elevation: "2,450m" },
                { name: "Western Ravine", type: "Ravine", elevation: "2,100m" }
              ].map((poi, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded-md hover:bg-accent cursor-pointer">
                  <div>
                    <div className="font-medium">{poi.name}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs mr-2">{poi.type}</Badge>
                      <span>{poi.elevation}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button variant="outline" size="sm" className="w-full mt-2">
                <MapPin className="h-4 w-4 mr-2" /> Add Custom Waypoint
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="routes" className="space-y-4">
            <div className="space-y-3">
              <div className="text-sm">Saved Routes</div>
              
              {[
                { name: "North Ridge Traverse", distance: "4.2 km", difficulty: "Hard" },
                { name: "Valley Floor Path", distance: "2.8 km", difficulty: "Easy" },
                { name: "Peak Circuit", distance: "7.5 km", difficulty: "Medium" }
              ].map((route, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded-md hover:bg-accent cursor-pointer">
                  <div>
                    <div className="font-medium">{route.name}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span className="mr-2">{route.distance}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          route.difficulty === 'Easy' ? 'bg-green-100 border-green-200 text-green-800' :
                          route.difficulty === 'Medium' ? 'bg-yellow-100 border-yellow-200 text-yellow-800' :
                          'bg-red-100 border-red-200 text-red-800'
                        }`}
                      >
                        {route.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Route className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button variant="outline" size="sm" className="w-full mt-2">
                <Route className="h-4 w-4 mr-2" /> Create New Route
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TerrainControls;
