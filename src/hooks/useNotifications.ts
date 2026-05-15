import { useEffect } from 'react';
import { notificationManager } from '@utils/notifications';

export const useNotifications = () => {
  useEffect(() => {
    // Request permission on first user interaction or page load
    const requestPermissionOnLoad = async () => {
      if (notificationManager.isNotificationSupported()) {
        await notificationManager.requestPermission();
      }
    };

    // Delay permission request to avoid being intrusive
    // This gives users time to interact with the app first
    const timer = setTimeout(requestPermissionOnLoad, 3000);
    return () => clearTimeout(timer);
  }, []);
};

export { notificationManager };
