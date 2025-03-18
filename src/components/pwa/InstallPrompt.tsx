
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink } from 'lucide-react';
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
    isAndroid: boolean;
    isMobile: boolean;
  }>({
    name: '',
    isIOS: false,
    isStandalone: false,
    isAndroid: false,
    isMobile: false
  });
  const { toast } = useToast();
  
  useEffect(() => {
    // Detect browser and device info
    const detectBrowser = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      let browserName = 'Unknown';
      
      // Detect browser
      if (userAgent.includes('edge') || userAgent.includes('edg')) {
        browserName = 'Edge';
      } else if (userAgent.includes('chrome') || userAgent.includes('chromium') || userAgent.includes('crios')) {
        browserName = 'Chrome';
      } else if (userAgent.includes('firefox') || userAgent.includes('fxios')) {
        browserName = 'Firefox';
      } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        browserName = 'Safari';
      } else if (userAgent.includes('opera') || userAgent.includes('opr')) {
        browserName = 'Opera';
      } else if (userAgent.includes('msie') || userAgent.includes('trident')) {
        browserName = 'Internet Explorer';
      } else if (userAgent.includes('samsung')) {
        browserName = 'Samsung Internet';
      }
      
      // Detect OS and device type
      const isIOS = /ipad|iphone|ipod/.test(userAgent) && !(window as any).MSStream;
      const isAndroid = /android/.test(userAgent);
      const isMobile = /mobile|tablet|ipad|iphone|ipod|android/.test(userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      
      return { 
        name: browserName, 
        isIOS, 
        isStandalone, 
        isAndroid,
        isMobile
      };
    };
    
    const browser = detectBrowser();
    setBrowserInfo(browser);
    console.log('Browser detected:', browser);
    
    // Don't show the prompt if already installed/standalone mode
    if (browser.isStandalone) {
      console.log('App is already installed and running in standalone mode');
      return;
    }
    
    // Check if we've prompted recently
    const shouldPrompt = () => {
      const lastPrompt = localStorage.getItem('installPromptDismissed');
      // Show prompt if we haven't shown it before or if it's been more than 3 days
      return !lastPrompt || daysBetween(new Date(lastPrompt), new Date()) > 3;
    };
    
    // For iOS Safari, we need a custom approach with delayed prompt
    if (browser.isIOS) {
      if (shouldPrompt()) {
        setTimeout(() => setIsVisible(true), 3000);
      }
      return;
    }
    
    // For Android Samsung Internet or other browsers without BeforeInstallPrompt support
    if ((browser.isAndroid && browser.name === 'Samsung Internet') || 
        browser.name === 'Firefox' || 
        browser.name === 'Internet Explorer') {
      if (shouldPrompt()) {
        setTimeout(() => setIsVisible(true), 3000);
      }
      return;
    }
    
    // For Chrome, Edge, and other browsers that support BeforeInstallPrompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      console.log('Captured beforeinstallprompt event', e);
      // Store the event so it can be triggered later
      setInstallPrompt(e as BeforeInstallPromptEvent);
      
      // Show our custom prompt
      if (shouldPrompt()) {
        setTimeout(() => setIsVisible(true), 3000);
      }
    };
    
    console.log('Adding beforeinstallprompt event listener');
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // For other mobile browsers, show a prompt after delay if appropriate
    if (browser.isMobile && !browser.isIOS && !browser.isStandalone) {
      if (shouldPrompt()) {
        setTimeout(() => {
          // If we haven't captured beforeinstallprompt by now, show custom instructions
          if (!installPrompt) {
            setIsVisible(true);
          }
        }, 5000);
      }
    }
    
    // For desktop browsers, show a more subtle prompt after a longer delay
    if (!browser.isMobile && !browser.isStandalone) {
      if (shouldPrompt()) {
        setTimeout(() => {
          if (!installPrompt) {
            setIsVisible(true);
          }
        }, 10000);
      }
    }
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleInstallClick = async () => {
    if (browserInfo.isIOS) {
      showIOSInstructions();
      return;
    }
    
    // For browsers that support the beforeinstallprompt event
    if (installPrompt) {
      console.log('Triggering browser install prompt');
      try {
        await installPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const choiceResult = await installPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          toast({
            title: "Installing App",
            description: "Thank you for installing our app!"
          });
          setIsVisible(false);
        } else {
          console.log('User dismissed the install prompt');
          // Save the dismissal time so we don't prompt again too soon
          localStorage.setItem('installPromptDismissed', new Date().toISOString());
        }
      } catch (err) {
        console.error('Error with install prompt:', err);
        // Show browser-specific instructions as fallback
        showBrowserSpecificInstructions(browserInfo.name);
      }
      
      // Clear the saved prompt since it can't be used again
      setInstallPrompt(null);
    } else {
      // For browsers without beforeinstallprompt support
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
      title: "Install Triagenius",
      description: "To install: tap the share icon (📤) at the bottom of your screen, then 'Add to Home Screen'",
      duration: 10000
    });
  };
  
  const showBrowserSpecificInstructions = (browser: string) => {
    let instructions = "";
    
    switch(browser.toLowerCase()) {
      case "chrome":
        if (browserInfo.isAndroid) {
          instructions = "Tap the menu (⋮) and select 'Add to Home Screen'";
        } else {
          instructions = "Click the menu (⋮) in the top right, then 'Install Triagenius...'";
        }
        break;
      case "edge":
        instructions = "Click the menu (...) and select 'Apps > Install this site as an app'";
        break;
      case "firefox":
        if (browserInfo.isAndroid) {
          instructions = "Tap the menu (⋮) and select 'Add to Home Screen'";
        } else {
          instructions = "Click the menu (≡), then click the '+' icon in the address bar";
        }
        break;
      case "safari":
        instructions = "Tap the share icon (📤) at the bottom of the screen, then 'Add to Home Screen'";
        break;
      case "opera":
        instructions = "Tap the menu (⋮) and select 'Add to Home screen'";
        break;
      case "samsung internet":
        instructions = "Tap the menu (⋮) and select 'Add page to' then 'Home screen'";
        break;
      case "internet explorer":
        instructions = "Click the pin icon in the address bar and select 'Pin to Start'";
        break;
      default:
        if (browserInfo.isAndroid) {
          instructions = "Tap the menu button (usually ⋮ or ≡) and look for 'Add to Home Screen' or 'Install App'";
        } else {
          instructions = "Look for 'Install App' or 'Add to Home Screen' in your browser's menu";
        }
    }
    
    toast({
      title: "Install Triagenius",
      description: instructions,
      duration: 15000
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
          className="fixed bottom-4 left-4 right-4 mx-auto max-w-md bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Install Triagenius</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {browserInfo.isIOS 
                  ? "Get a better experience by adding this app to your home screen"
                  : "Install our app for a faster, fullscreen experience with offline access"}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleInstallClick}
                  className="flex-1 bg-black hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  <Download className="w-4 h-4 mr-2" /> Install App
                </Button>
                {browserInfo.isIOS && (
                  <Button 
                    variant="outline"
                    onClick={() => showIOSInstructions()}
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> Show Steps
                  </Button>
                )}
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Mini instructions based on browser */}
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {browserInfo.name && (
              <p>
                {browserInfo.name === 'Safari' && browserInfo.isIOS ? 
                  "Tap share icon (📤) then 'Add to Home Screen'" :
                  browserInfo.name === 'Chrome' ? 
                  "Look for 'Install app' in the menu (⋮)" :
                  browserInfo.name === 'Firefox' ?
                  "Look for '+' in the address bar or menu" :
                  "Look for install or 'Add to Home Screen' option"}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
