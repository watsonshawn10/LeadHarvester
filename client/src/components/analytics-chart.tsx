import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsStats } from '@/types';

interface AnalyticsChartProps {
  stats: AnalyticsStats;
}

export default function AnalyticsChart({ stats }: AnalyticsChartProps) {
  const roi = stats.totalRevenue > 0 ? ((stats.totalRevenue - (stats.totalLeads * stats.avgLeadValue)) / (stats.totalLeads * stats.avgLeadValue)) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalLeads}</div>
            <div className="text-sm text-neutral-600">New Leads</div>
            <div className="text-xs text-green-600">This month</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary">{stats.conversionRate}%</div>
            <div className="text-sm text-neutral-600">Conversion Rate</div>
            <div className="text-xs text-green-600">+8% vs last month</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">${stats.avgLeadValue}</div>
            <div className="text-sm text-neutral-600">Avg Lead Value</div>
            <div className="text-xs text-green-600">+12% vs last month</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">4.9</div>
            <div className="text-sm text-neutral-600">Avg Rating</div>
            <div className="text-xs text-green-600">+0.2 vs last month</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-neutral-50 rounded-lg flex items-center justify-center">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
              alt="Business analytics dashboard with charts and graphs" 
              className="w-full h-full object-cover rounded-lg" 
            />
          </div>
        </CardContent>
      </Card>

      {/* ROI Calculator */}
      <Card className="gradient-secondary text-white">
        <CardHeader>
          <CardTitle className="text-white">ROI Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">${(stats.totalLeads * stats.avgLeadValue).toFixed(0)}</div>
              <div className="text-sm text-green-100">Total Lead Investment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(0)}</div>
              <div className="text-sm text-green-100">Revenue Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{roi.toFixed(0)}%</div>
              <div className="text-sm text-green-100">Return on Investment</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
