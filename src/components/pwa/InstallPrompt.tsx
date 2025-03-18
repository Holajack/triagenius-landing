
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
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
      
      // Show our custom prompt after a short delay
      setTimeout(() => {
        const lastPrompt = localStorage.getItem('installPromptDismissed');
        const currentDate = new Date().toISOString();
        
        if (!lastPrompt || daysBetween(new Date(lastPrompt), new Date()) > 7) {
          console.log('Showing custom install prompt');
          setIsVisible(true);
        }
      }, 2000);
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
        showIOSInstructions();
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
          title: "Installing App",
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
  
  const showIOSInstructions = () => {
    // Instructions for iOS users to add to home screen
    toast({
      title: "Install this app",
      description: "To install: tap the share icon, then 'Add to Home Screen'",
      duration: 10000
    });
    handleDismiss();
  };
  
  const daysBetween = (date1: Date, date2: Date) => {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const diffDays = Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
    return diffDays;
  };
  
  if (!isVisible) {
    return null;
  }
  
  return (
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
              <h3 className="font-semibold text-lg mb-1">Install Triagenius</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Install our app for a better experience and offline access.
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
  );
};

export default InstallPrompt;
