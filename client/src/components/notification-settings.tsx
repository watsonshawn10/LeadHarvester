import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/use-notifications';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';

export default function NotificationSettings() {
  const {
    permission,
    subscription,
    loading,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    testNotification,
  } = useNotifications();
  const { toast } = useToast();
  const [notificationTypes, setNotificationTypes] = useState({
    newLeads: true,
    messages: true,
    quotes: true,
    appointments: true,
    updates: false,
  });

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast({
        title: 'Notifications Enabled',
        description: 'You\'ll now receive push notifications for important updates.',
      });
    } else {
      toast({
        title: 'Permission Denied',
        description: 'You can enable notifications later in your browser settings.',
        variant: 'destructive',
      });
    }
  };

  const handleDisableNotifications = async () => {
    const success = await unsubscribeFromPush();
    if (success) {
      toast({
        title: 'Notifications Disabled',
        description: 'You will no longer receive push notifications.',
      });
    }
  };

  const handleTestNotification = () => {
    testNotification();
    toast({
      title: 'Test Sent',
      description: 'Check if you received the test notification.',
    });
  };

  const handleNotificationTypeChange = (type: keyof typeof notificationTypes, enabled: boolean) => {
    setNotificationTypes(prev => ({
      ...prev,
      [type]: enabled,
    }));
    
    // In a real app, you'd save these preferences to the server
    toast({
      title: 'Preferences Updated',
      description: `${type} notifications ${enabled ? 'enabled' : 'disabled'}.`,
    });
  };

  const getStatusInfo = () => {
    if (permission.denied) {
      return {
        icon: <BellOff className="h-5 w-5 text-red-500" />,
        status: 'Blocked',
        description: 'Notifications are blocked. Enable them in your browser settings.',
        variant: 'destructive' as const,
      };
    }
    
    if (permission.granted && subscription) {
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        status: 'Enabled',
        description: 'Push notifications are active and working.',
        variant: 'default' as const,
      };
    }
    
    if (permission.granted && !subscription) {
      return {
        icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
        status: 'Permission Granted',
        description: 'Permission granted but not subscribed to push notifications.',
        variant: 'secondary' as const,
      };
    }
    
    return {
      icon: <Bell className="h-5 w-5 text-neutral-500" />,
      status: 'Not Enabled',
      description: 'Enable notifications to get updates about leads and messages.',
      variant: 'outline' as const,
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Smartphone className="mr-2 h-5 w-5" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {statusInfo.icon}
            <div>
              <div className="font-medium">{statusInfo.status}</div>
              <div className="text-sm text-neutral-600">{statusInfo.description}</div>
            </div>
          </div>
          <Badge variant={statusInfo.variant}>{statusInfo.status}</Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {!permission.granted && (
            <Button 
              onClick={handleEnableNotifications}
              disabled={loading || permission.denied}
              className="flex-1"
            >
              <Bell className="mr-2 h-4 w-4" />
              Enable Notifications
            </Button>
          )}
          
          {permission.granted && !subscription && (
            <Button 
              onClick={subscribeToPush}
              disabled={loading}
              className="flex-1"
            >
              <Bell className="mr-2 h-4 w-4" />
              Subscribe to Push
            </Button>
          )}
          
          {permission.granted && subscription && (
            <>
              <Button 
                onClick={handleTestNotification}
                variant="outline"
                disabled={loading}
              >
                Test Notification
              </Button>
              <Button 
                onClick={handleDisableNotifications}
                variant="destructive"
                disabled={loading}
              >
                <BellOff className="mr-2 h-4 w-4" />
                Disable
              </Button>
            </>
          )}
        </div>

        {/* Notification Type Preferences */}
        {permission.granted && (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Notification Preferences</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="new-leads" className="text-sm">
                    New Leads Available
                  </Label>
                  <Switch
                    id="new-leads"
                    checked={notificationTypes.newLeads}
                    onCheckedChange={(checked) => handleNotificationTypeChange('newLeads', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="messages" className="text-sm">
                    New Messages
                  </Label>
                  <Switch
                    id="messages"
                    checked={notificationTypes.messages}
                    onCheckedChange={(checked) => handleNotificationTypeChange('messages', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="quotes" className="text-sm">
                    Quote Responses
                  </Label>
                  <Switch
                    id="quotes"
                    checked={notificationTypes.quotes}
                    onCheckedChange={(checked) => handleNotificationTypeChange('quotes', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="appointments" className="text-sm">
                    Appointment Updates
                  </Label>
                  <Switch
                    id="appointments"
                    checked={notificationTypes.appointments}
                    onCheckedChange={(checked) => handleNotificationTypeChange('appointments', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="updates" className="text-sm">
                    App Updates & Tips
                  </Label>
                  <Switch
                    id="updates"
                    checked={notificationTypes.updates}
                    onCheckedChange={(checked) => handleNotificationTypeChange('updates', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-neutral-500 border-t pt-3">
          Notifications help you stay informed about new opportunities and important updates. 
          You can change these settings anytime.
        </div>
      </CardContent>
    </Card>
  );
}