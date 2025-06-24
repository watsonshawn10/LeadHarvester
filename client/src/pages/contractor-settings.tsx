import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Navigation from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Settings, 
  Plus,
  AlertCircle,
  CheckCircle2,
  Wallet,
  TrendingUp,
  Target
} from 'lucide-react';
import { Redirect } from 'wouter';

// Initialize Stripe
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

interface PaymentSettings {
  autoLeadPurchase: boolean;
  dailyBudgetLimit: string | null;
  weeklyBudgetLimit: string | null;
  dailySpentAmount: string;
  weeklySpentAmount: string;
  leadCredits: string;
  hasPaymentMethod: boolean;
  preferredCategories: string[];
  serviceRadius: number;
}

interface PaymentMethodSetupProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentMethodSetup({ onSuccess, onCancel }: PaymentMethodSetupProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const setupPaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await apiRequest('POST', '/api/contractor/setup-payment-method', {
        paymentMethodId,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Payment Method Added',
        description: 'Your payment method has been set up successfully.',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to setup payment method',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        throw new Error(error.message);
      }

      await setupPaymentMethodMutation.mutateAsync(paymentMethod.id);
    } catch (error: any) {
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to setup payment method',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!stripePromise) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-800 mb-2">Payment Setup Not Available</h3>
        <p className="text-neutral-600 mb-4">
          Payment processing is not configured. Please contact support.
        </p>
        <Button onClick={onCancel} variant="outline">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-2">Add Payment Method</h3>
        <p className="text-sm text-neutral-600">
          Add a payment method to enable automatic lead purchasing. Your card will only be charged when you receive qualified leads within your budget limits.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Card Information
          </label>
          <div className="border border-neutral-300 rounded-lg p-3">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            type="submit"
            disabled={!stripe || processing}
            className="flex-1 bg-primary text-white hover:bg-blue-700"
          >
            {processing ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Setting up...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Add Payment Method
              </>
            )}
          </Button>
          <Button type="button" onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function AddCreditsDialog({ currentCredits, onSuccess }: { currentCredits: number, onSuccess: () => void }) {
  const [amount, setAmount] = useState('');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const addCreditsMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', '/api/contractor/add-credits', { amount });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Credits Added',
        description: `$${amount} in credits added successfully. New balance: $${data.newCreditBalance}`,
      });
      setOpen(false);
      setAmount('');
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Add Credits',
        description: error.message || 'Payment failed',
        variant: 'destructive',
      });
    },
  });

  const handleAddCredits = () => {
    const amountNum = parseFloat(amount);
    if (amountNum < 10) {
      toast({
        title: 'Invalid Amount',
        description: 'Minimum amount is $10',
        variant: 'destructive',
      });
      return;
    }
    addCreditsMutation.mutate(amountNum);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-secondary text-white hover:bg-green-600">
          <Plus className="mr-2 h-4 w-4" />
          Add Credits
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Lead Credits</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="50.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="10"
              step="5"
            />
            <p className="text-sm text-neutral-500 mt-1">Minimum: $10</p>
          </div>
          
          <div className="bg-neutral-50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span>Current Balance:</span>
              <span className="font-medium">${currentCredits.toFixed(2)}</span>
            </div>
            {amount && (
              <div className="flex justify-between text-sm font-medium text-secondary">
                <span>New Balance:</span>
                <span>${(currentCredits + parseFloat(amount || '0')).toFixed(2)}</span>
              </div>
            )}
          </div>

          <Button 
            onClick={handleAddCredits}
            disabled={!amount || parseFloat(amount) < 10 || addCreditsMutation.isPending}
            className="w-full"
          >
            {addCreditsMutation.isPending ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Add ${amount || '0'} Credits
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ContractorSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const [settings, setSettings] = useState({
    autoLeadPurchase: false,
    dailyBudgetLimit: '',
    weeklyBudgetLimit: '',
    preferredCategories: [] as string[],
    serviceRadius: 25,
  });

  const { data: paymentSettings, isLoading } = useQuery<PaymentSettings>({
    queryKey: ['/api/contractor/payment-settings'],
    enabled: !!user && user.userType === 'service_provider',
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest('POST', '/api/contractor/payment-settings', updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractor/payment-settings'] });
      toast({
        title: 'Settings Updated',
        description: 'Your payment settings have been saved.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (paymentSettings) {
      setSettings({
        autoLeadPurchase: paymentSettings.autoLeadPurchase,
        dailyBudgetLimit: paymentSettings.dailyBudgetLimit || '',
        weeklyBudgetLimit: paymentSettings.weeklyBudgetLimit || '',
        preferredCategories: paymentSettings.preferredCategories,
        serviceRadius: paymentSettings.serviceRadius,
      });
    }
  }, [paymentSettings]);

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (user.userType !== 'service_provider') {
    return <Redirect to="/homeowner-dashboard" />;
  }

  const handleSaveSettings = () => {
    const updates = {
      ...settings,
      dailyBudgetLimit: settings.dailyBudgetLimit ? parseFloat(settings.dailyBudgetLimit) : null,
      weeklyBudgetLimit: settings.weeklyBudgetLimit ? parseFloat(settings.weeklyBudgetLimit) : null,
    };
    updateSettingsMutation.mutate(updates);
  };

  const handlePaymentSetupSuccess = () => {
    setPaymentDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['/api/contractor/payment-settings'] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
            <div className="grid gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 bg-neutral-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const categories = [
    { value: 'house-painting', label: 'House Painting' },
    { value: 'basement-remodeling', label: 'Basement Remodeling' },
    { value: 'kitchen-renovation', label: 'Kitchen Renovation' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'landscaping', label: 'Landscaping' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">Payment & Lead Settings</h1>
          <p className="text-neutral-600">
            Configure your automatic lead purchasing preferences and budget limits
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Payment Method & Credits */}
          <div className="lg:col-span-1 space-y-6">
            {/* Payment Method Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentSettings?.hasPaymentMethod ? (
                  <div className="flex items-center text-secondary">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    <span className="text-sm font-medium">Payment method active</span>
                  </div>
                ) : (
                  <div className="flex items-center text-amber-600">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    <span className="text-sm font-medium">No payment method</span>
                  </div>
                )}

                {!paymentSettings?.hasPaymentMethod && (
                  <Button 
                    onClick={() => setPaymentDialogOpen(true)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Lead Credits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wallet className="mr-2 h-5 w-5" />
                  Lead Credits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">
                    ${parseFloat(paymentSettings?.leadCredits || '0').toFixed(2)}
                  </div>
                  <div className="text-sm text-neutral-500">Available Balance</div>
                </div>

                {paymentSettings?.hasPaymentMethod && (
                  <AddCreditsDialog 
                    currentCredits={parseFloat(paymentSettings?.leadCredits || '0')}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['/api/contractor/payment-settings'] })}
                  />
                )}
              </CardContent>
            </Card>

            {/* Budget Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Budget Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Daily Spent:</span>
                  <span className="font-medium">
                    ${parseFloat(paymentSettings?.dailySpentAmount || '0').toFixed(2)}
                    {paymentSettings?.dailyBudgetLimit && (
                      <span className="text-neutral-500">
                        / ${parseFloat(paymentSettings.dailyBudgetLimit).toFixed(2)}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Weekly Spent:</span>
                  <span className="font-medium">
                    ${parseFloat(paymentSettings?.weeklySpentAmount || '0').toFixed(2)}
                    {paymentSettings?.weeklyBudgetLimit && (
                      <span className="text-neutral-500">
                        / ${parseFloat(paymentSettings.weeklyBudgetLimit).toFixed(2)}
                      </span>
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Auto Lead Purchase */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5" />
                  Automatic Lead Purchase
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-purchase" className="text-sm font-medium">
                      Enable automatic lead purchases
                    </Label>
                    <p className="text-sm text-neutral-500 mt-1">
                      Automatically receive and pay for leads that match your criteria
                    </p>
                  </div>
                  <Switch
                    id="auto-purchase"
                    checked={settings.autoLeadPurchase}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, autoLeadPurchase: checked }))
                    }
                    disabled={!paymentSettings?.hasPaymentMethod}
                  />
                </div>

                {!paymentSettings?.hasPaymentMethod && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      Add a payment method to enable automatic lead purchases
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Budget Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="daily-budget">Daily Budget Limit</Label>
                    <Input
                      id="daily-budget"
                      type="number"
                      placeholder="0.00"
                      value={settings.dailyBudgetLimit}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        dailyBudgetLimit: e.target.value 
                      }))}
                      min="0"
                      step="5"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Maximum to spend per day</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="weekly-budget">Weekly Budget Limit</Label>
                    <Input
                      id="weekly-budget"
                      type="number"
                      placeholder="0.00"
                      value={settings.weeklyBudgetLimit}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        weeklyBudgetLimit: e.target.value 
                      }))}
                      min="0"
                      step="10"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Maximum to spend per week</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    Setting budget limits helps control your lead spending. If a limit is reached, 
                    you won't receive new leads until the next period.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Preferred Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Preferred Service Categories</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {categories.map((category) => (
                      <label key={category.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings.preferredCategories.includes(category.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSettings(prev => ({
                                ...prev,
                                preferredCategories: [...prev.preferredCategories, category.value]
                              }));
                            } else {
                              setSettings(prev => ({
                                ...prev,
                                preferredCategories: prev.preferredCategories.filter(c => c !== category.value)
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{category.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="service-radius">Service Radius (miles)</Label>
                  <Select 
                    value={settings.serviceRadius.toString()} 
                    onValueChange={(value) => setSettings(prev => ({ 
                      ...prev, 
                      serviceRadius: parseInt(value) 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 miles</SelectItem>
                      <SelectItem value="25">25 miles</SelectItem>
                      <SelectItem value="50">50 miles</SelectItem>
                      <SelectItem value="100">100 miles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Settings className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Payment Setup Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Set Up Payment Method</DialogTitle>
            </DialogHeader>
            {stripePromise && (
              <Elements stripe={stripePromise}>
                <PaymentMethodSetup
                  onSuccess={handlePaymentSetupSuccess}
                  onCancel={() => setPaymentDialogOpen(false)}
                />
              </Elements>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}