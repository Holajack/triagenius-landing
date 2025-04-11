
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWADetector = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [permissionsRequested, setPermissionsRequested] = useState(false);
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
        
        // Request necessary permissions for PWA functionality only once
        const permissionsRequested = localStorage.getItem('permissionsRequested');
        if (!permissionsRequested) {
          setTimeout(() => {
            requestPWAPermissions();
            localStorage.setItem('permissionsRequested', 'true');
            setPermissionsRequested(true);
          }, 3000);
        }
      }
    };
    
    checkStandalone();
    
    // Set viewport meta tag for better mobile keyboard handling
    const setViewportForKeyboard = () => {
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-visual';
        document.head.appendChild(meta);
      } else {
        viewportMeta.setAttribute('content', 
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-visual');
      }
      
      // Set custom viewport height variable
      const updateVh = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      
      updateVh();
      window.addEventListener('resize', updateVh);
      window.addEventListener('orientationchange', updateVh);
      
      // Add global styles for better keyboard handling
      const style = document.getElementById('mobile-keyboard-styles');
      if (!style) {
        const cssStyle = document.createElement('style');
        cssStyle.id = 'mobile-keyboard-styles';
        cssStyle.textContent = `
          :root {
            --app-height: 100%;
          }
          
          @supports (height: 100dvh) {
            :root {
              --app-height: 100dvh;
            }
          }
          
          @media (max-width: 768px) {
            html, body {
              height: var(--app-height);
              overflow: hidden;
              position: relative;
            }
            
            .h-screen {
              height: var(--app-height) !important;
            }
            
            .min-h-screen {
              min-height: var(--app-height) !important;
            }
            
            .max-h-screen {
              max-height: var(--app-height) !important;
            }
            
            .chat-container {
              height: var(--app-height);
              display: flex;
              flex-direction: column;
            }
            
            .chat-messages {
              flex: 1;
              overflow-y: auto;
              overscroll-behavior: contain;
            }
            
            .chat-input {
              position: sticky;
              bottom: 0;
              background: var(--background);
              padding: 8px;
              border-top: 1px solid var(--border);
              z-index: 10;
            }
          }
        `;
        document.head.appendChild(cssStyle);
      }
    };
    
    if (isMobile) {
      setViewportForKeyboard();
    }
    
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
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
        if (!permissionsRequested) {
          requestPWAPermissions();
          localStorage.setItem('permissionsRequested', 'true');
          setPermissionsRequested(true);
        }
      }, 3000);
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast, permissionsRequested, isMobile]);
  
  // Request permissions needed for PWA functionality
  const requestPWAPermissions = async () => {
    try {
      // Request notification permission
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        const permissionResult = await Notification.requestPermission();
        if (permissionResult === 'granted') {
          console.log('Notification permission granted');
        }
      }
      
      // Request wake lock permission
      if ('wakeLock' in navigator) {
        try {
          const wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('Wake lock obtained');
          await wakeLock.release();
          console.log('Wake lock released');
        } catch (err) {
          console.log('Wake lock request failed:', err);
        }
      }
      
      // Check background sync permission
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
      await installPrompt.prompt();
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
  
  if (isStandalone || !installPrompt || !isMobile) return null;
  
  return (
    <div className="fixed bottom-16 right-4 z-40">
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
