
type PermissionName = 
  | 'accelerometer'
  | 'ambient-light-sensor'
  | 'background-sync'
  | 'bluetooth'
  | 'camera'
  | 'clipboard-read'
  | 'clipboard-write'
  | 'device-info'
  | 'display-capture'
  | 'geolocation'
  | 'gyroscope'
  | 'magnetometer'
  | 'microphone'
  | 'midi'
  | 'nfc'
  | 'notifications'
  | 'persistent-storage'
  | 'push'
  | 'screen-wake-lock'
  | 'speaker'
  | 'speaker-selection';

interface DevicePermissionStatus {
  notifications: PermissionState;
  dnd: PermissionState;
  display: PermissionState;
  audio: PermissionState;
}

// Add definitions for native device settings
interface NativeDeviceSettings {
  notifications: boolean;
  dnd: boolean;
  display: {
    brightness: number;
    keepAwake: boolean;
  };
  audio: {
    volume: number;
    muted: boolean;
  };
}
