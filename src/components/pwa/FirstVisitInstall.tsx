
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Share } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

const FirstVisitInstall = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  useEffect(() => {
    // Check if first visit
    const hasSeenInstructions = localStorage.getItem('hasSeenInstallInstructions');
    
    // Detect platform
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isAndroidDevice = /android/i.test(userAgent);
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
    
    setIsAndroid(isAndroidDevice);
    setIsIOS(isIOSDevice);
    
    // Check if already installed as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
                        
    // Only show instructions on first visit, on mobile, and not in PWA mode
    if (!hasSeenInstructions && (isAndroidDevice || isIOSDevice) && !isStandalone) {
      setTimeout(() => {
        setShowInstructions(true);
        setDialogOpen(true);
        // Mark as seen
        localStorage.setItem('hasSeenInstallInstructions', 'true');
      }, 2000); // Short delay to let page load first
    }
  }, []);
  
  const handleClose = () => {
    setDialogOpen(false);
    setShowInstructions(false);
  };
  
  if (!showInstructions) return null;
  
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/95f9c287-86ca-4428-bbc4-b9c9b75478b9.png" 
              alt="The Triage System" 
              className="w-6 h-6"
            />
            Install The Triage System
          </DialogTitle>
          <DialogDescription>
            Install our app for the best experience
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {isIOS && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-2 flex-shrink-0">
                  <Share className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Step 1:</p>
                  <p className="text-sm text-gray-500">Tap the Share button in Safari</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-2 flex-shrink-0">
                  <span className="text-sm font-bold">+</span>
                </div>
                <div>
                  <p className="font-medium">Step 2:</p>
                  <p className="text-sm text-gray-500">Tap "Add to Home Screen"</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-2 flex-shrink-0">
                  <span className="text-sm font-bold">✓</span>
                </div>
                <div>
                  <p className="font-medium">Step 3:</p>
                  <p className="text-sm text-gray-500">Tap "Add" in the top-right corner</p>
                </div>
              </div>
            </div>
          )}
          
          {isAndroid && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-2 flex-shrink-0">
                  <Share className="w-5 h-5 rotate-90" />
                </div>
                <div>
                  <p className="font-medium">Step 1:</p>
                  <p className="text-sm text-gray-500">Tap the menu button (⋮) in Chrome</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-2 flex-shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Step 2:</p>
                  <p className="text-sm text-gray-500">Tap "Install app" or "Add to Home screen"</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-2 flex-shrink-0">
                  <span className="text-sm font-bold">✓</span>
                </div>
                <div>
                  <p className="font-medium">Step 3:</p>
                  <p className="text-sm text-gray-500">Tap "Install" on the confirmation dialog</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-sm text-center text-gray-500 pt-2">
            Installing allows you to use the app offline and provides a better experience
          </div>
        </div>
        
        <div className="flex justify-center">
          <Button onClick={handleClose} className="w-full">Got it</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FirstVisitInstall;
