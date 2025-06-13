import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lead, Project } from '@/types';
import { MapPin, Clock, DollarSign } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface LeadCardProps {
  lead: Lead & { project?: Project };
}

export default function LeadCard({ lead }: LeadCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateLeadMutation = useMutation({
    mutationFn: async ({ status, revenue }: { status?: string; revenue?: number }) => {
      const response = await apiRequest('PATCH', `/api/leads/${lead.id}`, { status, revenue });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats'] });
      toast({
        title: 'Lead Updated',
        description: 'Lead status has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lead',
        variant: 'destructive',
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'quoted': return 'bg-purple-100 text-purple-800';
      case 'won': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'New Lead';
      case 'contacted': return 'Contacted';
      case 'quoted': return 'Quoted';
      case 'won': return 'Won';
      case 'lost': return 'Lost';
      default: return status;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const handleStatusChange = (newStatus: string) => {
    updateLeadMutation.mutate({ status: newStatus });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h5 className="font-semibold text-neutral-800">{lead.project?.title}</h5>
            <p className="text-sm text-neutral-600">{lead.project?.description}</p>
          </div>
          <div className="text-right">
            <Badge className={getStatusColor(lead.status)}>
              {getStatusLabel(lead.status)}
            </Badge>
            <div className="text-lg font-bold text-secondary mt-1">${lead.price}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-neutral-500">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{lead.project?.zipCode}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{formatTimeAgo(lead.createdAt)}</span>
            </div>
            {lead.project?.budget && (
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                <span>{lead.project.budget} budget</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          {lead.status === 'new' && (
            <Button 
              onClick={() => handleStatusChange('contacted')}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              disabled={updateLeadMutation.isPending}
            >
              Contact
            </Button>
          )}
          {lead.status === 'contacted' && (
            <Button 
              onClick={() => handleStatusChange('quoted')}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
              disabled={updateLeadMutation.isPending}
            >
              Quote Sent
            </Button>
          )}
          {lead.status === 'quoted' && (
            <>
              <Button 
                onClick={() => handleStatusChange('won')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                disabled={updateLeadMutation.isPending}
              >
                Mark Won
              </Button>
              <Button 
                onClick={() => handleStatusChange('lost')}
                variant="outline"
                className="px-4 py-2 rounded-lg text-sm font-medium"
                disabled={updateLeadMutation.isPending}
              >
                Mark Lost
              </Button>
            </>
          )}
          <Button variant="ghost" className="text-primary hover:text-blue-700 px-4 py-2 text-sm font-medium">
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
