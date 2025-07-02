import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Settings, LogIn, LogOut, Clock, Shield } from 'lucide-react';

interface UserPreferences {
  loginRedirectPreference: string;
  logoutRedirectPreference: string;
  rememberMeDefault: boolean;
  sessionTimeout: number;
  autoLogoutEnabled: boolean;
  autoLogoutMinutes: number;
  showLogoutConfirmation: boolean;
}

export default function UserPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['/api/users/preferences'],
    enabled: !!user,
  });

  const [formData, setFormData] = useState<UserPreferences>({
    loginRedirectPreference: 'dashboard',
    logoutRedirectPreference: 'home',
    rememberMeDefault: true,
    sessionTimeout: 24,
    autoLogoutEnabled: false,
    autoLogoutMinutes: 30,
    showLogoutConfirmation: false,
  });

  // Update form data when preferences load
  useEffect(() => {
    if (preferences) {
      setFormData({
        loginRedirectPreference: preferences.loginRedirectPreference || 'dashboard',
        logoutRedirectPreference: preferences.logoutRedirectPreference || 'home',
        rememberMeDefault: preferences.rememberMeDefault ?? true,
        sessionTimeout: preferences.sessionTimeout || 24,
        autoLogoutEnabled: preferences.autoLogoutEnabled || false,
        autoLogoutMinutes: preferences.autoLogoutMinutes || 30,
        showLogoutConfirmation: preferences.showLogoutConfirmation || false,
      });
    }
  }, [preferences]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: UserPreferences) => {
      const response = await apiRequest('PATCH', '/api/users/preferences', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Preferences Updated',
        description: 'Your login and logout preferences have been saved.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update preferences',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferencesMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof UserPreferences, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">You must be logged in to access preferences.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-8 w-8" />
          User Preferences
        </h1>
        <p className="text-gray-600 mt-2">
          Customize your login and logout behavior to suit your workflow.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Login Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-green-600" />
              Login Preferences
            </CardTitle>
            <CardDescription>
              Configure how the app behaves when you log in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="loginRedirect">After login, redirect me to:</Label>
              <Select
                value={formData.loginRedirectPreference}
                onValueChange={(value) => handleInputChange('loginRedirectPreference', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose redirect destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">My Dashboard</SelectItem>
                  <SelectItem value="home">Home Page</SelectItem>
                  <SelectItem value="marketplace">Lead Marketplace</SelectItem>
                  <SelectItem value="last-page">Last Visited Page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Remember Me by Default</Label>
                <p className="text-sm text-gray-500">
                  Automatically check "Remember Me" on login forms
                </p>
              </div>
              <Switch
                checked={formData.rememberMeDefault}
                onCheckedChange={(checked) => handleInputChange('rememberMeDefault', checked)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sessionTimeout">Session Duration (hours)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                min="1"
                max="168"
                value={formData.sessionTimeout}
                onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value) || 24)}
                className="w-32"
              />
              <p className="text-sm text-gray-500">
                How long to stay logged in (1-168 hours)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Logout Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-red-600" />
              Logout Preferences
            </CardTitle>
            <CardDescription>
              Configure how the app behaves when you log out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="logoutRedirect">After logout, redirect me to:</Label>
              <Select
                value={formData.logoutRedirectPreference}
                onValueChange={(value) => handleInputChange('logoutRedirectPreference', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose redirect destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home Page</SelectItem>
                  <SelectItem value="login">Login Page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Logout Confirmation</Label>
                <p className="text-sm text-gray-500">
                  Ask for confirmation before logging out
                </p>
              </div>
              <Switch
                checked={formData.showLogoutConfirmation}
                onCheckedChange={(checked) => handleInputChange('showLogoutConfirmation', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Auto-Logout Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Auto-Logout Settings
            </CardTitle>
            <CardDescription>
              Automatically log out after periods of inactivity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Auto-Logout</Label>
                <p className="text-sm text-gray-500">
                  Automatically log out when inactive
                </p>
              </div>
              <Switch
                checked={formData.autoLogoutEnabled}
                onCheckedChange={(checked) => handleInputChange('autoLogoutEnabled', checked)}
              />
            </div>

            {formData.autoLogoutEnabled && (
              <div className="grid gap-2">
                <Label htmlFor="autoLogoutMinutes">Auto-logout after (minutes)</Label>
                <Input
                  id="autoLogoutMinutes"
                  type="number"
                  min="5"
                  max="240"
                  value={formData.autoLogoutMinutes}
                  onChange={(e) => handleInputChange('autoLogoutMinutes', parseInt(e.target.value) || 30)}
                  className="w-32"
                />
                <p className="text-sm text-gray-500">
                  Log out automatically after this many minutes of inactivity (5-240 minutes)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Shield className="h-5 w-5" />
              Security Notice
            </CardTitle>
          </CardHeader>
          <CardContent className="text-orange-700">
            <p className="text-sm">
              These preferences are stored securely and only affect your account. 
              Auto-logout helps protect your account on shared devices.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={updatePreferencesMutation.isPending}
            className="min-w-32"
          >
            {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </form>
    </div>
  );
}