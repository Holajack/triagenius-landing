
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Share, Download, ArrowDown, Plus, MoreHorizontal, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

const FirstVisitPrompt = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'other'>('other');
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // Check if this is first visit
    const hasVisited = localStorage.getItem('hasSeenDownloadInstructions');
    
    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    let detectedDevice: 'android' | 'ios' | 'other' = 'other';
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      detectedDevice = 'ios';
    } else if (/android/.test(userAgent)) {
      detectedDevice = 'android';
    }
    
    setDeviceType(detectedDevice);
    
    // Only show for mobile devices on first visit
    if (!hasVisited && isMobile) {
      // Delay showing the dialog to allow the page to load first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isMobile]);
  
  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenDownloadInstructions', 'true');
  };
  
  if (!isMobile) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[90vw] sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-triage-purple" />
            Add to Home Screen
          </DialogTitle>
          <DialogDescription>
            Install The Triage System for better performance and offline access
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={deviceType} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ios">iPhone / iPad</TabsTrigger>
            <TabsTrigger value="android">Android</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ios" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">Step 1</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tap the Share icon in Safari's menu bar
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">Step 2</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Scroll down and tap "Add to Home Screen"
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shrink-0">
                  <ArrowDown className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">Step 3</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tap "Add" in the top-right corner
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 rounded-md bg-purple-50 dark:bg-purple-900/20 p-3">
              <p className="text-xs text-purple-700 dark:text-purple-300">
                You'll now be able to open The Triage System directly from your home screen like a native app!
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="android" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shrink-0">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">Step 1</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tap the three dots menu in Chrome
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">Step 2</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select "Install app" or "Add to Home Screen"
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shrink-0">
                  <ArrowDown className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">Step 3</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tap "Install" on the confirmation dialog
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 rounded-md bg-purple-50 dark:bg-purple-900/20 p-3">
              <p className="text-xs text-purple-700 dark:text-purple-300">
                The app will now be accessible directly from your home screen for faster access!
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between items-center gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Remind me later
          </Button>
          <Button size="sm" onClick={handleClose} className="bg-triage-purple hover:bg-triage-purple/90">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FirstVisitPrompt;
