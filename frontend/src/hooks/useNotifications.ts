'use client';

import { useState, useEffect } from 'react';
import { handleAPIError } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface UseNotificationsReturn {
  notifications: NotificationData[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (notificationId: string) => void;
  addNotification: (notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => void;
}

export function useNotifications(): UseNotificationsReturn {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Load notifications from backend when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
    }
  }, [isAuthenticated, user]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      // Since we don't have a notifications endpoint yet, we'll simulate it
      // In the future, this would be: await apiClient.getNotifications();
      
      // For now, create some sample notifications based on user activity
      const sampleNotifications: NotificationData[] = [
        {
          id: '1',
          type: 'success',
          title: 'Welcome to Aptoscade!',
          message: 'Your account has been successfully created. Start gaming to earn rewards!',
          timestamp: new Date().toISOString(),
          read: false
        }
      ];
      
      setNotifications(sampleNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', handleAPIError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      // In the future: await apiClient.markNotificationAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', handleAPIError(error));
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      // In the future: await apiClient.markAllNotificationsAsRead();
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', handleAPIError(error));
    }
  };

  const clearNotification = (notificationId: string): void => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const addNotification = (notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>): void => {
    const newNotification: NotificationData = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearNotification,
    addNotification
  };
}
