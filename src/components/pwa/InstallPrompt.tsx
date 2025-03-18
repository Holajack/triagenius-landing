
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<{
    name: string;
    version: string;
    isIOS: boolean;
    isStandalone: boolean;
    isAndroid: boolean;
    isMobile: boolean;
    isDesktop: boolean;
  }>({
    name: '',
    version: '',
    isIOS: false,
    isStandalone: false,
    isAndroid: false,
    isMobile: false,
    isDesktop: false
  });
  const { toast } = useToast();
  
  useEffect(() => {
    // Force the prompt to appear on all browsers for development/testing
    const forcePrompt = new URLSearchParams(window.location.search).get('pwa-prompt');
    
    // Detect browser and device info with improved detection
    const detectBrowser = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      let browserName = 'Unknown';
      let version = '';
      
      // Detect browser with more precision
      if (userAgent.includes('edg/') || userAgent.includes('edge/')) {
        browserName = 'Edge';
        version = userAgent.match(/edg?\/([0-9]+)/) ? 
                 userAgent.match(/edg?\/([0-9]+)/)?.[1] || '' : '';
      } else if (userAgent.includes('chrome') && !userAgent.includes('opr/') && !userAgent.includes('edg')) {
        browserName = 'Chrome';
        version = userAgent.match(/chrome\/([0-9]+)/) ? 
                 userAgent.match(/chrome\/([0-9]+)/)?.[1] || '' : '';
      } else if (userAgent.includes('firefox')) {
        browserName = 'Firefox';
        version = userAgent.match(/firefox\/([0-9]+)/) ? 
                 userAgent.match(/firefox\/([0-9]+)/)?.[1] || '' : '';
      } else if (userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('android')) {
        browserName = 'Safari';
        version = userAgent.match(/version\/([0-9]+)/) ? 
                 userAgent.match(/version\/([0-9]+)/)?.[1] || '' : '';
      } else if (userAgent.includes('opr/') || userAgent.includes('opera')) {
        browserName = 'Opera';
        version = userAgent.match(/(?:opr|opera)\/([0-9]+)/) ? 
                 userAgent.match(/(?:opr|opera)\/([0-9]+)/)?.[1] || '' : '';
      } else if (userAgent.includes('msie') || userAgent.includes('trident')) {
        browserName = 'Internet Explorer';
        version = userAgent.match(/(?:msie |rv:)([0-9]+)/) ? 
                 userAgent.match(/(?:msie |rv:)([0-9]+)/)?.[1] || '' : '';
      } else if (userAgent.includes('ucbrowser')) {
        browserName = 'UC Browser';
        version = userAgent.match(/ucbrowser\/([0-9]+)/) ? 
                 userAgent.match(/ucbrowser\/([0-9]+)/)?.[1] || '' : '';
      } else if (userAgent.includes('samsungbrowser')) {
        browserName = 'Samsung Internet';
        version = userAgent.match(/samsungbrowser\/([0-9]+)/) ? 
                 userAgent.match(/samsungbrowser\/([0-9]+)/)?.[1] || '' : '';
      } else if (userAgent.includes('crios')) {
        browserName = 'Chrome iOS';
        version = userAgent.match(/crios\/([0-9]+)/) ? 
                 userAgent.match(/crios\/([0-9]+)/)?.[1] || '' : '';
      } else if (userAgent.includes('fxios')) {
        browserName = 'Firefox iOS';
        version = userAgent.match(/fxios\/([0-9]+)/) ? 
                 userAgent.match(/fxios\/([0-9]+)/)?.[1] || '' : '';
      } else if (userAgent.includes('duckduckgo')) {
        browserName = 'DuckDuckGo';
      } else if (userAgent.includes('brave')) {
        browserName = 'Brave';
      }
      
      // Detect OS and device type with more precision
      const isIOS = /ipad|iphone|ipod/.test(userAgent) && !(window as any).MSStream;
      const isAndroid = /android/.test(userAgent);
      const isMobile = /mobi|tablet|ipad|iphone|ipod|android/.test(userAgent) || 
                       (typeof window !== 'undefined' && window.innerWidth < 768);
      const isDesktop = !isMobile;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      
      return {
        name: browserName,
        version,
        isIOS,
        isStandalone,
        isAndroid,
        isMobile,
        isDesktop
      };
    };
    
    const browser = detectBrowser();
    setBrowserInfo(browser);
    console.log('Browser detected:', browser);
    
    // Don't show the prompt if already installed/standalone mode
    if (browser.isStandalone && !forcePrompt) {
      console.log('App is already installed and running in standalone mode');
      return;
    }
    
    // Check if we've prompted recently
    const shouldPrompt = () => {
      const lastPrompt = localStorage.getItem('installPromptDismissed');
      // Show prompt if we haven't shown it before or if it's been more than 3 days
      return !lastPrompt || daysBetween(new Date(lastPrompt), new Date()) > 3 || forcePrompt;
    };
    
    // For iOS devices, show the prompt after a delay with custom instructions
    if (browser.isIOS) {
      if (shouldPrompt()) {
        // Show prompt after a few seconds of user engagement
        setTimeout(() => setIsVisible(true), 3000);
      }
      return;
    }
    
    // For browsers that might not support BeforeInstallPrompt natively but still support PWAs
    if ((browser.isAndroid && (browser.name === 'Samsung Internet' || browser.name === 'UC Browser')) || 
        browser.name === 'Firefox' || 
        browser.name === 'DuckDuckGo') {
      if (shouldPrompt()) {
        setTimeout(() => setIsVisible(true), 3000);
      }
      return;
    }
    
    // For Chrome, Edge, Opera and other browsers that support BeforeInstallPrompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      console.log('Captured beforeinstallprompt event', e);
      
      // Store the event so it can be triggered later
      setInstallPrompt(e as BeforeInstallPromptEvent);
      
      // Show our custom prompt after a delay for better user experience
      if (shouldPrompt()) {
        setTimeout(() => setIsVisible(true), 3000);
      }
    };
    
    console.log('Adding beforeinstallprompt event listener');
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // For browsers where we haven't detected the beforeinstallprompt event 
    if (shouldPrompt()) {
      setTimeout(() => {
        if (!installPrompt && !isVisible) {
          setIsVisible(true);
        }
      }, 5000);
    }
    
    // Track app installed event
    window.addEventListener('appinstalled', (e) => {
      console.log('PWA was installed', e);
      setIsVisible(false);
      toast({
        title: "Installation Complete",
        description: "Triagenius has been successfully installed!"
      });
    });
    
    // Show a return prompt if they visit in a browser after installing
    const checkReturnVisit = () => {
      const hasInstalledBefore = localStorage.getItem('appInstalled') === 'true';
      if (hasInstalledBefore && !browser.isStandalone) {
        setTimeout(() => {
          toast({
            title: "Open in Installed App",
            description: "You've installed Triagenius. Would you like to open it?",
            action: <Button size="sm" onClick={() => {
              window.location.href = "/";
            }}>Open App</Button>
          });
        }, 5000);
      }
    };
    
    checkReturnVisit();
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [toast]);
  
  const handleInstallClick = async () => {
    // Track that the user initiated an install attempt
    try {
      // For browsers with native install prompt
      if (installPrompt) {
        console.log('Triggering browser install prompt');
        await installPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const choiceResult = await installPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          localStorage.setItem('appInstalled', 'true');
          toast({
            title: "Installing Triagenius",
            description: "Thank you for installing our app!"
          });
          setIsVisible(false);
        } else {
          console.log('User dismissed the install prompt');
          // Save the dismissal time so we don't prompt again too soon
          localStorage.setItem('installPromptDismissed', new Date().toISOString());
        }
        
        // Clear the saved prompt since it can't be used again
        setInstallPrompt(null);
      } else {
        // For browsers without beforeinstallprompt support
        setShowInstructions(true);
        showBrowserSpecificInstructions(browserInfo.name, browserInfo.isIOS);
      }
    } catch (error) {
      console.error('Error during install attempt:', error);
      // Fallback to manual instructions 
      setShowInstructions(true);
      showBrowserSpecificInstructions(browserInfo.name, browserInfo.isIOS);
    }
  };
  
  const handleDismiss = () => {
    console.log('User dismissed the install prompt');
    setIsVisible(false);
    setShowInstructions(false);
    
    // Save the current time to localStorage so we don't prompt again for a while
    localStorage.setItem('installPromptDismissed', new Date().toISOString());
  };
  
  const showIOSInstructions = () => {
    // Show iOS-specific instructions
    toast({
      title: "Install on iOS",
      description: "1. Tap the Share button (📤) at the bottom of your screen\n2. Scroll down and tap 'Add to Home Screen'\n3. Tap 'Add' in the top right corner",
      duration: 15000
    });
  };
  
  const showBrowserSpecificInstructions = (browser: string, isIOS: boolean) => {
    if (isIOS) {
      showIOSInstructions();
      return;
    }
    
    let title = `Install on ${browser}`;
    let instructions = "";
    
    // Specific instructions for each browser
    switch(browser.toLowerCase()) {
      case "chrome":
        instructions = "1. Tap the menu button (⋮) in the top right\n2. Select 'Install App' or 'Add to Home Screen'\n3. Tap 'Install' in the prompt";
        break;
      case "edge":
        instructions = "1. Tap the menu button (...) in the bottom\n2. Select 'Add to Phone'\n3. Tap 'Install' in the prompt";
        break;
      case "firefox":
        instructions = "1. Tap the menu button (⋮) in the top right\n2. Select 'Install' or "+ 
                      "'Add to Home Screen'\n3. Follow the on-screen instructions";
        break;
      case "opera":
        instructions = "1. Tap the Opera icon at the bottom\n2. Select 'Home Screen'\n3. Tap 'Add' to confirm";
        break;
      case "samsung internet":
        instructions = "1. Tap the menu button (⋮) at the bottom\n2. Select 'Add page to'\n3. Tap 'Home screen'\n4. Tap 'Add' to confirm";
        break;
      case "uc browser":
        instructions = "1. Tap the menu button at the bottom\n2. Select 'Add to Home Screen'\n3. Tap 'Add' to confirm";
        break;
      case "duckduckgo":
        instructions = "1. Tap the menu button (...) in the top right\n2. Select 'Add to Home Screen'\n3. Tap 'Add' to confirm";
        break;
      default:
        if (browserInfo.isAndroid) {
          instructions = "1. Look for a 'Add to Home Screen' or 'Install App' option in your browser's menu\n2. Follow the on-screen instructions to complete installation";
        } else {
          instructions = "Most desktop browsers support PWA installation. Look for an install icon in the address bar or in the browser's menu.";
        }
    }
    
    toast({
      title: title,
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
                  ? "Install our app on your iPhone for the best experience"
                  : browserInfo.isMobile
                    ? "Get our app on your home screen for quick access"
                    : "Install for a faster experience with offline access"}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleInstallClick}
                  className="flex-1 bg-black hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  <Download className="w-4 h-4 mr-2" /> 
                  Install Triagenius
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => showBrowserSpecificInstructions(browserInfo.name, browserInfo.isIOS)}
                  className="flex-1"
                >
                  <Info className="w-4 h-4 mr-2" /> 
                  Show Instructions
                </Button>
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
          
          {/* Browser-specific tips */}
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <Info className="w-3 h-3 mr-1 inline" />
              {browserInfo.isIOS && browserInfo.name === 'Safari' 
                ? "Tap the share icon (📤) then 'Add to Home Screen'"
                : browserInfo.name === 'Chrome' 
                  ? "Look for 'Install' in Chrome's menu (⋮)"
                  : browserInfo.isAndroid && browserInfo.name === 'Samsung Internet'
                    ? "Tap menu (⋮) then 'Add page to' → 'Home screen'"
                    : "Install to get the full app experience"}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
