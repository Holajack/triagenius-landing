import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWADetector = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if on mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      return /android|iPad|iPhone|iPod/.test(userAgent);
    };
    
    setIsMobile(checkMobile());
    
    // Check if already installed
    const checkStandalone = () => {
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                                (window.navigator as any).standalone === true;
      setIsStandalone(isInStandaloneMode);
      
      if (isInStandaloneMode) {
        localStorage.setItem('isPWA', 'true');
        
        // Request necessary permissions for PWA functionality
        setTimeout(() => {
          requestPWAPermissions();
        }, 3000);
      }
    };
    
    checkStandalone();
    
    // Only proceed if we're in a browser context, not in standalone mode
    if (!isStandalone) {
      // Listen for beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        // Prevent Chrome 76+ from automatically showing the prompt
        e.preventDefault();
        // Save the event so it can be triggered later
        setInstallPrompt(e as BeforeInstallPromptEvent);
      };
      
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      
      // Listen for app installed event
      const handleAppInstalled = () => {
        setInstallPrompt(null);
        setIsStandalone(true);
        localStorage.setItem('isPWA', 'true');
        toast({
          title: "App installed!",
          description: "The Triage System has been added to your home screen",
        });
        
        // Request necessary permissions after installation
        setTimeout(() => {
          requestPWAPermissions();
        }, 3000);
      };
      
      window.addEventListener('appinstalled', handleAppInstalled);
      
      // Clean up event listeners
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, [toast, isStandalone]);
  
  // Request permissions needed for PWA functionality
  const requestPWAPermissions = async () => {
    try {
      // Request notification permission for timer completion alerts
      if ('Notification' in window) {
        const permissionResult = await Notification.requestPermission();
        if (permissionResult === 'granted') {
          console.log('Notification permission granted');
        }
      }
      
      // Request wake lock permission to keep screen on during focus sessions
      if ('wakeLock' in navigator) {
        try {
          // Just test if we can obtain a wake lock
          const wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('Wake lock obtained');
          // Release it immediately after testing
          await wakeLock.release();
          console.log('Wake lock released');
        } catch (err) {
          console.log('Wake lock request failed:', err);
        }
      }
      
      // Check background sync permission for offline use
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if ('sync' in registration) {
            await (registration as any).sync.register('test-sync');
            console.log('Background sync registered');
          }
        } catch (err) {
          console.log('Background sync registration failed:', err);
        }
      }
      
    } catch (error) {
      console.error('Error requesting PWA permissions:', error);
    }
  };
  
  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    try {
      // Show the install prompt
      await installPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setInstallPrompt(null);
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error in install process:', error);
    }
  };
  
  // Don't render anything if already installed or can't install
  // Or if not on mobile (since this is mobile-only)
  if (isStandalone || !installPrompt || !isMobile) return null;
  
  return (
    <div className="fixed bottom-16 right-4 z-50">
      <Button 
        onClick={handleInstallClick}
        className="flex items-center gap-2 shadow-lg bg-black hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
      >
        <img 
          src="/lovable-uploads/95f9c287-86ca-4428-bbc4-b9c9b75478b9.png" 
          alt="The Triage System" 
          className="w-4 h-4 mr-1"
        />
        Add to Home Screen
      </Button>
    </div>
  );
};

export default PWADetector;
