import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navigation from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Project, Quote } from '@/types';
import ProjectChat from '@/components/project-chat';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  User, 
  MessageSquare, 
  Star,
  Send,
  FileText,
  Calendar
} from 'lucide-react';
import { Redirect } from 'wouter';

const quoteSchema = z.object({
  amount: z.number().min(1, 'Amount is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  timeline: z.string().min(1, 'Timeline is required'),
});

const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
});

type QuoteFormData = z.infer<typeof quoteSchema>;
type MessageFormData = z.infer<typeof messageSchema>;

export default function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ['/api/projects', id],
    enabled: !!id,
  });

  const { data: quotes, isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ['/api/quotes/project', id],
    enabled: !!id,
  });

  // Messages are now handled by the ProjectChat component

  const quoteForm = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      amount: 0,
      description: '',
      timeline: '',
    },
  });

  const messageForm = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: '',
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const response = await apiRequest('POST', '/api/quotes', {
        ...data,
        projectId: parseInt(id!),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes/project', id] });
      toast({
        title: 'Quote Submitted',
        description: 'Your quote has been sent to the homeowner.',
      });
      quoteForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit quote',
        variant: 'destructive',
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      const response = await apiRequest('POST', '/api/messages', {
        ...data,
        projectId: parseInt(id!),
        receiverId: project?.homeownerId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/project', id] });
      messageForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/2 mb-6"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-64 bg-neutral-200 rounded-lg mb-6"></div>
                <div className="h-32 bg-neutral-200 rounded-lg"></div>
              </div>
              <div className="h-96 bg-neutral-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-neutral-800 mb-4">Project Not Found</h1>
              <p className="text-neutral-600">The project you're looking for doesn't exist or has been removed.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const onSubmitQuote = (data: QuoteFormData) => {
    createQuoteMutation.mutate(data);
  };

  const onSendMessage = (data: MessageFormData) => {
    sendMessageMutation.mutate(data);
  };

  const canSubmitQuote = user.userType === 'service_provider' && project.status === 'active';
  const isProjectOwner = user.userType === 'homeowner' && project.homeownerId === user.id;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-neutral-800">{project.title}</h1>
            <Badge className={getStatusColor(project.status)}>
              {getStatusLabel(project.status)}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-neutral-500">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{project.zipCode}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>Posted {formatTimeAgo(project.createdAt)}</span>
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              <span>{project.category}</span>
            </div>
            {project.budget && (
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                <span>{project.budget} budget</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Tabs */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Project Details</TabsTrigger>
                <TabsTrigger value="quotes">Quotes ({quotes?.length || 0})</TabsTrigger>
                <TabsTrigger value="chat">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                {/* Project Description */}
                <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Project Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700 leading-relaxed">{project.description}</p>
                
                {project.urgency && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className="text-sm font-medium text-yellow-800">
                        Timeline: {project.urgency.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quotes Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <DollarSign className="mr-2 h-5 w-5" />
                    Quotes ({quotes?.length || 0})
                  </span>
                  {isProjectOwner && quotes && quotes.length > 0 && (
                    <span className="text-sm text-neutral-500">
                      Compare quotes below
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quotesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="border border-neutral-200 rounded-lg p-4 animate-pulse">
                        <div className="flex justify-between items-start mb-3">
                          <div className="h-5 bg-neutral-200 rounded w-1/4"></div>
                          <div className="h-6 bg-neutral-200 rounded w-20"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-neutral-200 rounded w-full"></div>
                          <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : quotes && quotes.length > 0 ? (
                  <div className="space-y-4">
                    {quotes.map((quote) => (
                      <div key={quote.id} className="border border-neutral-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-neutral-800">Professional Quote</h4>
                            <p className="text-sm text-neutral-500">
                              Submitted {formatTimeAgo(quote.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-secondary">
                              ${quote.amount.toLocaleString()}
                            </div>
                            <Badge variant="outline">
                              {quote.status}
                            </Badge>
                          </div>
                        </div>
                        
                        {quote.description && (
                          <p className="text-neutral-700 mb-3">{quote.description}</p>
                        )}
                        
                        {quote.timeline && (
                          <div className="flex items-center text-sm text-neutral-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Timeline: {quote.timeline}</span>
                          </div>
                        )}

                        {isProjectOwner && quote.status === 'pending' && (
                          <div className="flex space-x-2 mt-4">
                            <Button size="sm" className="bg-secondary text-white hover:bg-green-600">
                              Accept Quote
                            </Button>
                            <Button size="sm" variant="outline">
                              Message Contractor
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-800 mb-2">No quotes yet</h3>
                    <p className="text-neutral-600">
                      {canSubmitQuote 
                        ? 'Be the first to submit a quote for this project!'
                        : 'Contractors will submit quotes for this project soon.'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Quote Form (Service Providers Only) */}
            {canSubmitQuote && (
              <Card>
                <CardHeader>
                  <CardTitle>Submit a Quote</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...quoteForm}>
                    <form onSubmit={quoteForm.handleSubmit(onSubmitQuote)} className="space-y-4">
                      <FormField
                        control={quoteForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quote Amount ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="5000"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={quoteForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe what's included in your quote..."
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={quoteForm.control}
                        name="timeline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Timeline</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., 2-3 weeks"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full bg-secondary text-white hover:bg-green-600"
                        disabled={createQuoteMutation.isPending}
                      >
                        {createQuoteMutation.isPending ? 'Submitting...' : 'Submit Quote'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
              </TabsContent>

              <TabsContent value="quotes" className="space-y-6">
                {/* Quotes Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Project Quotes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {quotes && quotes.length > 0 ? (
                      <div className="space-y-4">
                        {quotes.map((quote) => (
                          <div key={quote.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold text-lg">${quote.amount}</h4>
                                <p className="text-sm text-neutral-600">
                                  Status: <span className="capitalize">{quote.status}</span>
                                </p>
                              </div>
                              <Badge variant={quote.status === 'accepted' ? 'default' : 'secondary'}>
                                {quote.status}
                              </Badge>
                            </div>
                            {quote.description && (
                              <p className="text-neutral-700 mb-3">{quote.description}</p>
                            )}
                            {quote.timeline && (
                              <div className="flex items-center text-sm text-neutral-500">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>Timeline: {quote.timeline}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-neutral-800 mb-2">No quotes yet</h3>
                        <p className="text-neutral-600">
                          {canSubmitQuote 
                            ? 'Be the first to submit a quote for this project!'
                            : 'Contractors will submit quotes for this project soon.'
                          }
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Submit Quote Form (Service Providers Only) */}
                {canSubmitQuote && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Submit a Quote</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...quoteForm}>
                        <form onSubmit={quoteForm.handleSubmit(onSubmitQuote)} className="space-y-4">
                          <FormField
                            control={quoteForm.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quote Amount ($)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter your quote amount"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={quoteForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe your proposed solution and approach..."
                                    className="min-h-[100px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={quoteForm.control}
                            name="timeline"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estimated Timeline</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., 2-3 weeks"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button 
                            type="submit" 
                            className="w-full bg-secondary text-white hover:bg-green-600"
                            disabled={createQuoteMutation.isPending}
                          >
                            {createQuoteMutation.isPending ? 'Submitting...' : 'Submit Quote'}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="chat" className="space-y-6">
                {/* Real-time Chat */}
                {user.userType === 'service_provider' && (
                  <ProjectChat 
                    projectId={project.id} 
                    receiverId={project.homeownerId} 
                    receiverName="Homeowner"
                  />
                )}
                {user.userType === 'homeowner' && (
                  <div className="space-y-4">
                    {/* Show general project chat for all conversations */}
                    <ProjectChat 
                      projectId={project.id} 
                      receiverId={0} // Use 0 to indicate general project chat
                      receiverName="Project Conversations"
                    />
                    
                    {/* Show individual chats if there are quotes */}
                    {quotes && quotes.length > 0 && (
                      <div className="space-y-4 mt-6">
                        <h3 className="text-lg font-semibold text-neutral-800 border-b pb-2">
                          Conversations with Contractors
                        </h3>
                        {quotes.map((quote) => (
                          <ProjectChat 
                            key={quote.id}
                            projectId={project.id} 
                            receiverId={quote.serviceProviderId} 
                            receiverName={`Contractor (Quote: $${quote.amount})`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="schedule" className="space-y-6">
                {/* Schedule Content */}
                <Card>
                  <CardHeader>
                    <CardTitle>Project Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-600">
                      Schedule appointments and track project milestones here.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Category:</span>
                  <span className="font-medium">{project.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Location:</span>
                  <span className="font-medium">{project.zipCode}</span>
                </div>
                {project.budget && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Budget:</span>
                    <span className="font-medium">{project.budget}</span>
                  </div>
                )}
                {project.urgency && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Timeline:</span>
                    <span className="font-medium">{project.urgency.replace('_', ' ')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-600">Posted:</span>
                  <span className="font-medium">{formatTimeAgo(project.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-neutral-600 mb-4">
                  Use the Chat tab above for real-time messaging with contractors.
                </p>
                {isProjectOwner && quotes && quotes.length > 0 && (
                  <Button className="w-full" variant="outline">
                    View All Quotes
                  </Button>
                )}
                {user?.userType === 'service_provider' && canSubmitQuote && (
                  <Button className="w-full bg-secondary text-white hover:bg-green-600">
                    Submit Quote
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            {quotes && quotes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Active Contractors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {quotes.map((quote) => (
                      <div key={quote.id} className="flex items-center justify-between p-2 bg-neutral-50 rounded">
                        <span className="text-sm font-medium">Contractor</span>
                        <Badge variant="outline">${quote.amount}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Status */}
            <Card>
              <CardHeader>
                <CardTitle>Project Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Current Status:</span>
                    <Badge className={getStatusColor(project.status)}>
                      {getStatusLabel(project.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Quotes Received:</span>
                    <span className="font-medium">{quotes?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
