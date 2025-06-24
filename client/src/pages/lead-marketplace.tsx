import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Navigation from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  CreditCard,
  Filter,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Target
} from 'lucide-react';
import { Redirect } from 'wouter';

// Initialize Stripe
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

interface AvailableLead {
  id: number;
  homeownerId: number;
  title: string;
  description: string;
  category: string;
  budget?: string;
  urgency?: string;
  zipCode: string;
  status: string;
  createdAt: string;
  leadPrice: number;
}

interface PaymentFormProps {
  lead: AvailableLead;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({ lead, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);

  const createPaymentIntentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        amount: lead.leadPrice,
        leadId: lead.id,
      });
      return response.json();
    },
  });

  const purchaseLeadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/purchase-lead', {
        projectId: lead.id,
        amount: lead.leadPrice,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/available-leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads/my'] });
      toast({
        title: 'Lead Purchased Successfully',
        description: 'You now have access to this project. Check your dashboard for contact details.',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Failed to purchase lead',
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
      // Create payment intent
      const { clientSecret } = await createPaymentIntentMutation.mutateAsync();

      if (!clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm payment
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Purchase the lead
      await purchaseLeadMutation.mutateAsync();
    } catch (error: any) {
      toast({
        title: 'Payment Failed',
        description: error.message || 'Payment processing failed',
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
        <h3 className="text-lg font-semibold text-neutral-800 mb-2">Payment Not Available</h3>
        <p className="text-neutral-600 mb-4">
          Stripe payment processing is not configured. Please contact support to set up payments.
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
        <h3 className="text-lg font-semibold text-neutral-800 mb-2">Purchase Lead</h3>
        <div className="bg-neutral-50 rounded-lg p-4">
          <h4 className="font-medium text-neutral-800">{lead.title}</h4>
          <p className="text-sm text-neutral-600 mb-2">{lead.description.substring(0, 100)}...</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">{lead.zipCode}</span>
            <span className="text-xl font-bold text-secondary">${lead.leadPrice}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Payment Information
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
            disabled={!stripe || processing || createPaymentIntentMutation.isPending}
            className="flex-1 bg-secondary text-white hover:bg-green-600"
          >
            {processing ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay ${lead.leadPrice}
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

export default function LeadMarketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<AvailableLead | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const { data: availableLeads, isLoading } = useQuery<AvailableLead[]>({
    queryKey: ['/api/available-leads'],
    enabled: !!user && user.userType === 'service_provider',
  });

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (user.userType !== 'service_provider') {
    return <Redirect to="/homeowner-dashboard" />;
  }

  const filteredLeads = availableLeads?.filter(lead => {
    const categoryMatch = categoryFilter === 'all' || lead.category === categoryFilter;
    const budgetMatch = budgetFilter === 'all' || lead.budget === budgetFilter;
    return categoryMatch && budgetMatch;
  }) || [];

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just posted';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'house-painting': return 'House Painting';
      case 'kitchen-renovation': return 'Kitchen Renovation';
      case 'basement-remodeling': return 'Basement Remodeling';
      case 'electrical': return 'Electrical Work';
      case 'plumbing': return 'Plumbing Services';
      case 'landscaping': return 'Landscaping';
      case 'roofing': return 'Roofing';
      case 'flooring': return 'Flooring';
      case 'hvac': return 'HVAC Services';
      case 'handyman': return 'Handyman Services';
      case 'cleaning': return 'Cleaning Services';
      case 'pest-control': return 'Pest Control';
      default: return category;
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'asap': return 'bg-red-100 text-red-800';
      case 'within-week': return 'bg-yellow-100 text-yellow-800';
      case 'within-month': return 'bg-blue-100 text-blue-800';
      case 'flexible': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePurchaseLead = (lead: AvailableLead) => {
    setSelectedLead(lead);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    setSelectedLead(null);
  };

  const handlePaymentCancel = () => {
    setPaymentDialogOpen(false);
    setSelectedLead(null);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="gradient-secondary text-white rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Lead Marketplace</h1>
              <p className="text-green-100">
                Browse and purchase high-quality leads from homeowners in your area
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{filteredLeads.length}</div>
              <div className="text-green-100 text-sm">Available Leads</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-neutral-500" />
                <span className="text-sm font-medium text-neutral-700">Filters:</span>
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="house-painting">House Painting</SelectItem>
                  <SelectItem value="kitchen-renovation">Kitchen Renovation</SelectItem>
                  <SelectItem value="basement-remodeling">Basement Remodeling</SelectItem>
                  <SelectItem value="electrical">Electrical Work</SelectItem>
                  <SelectItem value="plumbing">Plumbing Services</SelectItem>
                  <SelectItem value="landscaping">Landscaping</SelectItem>
                  <SelectItem value="roofing">Roofing</SelectItem>
                  <SelectItem value="flooring">Flooring</SelectItem>
                  <SelectItem value="hvac">HVAC Services</SelectItem>
                  <SelectItem value="handyman">Handyman Services</SelectItem>
                  <SelectItem value="cleaning">Cleaning Services</SelectItem>
                  <SelectItem value="pest-control">Pest Control</SelectItem>
                </SelectContent>
              </Select>

              <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Budgets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Budgets</SelectItem>
                  <SelectItem value="under-1000">Under $1,000</SelectItem>
                  <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                  <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                  <SelectItem value="10000-25000">$10,000 - $25,000</SelectItem>
                  <SelectItem value="over-25000">Over $25,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leads Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-6 bg-neutral-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-neutral-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-neutral-200 rounded w-2/3 mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                    <div className="h-8 bg-neutral-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredLeads.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-lg transition-shadow border border-neutral-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-800 mb-1">{lead.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(lead.category)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-secondary">${lead.leadPrice}</div>
                      <div className="text-xs text-neutral-500">lead price</div>
                    </div>
                  </div>

                  <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
                    {lead.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-xs text-neutral-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{lead.zipCode}</span>
                      <Clock className="h-3 w-3 ml-3 mr-1" />
                      <span>{formatTimeAgo(lead.createdAt)}</span>
                    </div>

                    {lead.budget && (
                      <div className="flex items-center text-xs text-neutral-500">
                        <DollarSign className="h-3 w-3 mr-1" />
                        <span>Budget: {lead.budget.replace('-', ' - $').replace('under', 'Under $').replace('over', 'Over $')}</span>
                      </div>
                    )}

                    {lead.urgency && (
                      <Badge className={getUrgencyColor(lead.urgency)} variant="secondary">
                        {lead.urgency.replace('_', ' ').replace('-', ' ')}
                      </Badge>
                    )}
                  </div>

                  <Button 
                    onClick={() => handlePurchaseLead(lead)}
                    className="w-full bg-primary text-white hover:bg-blue-700"
                  >
                    <Target className="mr-2 h-4 w-4" />
                    Purchase Lead
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <TrendingUp className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">No Leads Available</h3>
              <p className="text-neutral-600 mb-4">
                {categoryFilter !== 'all' || budgetFilter !== 'all'
                  ? 'No leads match your current filters. Try adjusting your search criteria.'
                  : 'There are no available leads at the moment. Check back later for new opportunities.'
                }
              </p>
              {(categoryFilter !== 'all' || budgetFilter !== 'all') && (
                <Button
                  onClick={() => {
                    setCategoryFilter('all');
                    setBudgetFilter('all');
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Purchase</DialogTitle>
            </DialogHeader>
            {selectedLead && stripePromise && (
              <Elements stripe={stripePromise}>
                <PaymentForm
                  lead={selectedLead}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              </Elements>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}