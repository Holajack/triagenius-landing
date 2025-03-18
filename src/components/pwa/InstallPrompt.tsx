
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
  const [browserInfo, setBrowserInfo] = useState<{
    name: string;
    isIOS: boolean;
    isStandalone: boolean;
  }>({
    name: '',
    isIOS: false,
    isStandalone: false
  });
  const { toast } = useToast();
  
  useEffect(() => {
    // Detect browser
    const detectBrowser = () => {
      const userAgent = navigator.userAgent;
      let browserName = 'Unknown';
      
      if (userAgent.match(/chrome|chromium|crios/i)) {
        browserName = 'Chrome';
      } else if (userAgent.match(/firefox|fxios/i)) {
        browserName = 'Firefox';
      } else if (userAgent.match(/safari/i)) {
        browserName = 'Safari';
      } else if (userAgent.match(/opr\//i)) {
        browserName = 'Opera';
      } else if (userAgent.match(/edg/i)) {
        browserName = 'Edge';
      } else if (userAgent.match(/android/i)) {
        browserName = 'Android';
      } else if (userAgent.match(/iphone|ipad|ipod/i)) {
        browserName = 'iOS';
      }
      
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      
      return { name: browserName, isIOS, isStandalone };
    };
    
    const browser = detectBrowser();
    setBrowserInfo(browser);
    
    // If already installed/standalone mode, don't show the prompt
    if (browser.isStandalone) {
      console.log('App is already installed and running in standalone mode');
      return;
    }
    
    // For iOS Safari, we need a custom approach
    if (browser.isIOS) {
      // Check if we haven't shown the prompt recently
      const lastPrompt = localStorage.getItem('installPromptDismissed');
      if (!lastPrompt || daysBetween(new Date(lastPrompt), new Date()) > 3) {
        setTimeout(() => setIsVisible(true), 2000);
      }
      return;
    }
    
    // For Chrome and other browsers supporting BeforeInstallPromptEvent
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      console.log('Captured beforeinstallprompt event', e);
      // Store the event so it can be triggered later
      setInstallPrompt(e as BeforeInstallPromptEvent);
      
      // Show our custom prompt after a short delay
      const lastPrompt = localStorage.getItem('installPromptDismissed');
      if (!lastPrompt || daysBetween(new Date(lastPrompt), new Date()) > 3) {
        setTimeout(() => setIsVisible(true), 2000);
      }
    };
    
    console.log('Adding beforeinstallprompt event listener');
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Always show the prompt for browsers without beforeinstallprompt support
    // but not iOS (handled separately) and not already in standalone mode
    if (!browser.isIOS && !browser.isStandalone) {
      const lastPrompt = localStorage.getItem('installPromptDismissed');
      if (!lastPrompt || daysBetween(new Date(lastPrompt), new Date()) > 3) {
        // Delay showing prompt slightly to avoid immediate popup
        setTimeout(() => {
          // If we haven't captured beforeinstallprompt, show custom instructions
          if (!installPrompt) {
            setIsVisible(true);
          }
        }, 3000);
      }
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleInstallClick = async () => {
    if (browserInfo.isIOS) {
      showIOSInstructions();
      return;
    }
    
    // For Chrome and other browsers that support the beforeinstallprompt event
    if (installPrompt) {
      console.log('Triggering browser install prompt');
      installPrompt.prompt();
      
      try {
        // Wait for the user to respond to the prompt
        const choiceResult = await installPrompt.userChoice;
        
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
    } else {
      // For browsers that don't support beforeinstallprompt
      // Show browser-specific installation instructions
      showBrowserSpecificInstructions(browserInfo.name);
    }
  };
  
  const handleDismiss = () => {
    console.log('User dismissed our custom install prompt');
    setIsVisible(false);
    // Save the current time to localStorage so we don't prompt again for a while
    localStorage.setItem('installPromptDismissed', new Date().toISOString());
  };
  
  const showIOSInstructions = () => {
    toast({
      title: "Install this app",
      description: "To install: tap the share icon, then 'Add to Home Screen'",
      duration: 10000
    });
  };
  
  const showBrowserSpecificInstructions = (browser: string) => {
    let instructions = "Add this app to your home screen for a better experience.";
    
    switch(browser) {
      case "Chrome":
        instructions = "Click the menu (⋮) and select 'Install App' or 'Add to Home Screen'";
        break;
      case "Edge":
        instructions = "Click the menu (...) and select 'Apps > Install this site as an app'";
        break;
      case "Firefox":
        instructions = "Click the menu (≡) and select 'Install' or visit about:addons";
        break;
      case "Safari":
        instructions = "Tap the share icon and select 'Add to Home Screen'";
        break;
      case "Opera":
        instructions = "Click the menu and select 'Add to home screen'";
        break;
    }
    
    toast({
      title: "Install Triagenius",
      description: instructions,
      duration: 10000
    });
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
                {browserInfo.isIOS 
                  ? "Install our app: tap the share icon then 'Add to Home Screen'"
                  : "Install our app for a better experience and offline access."}
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
