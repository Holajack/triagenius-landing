
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
  const { toast } = useToast();

  useEffect(() => {
    // Check if already installed
    const checkStandalone = () => {
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                                (window.navigator as any).standalone === true;
      setIsStandalone(isInStandaloneMode);
      
      if (isInStandaloneMode) {
        localStorage.setItem('isPWA', 'true');
      }
    };
    
    checkStandalone();
    
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
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);
  
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
  if (isStandalone || !installPrompt) return null;
  
  return (
    <div className="fixed bottom-16 right-4 z-50">
      <Button 
        onClick={handleInstallClick}
        className="flex items-center gap-2 shadow-lg button-gradient"
      >
        <Download className="w-4 h-4" />
        Add to Home Screen
      </Button>
    </div>
  );
};

export default PWADetector;
