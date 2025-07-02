import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    prompt: false,
  });
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission({
        granted: currentPermission === 'granted',
        denied: currentPermission === 'denied',
        prompt: currentPermission === 'default',
      });
    }
  }, []);

  // Get push subscription when permission is granted
  useEffect(() => {
    if (permission.granted && 'serviceWorker' in navigator) {
      getPushSubscription();
    }
  }, [permission.granted]);

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      const granted = result === 'granted';
      
      setPermission({
        granted,
        denied: result === 'denied',
        prompt: result === 'default',
      });

      if (granted) {
        await subscribeToPush();
      }

      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getPushSubscription = async (): Promise<PushSubscription | null> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setSubscription(existingSubscription);
        return existingSubscription;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting push subscription:', error);
      return null;
    }
  };

  const subscribeToPush = async (): Promise<PushSubscription | null> => {
    if (!permission.granted) {
      console.warn('Notification permission not granted');
      return null;
    }

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Create subscription
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(getVapidPublicKey()),
      });

      // Send subscription to server
      if (user) {
        await apiRequest('POST', '/api/notifications/subscribe', {
          subscription: newSubscription.toJSON(),
          userId: user.id,
        });
      }

      setSubscription(newSubscription);
      return newSubscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromPush = async (): Promise<boolean> => {
    if (!subscription) {
      return true;
    }

    setLoading(true);
    try {
      // Unsubscribe from browser
      await subscription.unsubscribe();
      
      // Remove from server
      if (user) {
        await apiRequest('POST', '/api/notifications/unsubscribe', {
          userId: user.id,
        });
      }

      setSubscription(null);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const showLocalNotification = (title: string, options?: NotificationOptions) => {
    if (!permission.granted) {
      console.warn('Cannot show notification: permission not granted');
      return;
    }

    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      ...options,
    });
  };

  const testNotification = () => {
    showLocalNotification('TaskNab Test', {
      body: 'Push notifications are working! You\'ll receive updates about new leads and messages.',
      tag: 'test-notification',
    });
  };

  return {
    permission,
    subscription: !!subscription,
    loading,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    showLocalNotification,
    testNotification,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Default VAPID public key for testing
function getVapidPublicKey(): string {
  return import.meta.env.VITE_VAPID_PUBLIC_KEY || 
    'BG8Y4eBhyRz3fZJHNE5OhL8O2JG2XjJQT8O3iBV5LZ7-h5YrZh8JzG2JH5-Y8hT3L3JN5E9FhL8J2H3';
}