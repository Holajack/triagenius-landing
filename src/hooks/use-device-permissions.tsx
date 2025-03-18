
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
        return 'microphone';
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

  // Request a specific permission
  const requestPermission = async (type: PermissionType): Promise<boolean> => {
    try {
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
          // This is a simulated permission since browsers don't have direct DND APIs
          // In a real app, this would use a native bridge like Capacitor
          if ('navigator' in window && 'setAppBadge' in navigator) {
            // Using setAppBadge as a proxy for DND capabilities
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
          // Use screen wake lock as a proxy for display permissions
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

  // Apply a device setting (this would normally use a native bridge)
  const applyDeviceSetting = async (type: PermissionType, enabled: boolean): Promise<boolean> => {
    // In a browser environment, we'll simulate this with console logs
    // In a real app, this would use Capacitor plugins to apply device settings
    console.log(`Applying ${type} setting: ${enabled ? 'enabled' : 'disabled'}`);
    
    // Check if we have permission first
    const permission = await checkPermission(type);
    if (permission !== 'granted') {
      const granted = await requestPermission(type);
      if (!granted) return false;
    }

    try {
      switch (type) {
        case 'notifications':
          // We have permission, but there's no browser API to toggle system notifications
          // This would use a Capacitor plugin in a real app
          return true;
        
        case 'dnd':
          // This would use a Capacitor plugin to toggle system DND
          // For now, we'll just simulate success
          return true;
        
        case 'display':
          // This would use a Capacitor plugin to modify display settings
          // For now, we'll just simulate success
          return true;
        
        case 'audio':
          // This would use a Capacitor plugin to modify audio settings
          // For now, we'll just simulate success
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
