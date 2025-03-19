import { useState, useEffect } from 'react';

export type PermissionType = 'notifications' | 'dnd' | 'display' | 'audio';

interface UseDevicePermissionsResult {
  permissionStatus: Record<PermissionType, PermissionState>;
  requestPermission: (type: PermissionType) => Promise<boolean>;
  checkPermission: (type: PermissionType) => Promise<PermissionState>;
  applyDeviceSetting: (type: PermissionType, enabled: boolean) => Promise<boolean>;
}

export function useDevicePermissions(): UseDevicePermissionsResult {
  const [permissionStatus, setPermissionStatus] = useState<Record<PermissionType, PermissionState>>({
    notifications: 'prompt',
    dnd: 'prompt',
    display: 'prompt',
    audio: 'prompt',
  });

  // Check if running in a PWA/Mobile environment
  const isPwa = localStorage.getItem('isPWA') === 'true';
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Initial check for permissions on component mount
  useEffect(() => {
    const checkAllPermissions = async () => {
      const types: PermissionType[] = ['notifications', 'dnd', 'display', 'audio'];
      
      for (const type of types) {
        const status = await checkPermission(type);
        setPermissionStatus(prev => ({
          ...prev,
          [type]: status
        }));
      }
    };
    
    checkAllPermissions();
  }, []);

  // Map permission types to browser permission names
  const getPermissionName = (type: PermissionType): PermissionName | null => {
    switch (type) {
      case 'notifications':
        return 'notifications';
      case 'dnd':
        // We'll use notifications as a proxy for DND since browsers don't have direct DND API
        return 'notifications';
      case 'display':
        // Use screen-wake-lock as a proxy for display settings
        return 'screen-wake-lock';
      case 'audio':
        // Use microphone as a proxy for audio permissions
        return 'microphone' as PermissionName;
      default:
        return null;
    }
  };

  // Check a specific permission status
  const checkPermission = async (type: PermissionType): Promise<PermissionState> => {
    // For non-PWA environments, just return prompt
    if (!navigator.permissions) {
      return 'prompt';
    }

    const permissionName = getPermissionName(type);
    if (!permissionName) return 'prompt';

    try {
      // Special case for notifications which has its own API
      if (type === 'notifications' && 'Notification' in window) {
        if (Notification.permission === 'granted') return 'granted';
        if (Notification.permission === 'denied') return 'denied';
        return 'prompt';
      }

      // Use the Permissions API for other permission types
      const permStatus = await navigator.permissions.query({ name: permissionName });
      return permStatus.state;
    } catch (error) {
      console.error(`Error checking ${type} permission:`, error);
      return 'prompt';
    }
  };

  // Request a specific permission with direct native integration if available
  const requestPermission = async (type: PermissionType): Promise<boolean> => {
    try {
      // First check if we need to use mobile native APIs
      if (isPwa && isMobile) {
        console.log(`Requesting native ${type} permission on mobile device`);
        // Here we'd use Capacitor or similar to request native permissions
        // Since we're in a browser simulator, we'll use web APIs as fallback
      }
      
      switch (type) {
        case 'notifications':
          if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            const granted = permission === 'granted';
            setPermissionStatus(prev => ({
              ...prev,
              notifications: granted ? 'granted' : 'denied'
            }));
            return granted;
          }
          break;
        
        case 'dnd':
          // In a real mobile app, this would use a native bridge to request DND permission
          // For now, we'll simulate with a browser capability check
          if ('navigator' in window && 'setAppBadge' in navigator) {
            try {
              await navigator.setAppBadge(0);
              setPermissionStatus(prev => ({
                ...prev,
                dnd: 'granted'
              }));
              return true;
            } catch (e) {
              setPermissionStatus(prev => ({
                ...prev,
                dnd: 'denied'
              }));
              return false;
            }
          }
          break;
        
        case 'display':
          // For display settings (like keeping screen on)
          if ('wakeLock' in navigator) {
            try {
              const wakeLock = await (navigator as any).wakeLock.request('screen');
              wakeLock.release(); // Release immediately, we just want to test
              setPermissionStatus(prev => ({
                ...prev,
                display: 'granted'
              }));
              return true;
            } catch (e) {
              setPermissionStatus(prev => ({
                ...prev,
                display: 'denied'
              }));
              return false;
            }
          }
          break;
        
        case 'audio':
          // Request audio permissions using getUserMedia
          if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              // Stop all tracks immediately after getting permission
              stream.getTracks().forEach(track => track.stop());
              setPermissionStatus(prev => ({
                ...prev,
                audio: 'granted'
              }));
              return true;
            } catch (e) {
              setPermissionStatus(prev => ({
                ...prev,
                audio: 'denied'
              }));
              return false;
            }
          }
          break;
      }
      
      // If we've reached here, the permission wasn't handled
      return false;
    } catch (error) {
      console.error(`Error requesting ${type} permission:`, error);
      return false;
    }
  };

  // Apply a device setting with direct integration when available
  const applyDeviceSetting = async (type: PermissionType, enabled: boolean): Promise<boolean> => {
    // Check if we have permission first
    const permission = await checkPermission(type);
    if (permission !== 'granted') {
      const granted = await requestPermission(type);
      if (!granted) return false;
    }

    // If in a PWA/mobile environment, we would use native APIs
    if (isPwa && isMobile) {
      console.log(`Applying native ${type} setting: ${enabled ? 'enabled' : 'disabled'}`);
      // In a real application with Capacitor, we would call native APIs here
      // For example: Plugins.DoNotDisturb.setDndEnabled(enabled);
    }

    try {
      switch (type) {
        case 'notifications':
          // Directly create a test notification if enabled
          if (enabled && 'Notification' in window && Notification.permission === 'granted') {
            const testNotif = new Notification("Notifications Enabled", {
              body: "You will now receive notifications from the app",
              icon: "/icons/icon-192x192.png"
            });
            
            // Auto-close after 3 seconds
            setTimeout(() => testNotif.close(), 3000);
          }
          return true;
        
        case 'dnd':
          // In a real mobile app, this would toggle DND mode
          console.log(`Would set Do Not Disturb mode to: ${enabled}`);
          return true;
        
        case 'display':
          // For "keep screen on" functionality
          if (enabled && 'wakeLock' in navigator) {
            try {
              // In a real app, we would store this wakeLock object and release it when disabled
              const wakeLock = await (navigator as any).wakeLock.request('screen');
              console.log('Screen will stay awake');
              
              // For demo purposes, release it after 5 seconds
              setTimeout(() => {
                wakeLock.release();
                console.log('Wake lock released');
              }, 5000);
              
              return true;
            } catch (e) {
              console.error('Could not keep screen on:', e);
              return false;
            }
          }
          return true;
        
        case 'audio':
          // In a real app, this would configure audio settings
          console.log(`Would configure audio settings: ${enabled ? 'enabled' : 'disabled'}`);
          return true;
        
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error applying ${type} setting:`, error);
      return false;
    }
  };

  return {
    permissionStatus,
    requestPermission,
    checkPermission,
    applyDeviceSetting
  };
}
