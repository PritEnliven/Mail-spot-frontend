import mailSpotLogo from "@images/no-new-mail.svg";
import type { Email } from '@models/Email';
import { getSenderLabel } from '@utils/emailUtil';

export class NotificationManager {
  private static instance: NotificationManager;
  private isSupported: boolean = false;
  private permission: NotificationPermission = 'default';
  private notificationSound: HTMLAudioElement | null = null;

  private constructor() {
    this.isSupported = 'Notification' in window;
    this.loadNotificationSound();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private loadNotificationSound(): void {
    try {
      // Using the notification.mp3 file from src/assets/audio/
      this.notificationSound = new Audio('/src/assets/audio/notification.mp3');
      
      // Set audio properties
      this.notificationSound.volume = 0.5; // Adjust volume as needed
      this.notificationSound.preload = 'auto';
      
      // Handle loading errors
      this.notificationSound.addEventListener('error', (e) => {
        console.warn('Failed to load notification sound:', e);
        this.notificationSound = null;
      });
    } catch (error) {
      console.warn('Could not load notification sound:', error);
      this.notificationSound = null;
    }
  }

  private playNotificationSound(): void {
    if (!this.notificationSound) return;

    try {
      // Reset audio to start if it was already playing
      this.notificationSound.currentTime = 0;
      
      // Play the sound
      this.notificationSound.play().catch(error => {
        console.warn('Could not play notification sound:', error);
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        console.log('Notification permission granted');
      } else if (permission === 'denied') {
        console.log('Notification permission denied');
      } else {
        console.log('Notification permission dismissed');
      }
      
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      // Check if it's an HTTPS issue
      if (location.protocol === 'http:' && location.hostname !== 'localhost') {
        console.warn('Notifications require HTTPS. Sound will still play, but browser notifications won\'t work.');
      }
      return false;
    }
  }

  // Method to be called from user interaction (like button click)
  async requestPermissionFromUser(): Promise<boolean> {
    console.log('Requesting notification permission from user interaction...');
    return await this.requestPermission();
  }

  async showNewEmailNotification(email: Email): Promise<void> {
    // Always play the sound first, even if notification permission fails
    this.playNotificationSound();

    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser, but sound played');
      return;
    }

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        console.log('Notification permission denied, but sound was played');
        return;
      }
    }

    try {
      const sender = getSenderLabel(email.from) || 'Unknown Sender';

      const notification = new Notification(`New Email from ${sender}`, {
        body: email.subject || 'No Subject',
        icon: mailSpotLogo,
        badge: mailSpotLogo,
        tag: `email-${email.messageId}`,
        requireInteraction: false,
        silent: false,
      });

      // Auto-close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Optional: Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        // You could emit a custom event or navigate to the email
        window.dispatchEvent(new CustomEvent('openEmail', { detail: { messageId: email.messageId } }));
      };

    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  async showEmailUpdatedNotification(email: Partial<Email> & { messageId: string }): Promise<void> {
    if (!this.isSupported || this.permission !== 'granted') return;

    try {
      const notification = new Notification('Email Updated', {
        body: `Email "${email.subject || 'No Subject'}" has been updated`,
        icon: mailSpotLogo,
        badge: mailSpotLogo,
        tag: `email-updated-${email.messageId}`,
        requireInteraction: false,
      });

      setTimeout(() => {
        notification.close();
      }, 3000);

    } catch (error) {
      console.error('Error showing update notification:', error);
    }
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  isNotificationSupported(): boolean {
    return this.isSupported;
  }
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();
