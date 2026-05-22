import { notificationManager } from '@utils/notifications';
import { useEffect } from 'react';

export const useNotifications = () => {
  useEffect(() => {
    const requestPermissionOnLoad = async () => {
      if (notificationManager.isNotificationSupported()) {
        await notificationManager.requestPermission();
      }
    };

    const timer = setTimeout(requestPermissionOnLoad, 3000);
    return () => clearTimeout(timer);
  }, []);
};

export { notificationManager };
