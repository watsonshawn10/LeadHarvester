import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navigation from '@/components/navigation';
import LeadCard from '@/components/lead-card';
import AnalyticsChart from '@/components/analytics-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { Lead, AnalyticsStats } from '@/types';
import { DollarSign, TrendingUp, Users, Award, Filter, Calendar } from 'lucide-react';
import { Redirect } from 'wouter';

export default function BusinessDashboard() {
  const { user } = useAuth();
  const [leadFilter, setLeadFilter] = useState('all');

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads/my'],
    enabled: !!user && user.userType === 'service_provider',
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AnalyticsStats>({
    queryKey: ['/api/analytics/stats'],
    enabled: !!user && user.userType === 'service_provider',
  });

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (user.userType !== 'service_provider') {
    return <Redirect to="/homeowner-dashboard" />;
  }

  const filteredLeads = leads?.filter(lead => {
    if (leadFilter === 'all') return true;
    return lead.status === leadFilter;
  }) || [];

  const getStatusCounts = () => {
    if (!leads) return { new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 };
    return leads.reduce((acc, lead) => {
      acc[lead.status as keyof typeof acc] = (acc[lead.status as keyof typeof acc] || 0) + 1;
      return acc;
    }, { new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 });
  };

  const statusCounts = getStatusCounts();
  const monthlyRevenue = stats?.totalRevenue || 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Business Dashboard Header */}
        <div className="gradient-secondary text-white rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {user.businessName || `${user.firstName} ${user.lastName}` || user.username}
              </h1>
              <p className="text-green-100">Premium Pro Member • Licensed & Insured</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">${monthlyRevenue.toFixed(0)}</div>
              <div className="text-green-100 text-sm">This month's revenue</div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.totalLeads || leads?.length || 0}
                  </div>
                  <div className="text-sm text-neutral-600">Total Leads</div>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {statusCounts.won || 0}
                  </div>
                  <div className="text-sm text-neutral-600">Jobs Won</div>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    ${monthlyRevenue.toFixed(0)}
                  </div>
                  <div className="text-sm text-neutral-600">Revenue</div>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats?.conversionRate ? `${(stats.conversionRate * 100).toFixed(1)}%` : '0%'}
                  </div>
                  <div className="text-sm text-neutral-600">Win Rate</div>
                </div>
                <div className="p-2 bg-orange-100 rounded-full">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions for Contractors */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-8">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-auto p-4 flex flex-col items-center space-y-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200">
              <Users className="h-6 w-6" />
              <span className="text-sm font-medium">Browse New Leads</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <DollarSign className="h-6 w-6" />
              <span className="text-sm font-medium">Submit Quote</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Calendar className="h-6 w-6" />
              <span className="text-sm font-medium">Schedule Jobs</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Award className="h-6 w-6" />
              <span className="text-sm font-medium">View Analytics</span>
            </Button>
          </div>
        </div>

        {/* Analytics Chart */}
        {!statsLoading && stats && (
          <div className="mb-8">
            <AnalyticsChart stats={stats} />
          </div>
        )}

        {/* Leads Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Recent Leads
              </CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-neutral-600">
                  <Filter className="h-4 w-4" />
                  <span>Filter:</span>
                </div>
                <Select value={leadFilter} onValueChange={setLeadFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leads ({leads?.length || 0})</SelectItem>
                    <SelectItem value="new">New ({statusCounts.new})</SelectItem>
                    <SelectItem value="contacted">Contacted ({statusCounts.contacted})</SelectItem>
                    <SelectItem value="quoted">Quoted ({statusCounts.quoted})</SelectItem>
                    <SelectItem value="won">Won ({statusCounts.won})</SelectItem>
                    <SelectItem value="lost">Lost ({statusCounts.lost})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border border-neutral-200 rounded-lg p-4 animate-pulse">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="h-5 bg-neutral-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-neutral-200 rounded w-full"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-6 bg-neutral-200 rounded w-16 mb-2"></div>
                        <div className="h-5 bg-neutral-200 rounded w-12"></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-4">
                        <div className="h-4 bg-neutral-200 rounded w-20"></div>
                        <div className="h-4 bg-neutral-200 rounded w-16"></div>
                        <div className="h-4 bg-neutral-200 rounded w-24"></div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-8 bg-neutral-200 rounded w-20"></div>
                        <div className="h-8 bg-neutral-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredLeads.length > 0 ? (
              <div className="space-y-4">
                {filteredLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-neutral-400 mb-4">
                  <TrendingUp className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                  {leadFilter === 'all' ? 'No leads yet' : `No ${leadFilter} leads`}
                </h3>
                <p className="text-neutral-600 mb-6">
                  {leadFilter === 'all' 
                    ? 'Start getting quality leads for your business by optimizing your profile and services.'
                    : `You don't have any leads with ${leadFilter} status at the moment.`
                  }
                </p>
                {leadFilter !== 'all' && (
                  <Button 
                    onClick={() => setLeadFilter('all')} 
                    variant="outline"
                    className="mr-4"
                  >
                    View All Leads
                  </Button>
                )}
                <Button className="bg-secondary text-white hover:bg-green-600">
                  <Award className="mr-2 h-4 w-4" />
                  Upgrade Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Section */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Card className="hover-lift cursor-pointer">
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 text-secondary mx-auto mb-3" />
              <h3 className="font-semibold text-neutral-800 mb-2">Purchase Credits</h3>
              <p className="text-sm text-neutral-600 mb-4">Buy lead credits to access more opportunities</p>
              <Button variant="outline" className="w-full">
                Buy Credits
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-lift cursor-pointer">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-neutral-800 mb-2">Profile Settings</h3>
              <p className="text-sm text-neutral-600 mb-4">Update your business profile and services</p>
              <Button variant="outline" className="w-full">
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-lift cursor-pointer">
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
              <h3 className="font-semibold text-neutral-800 mb-2">Get Verified</h3>
              <p className="text-sm text-neutral-600 mb-4">Upload license and insurance for better leads</p>
              <Button variant="outline" className="w-full">
                Get Verified
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
