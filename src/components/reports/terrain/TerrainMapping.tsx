
import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Mountain, Sun, Moon } from 'lucide-react';

// Define the terrain data - we'll keep this for reference even though we're using an embedded 3D object
const terrainData = {
  "bounds": {
    "ne": [
      -105.11492,
      40.54043
    ] as [number, number],
    "sw": [
      -106.21862,
      39.56597
    ] as [number, number]
  },
  "resolution": {
    "elevation": {
      "tileSize": 256,
      "zoom": 9
    },
    "texture": {
      "tileSize": 512,
      "zoom": 12
    }
  },
  "altitudeBoundsinMeters": {
    "max": 4309,
    "min": 544,
    "base": -1713
  }
};

const TerrainMapping = () => {
  const isMobile = useIsMobile();
  const [isNightMode, setIsNightMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Load the Clooned script
  useEffect(() => {
    // Check if Clooned script already exists
    const existingScript = document.querySelector('script[src*="clooned.js"]');
    
    if (!existingScript) {
      // Load the Clooned script
      const script = document.createElement('script');
      script.src = "https://clooned.com/wp-content/uploads/cloons/scripts/clooned.js";
      script.async = true;
      
      script.onload = () => {
        console.log('Clooned script loaded successfully');
        setScriptLoaded(true);
      };
      
      script.onerror = (error) => {
        console.error('Error loading Clooned script:', error);
        setLoadingError('Failed to load 3D visualization script');
      };
      
      document.head.appendChild(script);
      
      return () => {
        // Only remove if it's the script we added
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    } else {
      setScriptLoaded(true);
    }
  }, []);
  
  // Create clooned-object element manually after script loads
  useEffect(() => {
    if (scriptLoaded && containerRef.current) {
      // Short delay to ensure the script is fully initialized
      setTimeout(() => {
        try {
          // Clear previous content
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
          
            // Create the clooned-object element
            const cloonedObject = document.createElement('clooned-object');
            cloonedObject.setAttribute('features', 'lsc;dt;fs');
            cloonedObject.setAttribute('oid', 'a4ff2c22518f4b3aaac823e1fa5abbbc');
            
            // Apply styling to make it take the full container dimensions
            cloonedObject.style.width = '100%';
            cloonedObject.style.height = '100%';
            cloonedObject.style.display = 'block';
            
            // Add to container
            containerRef.current.appendChild(cloonedObject);
            
            console.log('Clooned object element created and appended');
          }
        } catch (error) {
          console.error('Error creating Clooned object:', error);
          setLoadingError('Failed to initialize 3D visualization');
        }
      }, 300); // Small delay to ensure script is ready
    }
  }, [scriptLoaded]);
  
  // Apply night mode effect when toggled
  useEffect(() => {
    // This would implement night/day mode if the Clooned API supports it
    if (scriptLoaded && containerRef.current) {
      const cloonedObject = containerRef.current.querySelector('clooned-object');
      if (cloonedObject) {
        // Add a class to the container instead for styling
        if (isNightMode) {
          containerRef.current.classList.add('night-mode');
        } else {
          containerRef.current.classList.remove('night-mode');
        }
      }
    }
  }, [isNightMode, scriptLoaded]);
  
  return (
    <div className={`h-full ${isMobile ? 'px-1' : 'px-4'}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <Mountain className="mr-2 h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Learning Terrain</h3>
        </div>
        
        {!isMobile && (
          <div className="text-sm text-muted-foreground">
            Visualize your learning path through cognitive terrain
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={() => setIsNightMode(!isNightMode)}
            className={isMobile ? 'px-2 py-1 text-xs' : ''}
          >
            {isNightMode ? 
              <Sun className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} /> : 
              <Moon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
            }
            {isMobile ? '' : (isNightMode ? 'Day Mode' : 'Night Mode')}
          </Button>
        </div>
      </div>
      
      <div className="relative w-full h-full min-h-[400px] border rounded-md p-4 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-background/80 backdrop-blur-sm">
          <h4 className="text-base font-medium">Rocky Mountains 3D Terrain</h4>
          <div className="text-primary text-sm">
            <span>Interactive 3D View</span>
          </div>
        </div>
        
        <div className={`w-full h-full pt-12 pb-8 ${isNightMode ? 'night-mode' : ''}`} ref={containerRef}>
          {!scriptLoaded && !loadingError && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse text-center">
                <p>Loading 3D terrain...</p>
                <div className="mt-2 w-12 h-1 bg-primary/50 mx-auto rounded-full"></div>
              </div>
            </div>
          )}
          
          {loadingError && (
            <div className="flex flex-col items-center justify-center h-full text-destructive">
              <p>{loadingError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Reload
              </Button>
            </div>
          )}
          
          {/* clooned-object will be inserted here programmatically */}
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-2 text-xs text-center text-muted-foreground bg-background/80 backdrop-blur-sm">
          Colorado Rockies terrain - interactive 3D model by Clooned
        </div>
      </div>
    </div>
  );
};

export default TerrainMapping;
