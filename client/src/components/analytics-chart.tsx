import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsStats } from '@/types';

interface AnalyticsChartProps {
  stats: AnalyticsStats;
}

export default function AnalyticsChart({ stats }: AnalyticsChartProps) {
  const totalInvestment = stats.totalLeads * stats.avgLeadValue;
  const roi = totalInvestment > 0 ? ((stats.totalRevenue - totalInvestment) / totalInvestment) * 100 : 0;
  const avgRevenuePerLead = stats.totalLeads > 0 ? stats.totalRevenue / stats.totalLeads : 0;

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
          <CardTitle className="text-white">ROI Calculator & Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">${totalInvestment.toFixed(0)}</div>
              <div className="text-sm text-green-100">Lead Investment</div>
              <div className="text-xs text-green-200">${stats.avgLeadValue.toFixed(0)} per lead</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(0)}</div>
              <div className="text-sm text-green-100">Revenue Generated</div>
              <div className="text-xs text-green-200">${avgRevenuePerLead.toFixed(0)} per lead</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${roi >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%
              </div>
              <div className="text-sm text-green-100">Return on Investment</div>
              <div className="text-xs text-green-200">
                {roi >= 0 ? 'Profitable' : 'Needs improvement'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">${(stats.totalRevenue - totalInvestment).toFixed(0)}</div>
              <div className="text-sm text-green-100">Net Profit</div>
              <div className="text-xs text-green-200">
                {stats.totalRevenue - totalInvestment >= 0 ? 'Positive' : 'Negative'}
              </div>
            </div>
          </div>
          
          {/* ROI Insights */}
          <div className="mt-6 p-4 bg-white/10 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Performance Insights</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-200">Cost per lead:</span>
                <span className="text-white ml-2">${stats.avgLeadValue.toFixed(0)}</span>
              </div>
              <div>
                <span className="text-green-200">Revenue per lead:</span>
                <span className="text-white ml-2">${avgRevenuePerLead.toFixed(0)}</span>
              </div>
              <div>
                <span className="text-green-200">Conversion rate:</span>
                <span className="text-white ml-2">{stats.conversionRate}%</span>
              </div>
              <div>
                <span className="text-green-200">Total leads:</span>
                <span className="text-white ml-2">{stats.totalLeads}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
