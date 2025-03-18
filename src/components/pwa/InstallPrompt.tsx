
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
    // Force the prompt to appear for testing/debugging
    const forcePrompt = new URLSearchParams(window.location.search).get('pwa-prompt');
    
    // Enhanced browser and device detection
    const detectBrowser = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      let browserName = 'Unknown';
      let version = '';
      
      // More precise browser detection
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
      
      // Enhanced OS and device detection
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
    
    // Don't show if already in standalone mode (unless forced)
    if (browser.isStandalone && !forcePrompt) {
      console.log('App is already installed and running in standalone mode');
      return;
    }
    
    // Enhanced install prompt timing logic
    const shouldPrompt = () => {
      const lastPrompt = localStorage.getItem('installPromptDismissed');
      const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
      
      // First-time visitor: set flag but don't show immediately
      if (!hasVisitedBefore) {
        localStorage.setItem('hasVisitedBefore', 'true');
        return false;
      }
      
      // Force prompt for testing
      if (forcePrompt) return true;
      
      // Show if we haven't prompted before or it's been more than 3 days
      return !lastPrompt || daysBetween(new Date(lastPrompt), new Date()) > 3;
    };
    
    // Check if the user has previously seen the prompt and dismissed it
    const checkForReturningUser = () => {
      const lastDismissed = localStorage.getItem('installPromptDismissed');
      const hasExitedWithoutInstall = localStorage.getItem('exitedWithoutInstall');
      
      // If they've previously dismissed but didn't install, and it's a return visit
      if (lastDismissed && hasExitedWithoutInstall === 'true' && !browser.isStandalone) {
        // Show the prompt again, but with a delay to not be intrusive immediately
        setTimeout(() => {
          setIsVisible(true);
          // Add a toast notification as a gentle reminder
          toast({
            title: "Install The Triage System",
            description: "Get the best experience by installing our app to your device",
            duration: 8000
          });
        }, 30000); // 30 second delay
      }
    };
    
    // Handle Chrome on Android specific handler
    const handleAndroidChrome = () => {
      // For Chrome on Android, we need to be more aggressive with the install prompt
      if (browser.isAndroid && browser.name === 'Chrome') {
        // Always check if app is already installed via display-mode
        if (!browser.isStandalone && shouldPrompt()) {
          console.log('Chrome on Android detected - showing install prompt');
          // For Chrome on Android, we'll show our prompt after a short delay
          // even if the beforeinstallprompt event never fires
          setTimeout(() => {
            if (!installPrompt && !isVisible) {
              setIsVisible(true);
            }
          }, 3000);
        }
      }
    };
    
    // Specific handling for iOS browsers
    if (browser.isIOS) {
      if (shouldPrompt()) {
        // Show prompt after a delay for better UX
        setTimeout(() => setIsVisible(true), 3000);
      }
      checkForReturningUser();
      return;
    }
    
    // Browsers without standard beforeinstallprompt but that support PWAs
    if ((browser.isAndroid && (browser.name === 'Samsung Internet' || browser.name === 'UC Browser')) || 
        browser.name === 'Firefox' || 
        browser.name === 'DuckDuckGo') {
      if (shouldPrompt()) {
        setTimeout(() => setIsVisible(true), 3000);
      }
      checkForReturningUser();
      return;
    }
    
    // Handle Chrome on Android (most common PWA install scenario)
    handleAndroidChrome();
    
    // Standard beforeinstallprompt handler for Chrome, Edge, etc.
    const handleBeforeInstallPrompt = (e: Event) => {
      // Always prevent default to disable mini-infobar
      e.preventDefault();
      console.log('Captured beforeinstallprompt event', e);
      
      // Store event for later use
      setInstallPrompt(e as BeforeInstallPromptEvent);
      
      // Show our custom prompt if appropriate
      if (shouldPrompt()) {
        setTimeout(() => setIsVisible(true), 2000);
      }
    };
    
    // Add prompt handler and explicitly log it
    console.log('Adding beforeinstallprompt event listener');
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Fallback installer for browsers where beforeinstallprompt might not fire consistently
    if (shouldPrompt()) {
      // Backup check after 5 seconds in case beforeinstallprompt never fired
      setTimeout(() => {
        if (!installPrompt && !isVisible) {
          console.log('beforeinstallprompt never fired, showing prompt anyway');
          setIsVisible(true);
        }
      }, 5000);
    }
    
    // Check for returning users who didn't install
    checkForReturningUser();
    
    // Track when users exit the page without installing
    const handleBeforeUnload = () => {
      // If the prompt was shown but the app isn't installed, mark as exited without install
      if (!browser.isStandalone && localStorage.getItem('installPromptDismissed')) {
        localStorage.setItem('exitedWithoutInstall', 'true');
        localStorage.setItem('lastExitTime', new Date().toISOString());
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Track successful installs
    window.addEventListener('appinstalled', (e) => {
      console.log('PWA was installed', e);
      setIsVisible(false);
      localStorage.setItem('appInstalled', 'true');
      // Remove the exited without install flag
      localStorage.removeItem('exitedWithoutInstall');
      toast({
        title: "Installation Complete",
        description: "The Triage System has been successfully installed!"
      });
    });
    
    // Show a return prompt if they visit in a browser after installing
    const checkReturnVisit = () => {
      const hasInstalledBefore = localStorage.getItem('appInstalled') === 'true';
      if (hasInstalledBefore && !browser.isStandalone) {
        setTimeout(() => {
          toast({
            title: "Open in Installed App",
            description: "You've installed The Triage System. Would you like to open it?",
            action: <Button size="sm" onClick={() => {
              window.location.href = "/";
            }}>Open App</Button>
          });
        }, 5000);
      }
    };
    
    checkReturnVisit();
    
    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [toast]);
  
  const handleInstallClick = async () => {
    // Track that the user initiated an install attempt
    console.log('Install button clicked');
    try {
      // For browsers with native install prompt
      if (installPrompt) {
        console.log('Triggering native browser install prompt');
        await installPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const choiceResult = await installPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          localStorage.setItem('appInstalled', 'true');
          localStorage.removeItem('exitedWithoutInstall');
          toast({
            title: "Installing The Triage System",
            description: "Thank you for installing our app!"
          });
          setIsVisible(false);
        } else {
          console.log('User dismissed the install prompt');
          // Save the dismissal time
          localStorage.setItem('installPromptDismissed', new Date().toISOString());
        }
        
        // Clear the saved prompt since it can't be used again
        setInstallPrompt(null);
      } else {
        // For browsers without beforeinstallprompt support or if it failed
        console.log('No native install prompt available, showing browser-specific instructions');
        setShowInstructions(true);
        showBrowserSpecificInstructions(browserInfo.name, browserInfo.isIOS, browserInfo.isAndroid);
      }
    } catch (error) {
      console.error('Error during install attempt:', error);
      // Fallback to manual instructions
      setShowInstructions(true);
      showBrowserSpecificInstructions(browserInfo.name, browserInfo.isIOS, browserInfo.isAndroid);
    }
  };
  
  const handleDismiss = () => {
    console.log('User dismissed the install prompt');
    setIsVisible(false);
    setShowInstructions(false);
    
    // Save the current time to localStorage
    localStorage.setItem('installPromptDismissed', new Date().toISOString());
  };
  
  const showIOSInstructions = () => {
    // iOS-specific instructions
    toast({
      title: "Install on iOS",
      description: "1. Tap the Share button (📤) at the bottom of your screen\n2. Scroll down and tap 'Add to Home Screen'\n3. Tap 'Add' in the top right corner",
      duration: 15000
    });
  };
  
  const showBrowserSpecificInstructions = (browser: string, isIOS: boolean, isAndroid: boolean) => {
    if (isIOS) {
      showIOSInstructions();
      return;
    }
    
    let title = `Install on ${browser}`;
    let instructions = "";
    
    // Enhanced browser-specific instructions
    switch(browser.toLowerCase()) {
      case "chrome":
        if (isAndroid) {
          // Most common case - Chrome on Android
          instructions = "1. Tap the menu button (⋮) in the top right\n2. Select 'Install App' or 'Add to Home Screen'\n3. Tap 'Install' in the prompt\n\nIf you don't see 'Install App', try refreshing the page and waiting a moment.";
          
          // For Chrome on Android, we can try to retrigger the install prompt via reload
          // This can help in cases where Chrome didn't show the prompt initially
          if (!localStorage.getItem('hasTriedReload')) {
            localStorage.setItem('hasTriedReload', 'true');
            toast({
              title: "Install on Chrome",
              description: instructions,
              action: <Button size="sm" onClick={() => {
                window.location.reload();
              }}>Reload & Try Again</Button>,
              duration: 15000
            });
            return;
          }
        } else {
          instructions = "1. Click the menu button (⋮) in the top right\n2. Select 'Install The Triage System...'\n3. Click 'Install' in the prompt";
        }
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
        if (isAndroid) {
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
          className="fixed bottom-4 left-4 right-4 mx-auto max-w-md bg-[#221F26] p-4 rounded-lg shadow-lg z-50 border border-[#403E43]"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1 text-white">Install The Triage System</h3>
              <p className="text-sm text-gray-300 mb-3">
                {browserInfo.isIOS 
                  ? "Install our app on your iPhone for the best experience"
                  : browserInfo.isAndroid && browserInfo.name === "Chrome"
                    ? "Add The Triage System to your home screen for fast access"
                    : browserInfo.isMobile
                      ? "Get our app on your home screen for quick access"
                      : "Install for a faster experience with offline access"}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleInstallClick}
                  className="flex-1 bg-[#bfaa4a] hover:bg-[#bfaa4a]/90 text-black"
                >
                  <Download className="w-4 h-4 mr-2" /> 
                  Install App
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => showBrowserSpecificInstructions(browserInfo.name, browserInfo.isIOS, browserInfo.isAndroid)}
                  className="flex-1 border-[#bfaa4a] text-[#bfaa4a]"
                >
                  <Info className="w-4 h-4 mr-2" /> 
                  Show Instructions
                </Button>
              </div>
            </div>
            
            <button 
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-gray-700"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-300" />
            </button>
          </div>
          
          {/* Browser-specific tips */}
          <div className="mt-3 pt-2 border-t border-[#403E43]">
            <p className="text-xs text-gray-400 flex items-center">
              <Info className="w-3 h-3 mr-1 inline" />
              {browserInfo.isIOS && browserInfo.name === 'Safari' 
                ? "Tap the share icon (📤) then 'Add to Home Screen'"
                : browserInfo.isAndroid && browserInfo.name === 'Chrome'
                  ? "Open Chrome menu (⋮), then tap 'Install App'"
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
