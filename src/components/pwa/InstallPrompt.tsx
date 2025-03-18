
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOSDialogOpen, setIsIOSDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if user is on mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      return /android|iPad|iPhone|iPod/.test(userAgent);
    };
    
    setIsMobile(checkMobile());
    
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    if (isStandalone) {
      console.log('App is already installed and running in standalone mode');
      return;
    }
    
    // Capture the beforeinstallprompt event
    const beforeInstallPromptHandler = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Store the event so it can be triggered later
      console.log('Captured beforeinstallprompt event');
      setInstallPrompt(e as BeforeInstallPromptEvent);
      
      // Only show our custom prompt for mobile users
      if (checkMobile()) {
        // Show our custom prompt after a short delay
        setTimeout(() => {
          const lastPrompt = localStorage.getItem('installPromptDismissed');
          const currentDate = new Date().toISOString();
          
          if (!lastPrompt || daysBetween(new Date(lastPrompt), new Date()) > 3) {
            console.log('Showing custom install prompt');
            setIsVisible(true);
          }
        }, 3000);
      }
    };
    
    console.log('Adding beforeinstallprompt event listener');
    window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);
    
    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
    };
  }, []);
  
  const handleInstallClick = async () => {
    if (!installPrompt) {
      // Show iOS instructions instead
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        setIsIOSDialogOpen(true);
      }
      return;
    }
    
    // Show the browser install prompt
    console.log('Triggering browser install prompt');
    installPrompt.prompt();
    
    try {
      // Wait for the user to respond to the prompt
      const choiceResult = await installPrompt.userChoice;
      
      // User accepted installation
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        toast({
          title: "Installing The Triage System",
          description: "Thank you for installing our app!"
        });
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (err) {
      console.error('Error with install prompt:', err);
    }
    
    // Clear the saved prompt since it can't be used again
    setInstallPrompt(null);
    setIsVisible(false);
  };
  
  const handleDismiss = () => {
    console.log('User dismissed our custom install prompt');
    setIsVisible(false);
    // Save the current time to localStorage so we don't prompt again for a while
    localStorage.setItem('installPromptDismissed', new Date().toISOString());
  };
  
  const daysBetween = (date1: Date, date2: Date) => {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const diffDays = Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
    return diffDays;
  };
  
  // Don't show anything if not on mobile
  if (!isMobile && !window.location.search.includes('showInstallPrompt=true')) {
    return null;
  }
  
  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <img 
                    src="/lovable-uploads/95f9c287-86ca-4428-bbc4-b9c9b75478b9.png" 
                    alt="The Triage System" 
                    className="w-8 h-8 mr-2"
                  />
                  <h3 className="font-semibold text-lg">Install The Triage System</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Add to your home screen for a better experience and offline access.
                </p>
                <Button 
                  onClick={handleInstallClick}
                  className="w-full bg-black hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  <Download className="w-4 h-4 mr-2" /> Install App
                </Button>
              </div>
              <button 
                onClick={handleDismiss}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Dialog open={isIOSDialogOpen} onOpenChange={setIsIOSDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install The Triage System</DialogTitle>
            <DialogDescription>
              Follow these steps to add The Triage System to your home screen:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-2">
                <Share className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Step 1:</p>
                <p className="text-sm text-gray-500">Tap the Share button in Safari</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-2">
                <span className="text-sm font-bold">+</span>
              </div>
              <div>
                <p className="font-medium">Step 2:</p>
                <p className="text-sm text-gray-500">Tap "Add to Home Screen"</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-2">
                <span className="text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="font-medium">Step 3:</p>
                <p className="text-sm text-gray-500">Tap "Add" in the top-right corner</p>
              </div>
            </div>
          </div>
          <Button onClick={() => setIsIOSDialogOpen(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallPrompt;
