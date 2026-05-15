import type { Email } from '@models/Email';
import { mailboxParticipantToString } from '@utils/emailUtil';
import mailSpotLogo from "@images/no-new-mail.svg"

export class NotificationManager {
  private static instance: NotificationManager;
  private isSupported: boolean = false;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.isSupported = 'Notification' in window;
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
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
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async showNewEmailNotification(email: Email): Promise<void> {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser');
      return;
    }

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    try {
      const sender =
        Array.isArray(email.from) && email.from.length > 0
          ? mailboxParticipantToString(email.from[0])
          : 'Unknown Sender';

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
