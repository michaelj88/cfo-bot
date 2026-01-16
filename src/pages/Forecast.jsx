import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/shared/Card';
import EmptyState from '@/components/shared/EmptyState';
import { TrendingUp, AlertCircle, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, addMonths } from 'date-fns';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Forecast() {
  const [businessId, setBusinessId] = useState(localStorage.getItem('selectedBusinessId'));
  const [assumptions, setAssumptions] = useState({
    revenueGrowth: 0,
    expenseChange: 0,
    monthsToForecast: 12,
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);

  useEffect(() => {
    const handler = (e) => setBusinessId(e.detail);
    window.addEventListener('businessChanged', handler);
    return () => window.removeEventListener('businessChanged', handler);
  }, []);

  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ['snapshots', businessId],
    queryFn: () => base44.entities.FinancialSnapshot.filter({ business_id: businessId }, '-period'),
    enabled: !!businessId,
  });

  const { data: business } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const businesses = await base44.entities.Business.filter({ id: businessId });
      return businesses[0];
    },
    enabled: !!businessId,
  });

  const latestSnapshot = snapshots[0];

  const generateForecast = () => {
    if (!latestSnapshot) return [];
    
    const forecast = [];
    let cash = latestSnapshot.cash_balance;
    let revenue = latestSnapshot.revenue || 0;
    let expenses = latestSnapshot.expenses || 0;
    
    const monthlyRevenueGrowth = assumptions.revenueGrowth / 100;
    const monthlyExpenseChange = assumptions.expenseChange / 100;
    
    for (let i = 1; i <= assumptions.monthsToForecast; i++) {
      revenue = revenue * (1 + monthlyRevenueGrowth);
      expenses = expenses * (1 + monthlyExpenseChange);
      const netChange = revenue - expenses;
      cash = cash + netChange;
      
      forecast.push({
        month: format(addMonths(new Date(), i), 'MMM yyyy'),
        cash: Math.round(cash),
        revenue: Math.round(revenue),
        expenses: Math.round(expenses),
        netChange: Math.round(netChange),
      });
    }
    
    return forecast;
  };

  const getAIInsights = async () => {
    if (!latestSnapshot) return;
    
    setAnalyzing(true);
    const forecast = generateForecast();
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `As a calm, thoughtful CFO, analyze this financial forecast for a small business. Be conversational and reassuring.

Current situation:
- Cash: ${formatCurrency(latestSnapshot.cash_balance)}
- Monthly revenue: ${formatCurrency(latestSnapshot.revenue || 0)}
- Monthly expenses: ${formatCurrency(latestSnapshot.expenses || 0)}
- Net monthly burn: ${formatCurrency((latestSnapshot.expenses || 0) - (latestSnapshot.revenue || 0))}

Forecast assumptions:
- Revenue growth: ${assumptions.revenueGrowth}% per month
- Expense change: ${assumptions.expenseChange}% per month

12-month forecast ending cash: ${formatCurrency(forecast[forecast.length - 1]?.cash || 0)}

Provide brief, actionable insights. Focus on:
1. Overall health assessment (1-2 sentences)
2. Key risk or opportunity (1-2 sentences)  
3. One specific recommendation (1-2 sentences)

Keep it warm and human, not robotic. Use plain language.`,
      response_json_schema: {
        type: 'object',
        properties: {
          health_assessment: { type: 'string' },
          key_insight: { type: 'string' },
          recommendation: { type: 'string' },
          sentiment: { type: 'string', enum: ['positive', 'cautious', 'concerning'] }
        }
      }
    });
    
    setAiInsights(result);
    setAnalyzing(false);
  };

  const forecast = generateForecast();
  const runwayEndMonth = forecast.findIndex(f => f.cash < 0);
  const willRunOutOfCash = runwayEndMonth !== -1;

  if (!businessId) {
    return (
      <div className="min-h-screen p-6 lg:p-10">
        <EmptyState
          icon={TrendingUp}
          title="No business selected"
          description="Create a business in Settings to start forecasting."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader
        title="Forecast"
        subtitle="See where your finances are heading"
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-stone-200 animate-pulse" />
          ))}
        </div>
      ) : !latestSnapshot ? (
        <EmptyState
          icon={TrendingUp}
          title="No financial data yet"
          description="Add a snapshot first to see your forecast. Head to the Snapshot tab to enter your numbers."
        />
      ) : (
        <div className="space-y-8">
          {/* Assumptions */}
          <Card>
            <h3 className="text-lg font-medium text-stone-800 mb-6">Assumptions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <Label className="text-stone-600">Monthly revenue growth</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input
                    type="number"
                    value={assumptions.revenueGrowth}
                    onChange={(e) => setAssumptions(prev => ({ ...prev, revenueGrowth: parseFloat(e.target.value) || 0 }))}
                    className="rounded-xl border-stone-200"
                  />
                  <span className="text-stone-500">%</span>
                </div>
              </div>
              <div>
                <Label className="text-stone-600">Monthly expense change</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input
                    type="number"
                    value={assumptions.expenseChange}
                    onChange={(e) => setAssumptions(prev => ({ ...prev, expenseChange: parseFloat(e.target.value) || 0 }))}
                    className="rounded-xl border-stone-200"
                  />
                  <span className="text-stone-500">%</span>
                </div>
              </div>
              <div>
                <Label className="text-stone-600">Months to forecast</Label>
                <Input
                  type="number"
                  min="1"
                  max="36"
                  value={assumptions.monthsToForecast}
                  onChange={(e) => setAssumptions(prev => ({ ...prev, monthsToForecast: parseInt(e.target.value) || 12 }))}
                  className="mt-1.5 rounded-xl border-stone-200"
                />
              </div>
            </div>
          </Card>

          {/* Key Projection */}
          <Card className={willRunOutOfCash ? 'border-amber-200 bg-amber-50' : ''}>
            <div className="flex items-start gap-4">
              {willRunOutOfCash ? (
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-medium text-stone-800">
                  {willRunOutOfCash 
                    ? `Cash runs out in ${runwayEndMonth + 1} months`
                    : `${assumptions.monthsToForecast} month outlook`
                  }
                </h3>
                <p className="text-stone-500 mt-1">
                  {willRunOutOfCash 
                    ? `At current rates, you'll need additional funding by ${forecast[runwayEndMonth]?.month}`
                    : `Projected cash in ${assumptions.monthsToForecast} months: ${formatCurrency(forecast[forecast.length - 1]?.cash)}`
                  }
                </p>
              </div>
            </div>
          </Card>

          {/* AI Insights */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-stone-800">CFO Bot Analysis</h3>
              <Button
                onClick={getAIInsights}
                disabled={analyzing}
                variant="outline"
                className="rounded-xl"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : aiInsights ? 'Refresh analysis' : 'Get insights'}
              </Button>
            </div>
            
            {aiInsights ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-stone-50">
                  <p className="text-sm text-stone-500 mb-1">Overall health</p>
                  <p className="text-stone-700">{aiInsights.health_assessment}</p>
                </div>
                <div className="p-4 rounded-xl bg-stone-50">
                  <p className="text-sm text-stone-500 mb-1">Key insight</p>
                  <p className="text-stone-700">{aiInsights.key_insight}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50">
                  <p className="text-sm text-blue-600 mb-1">Recommendation</p>
                  <p className="text-stone-700">{aiInsights.recommendation}</p>
                </div>
              </div>
            ) : (
              <p className="text-stone-400 text-sm">
                Click "Get insights" to have CFO Bot analyze your forecast
              </p>
            )}
          </Card>

          {/* Monthly Breakdown */}
          <Card padding="none">
            <div className="p-6 pb-4">
              <h3 className="text-lg font-medium text-stone-800">Monthly projection</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-stone-100">
                    <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Month</th>
                    <th className="text-right text-xs font-medium text-stone-400 px-6 py-3">Revenue</th>
                    <th className="text-right text-xs font-medium text-stone-400 px-6 py-3">Expenses</th>
                    <th className="text-right text-xs font-medium text-stone-400 px-6 py-3">Net</th>
                    <th className="text-right text-xs font-medium text-stone-400 px-6 py-3">Cash</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.map((row, i) => (
                    <tr key={i} className="border-t border-stone-100">
                      <td className="px-6 py-4 text-sm text-stone-700">{row.month}</td>
                      <td className="text-right px-6 py-4 text-sm text-stone-600">
                        {formatCurrency(row.revenue)}
                      </td>
                      <td className="text-right px-6 py-4 text-sm text-stone-600">
                        {formatCurrency(row.expenses)}
                      </td>
                      <td className={`text-right px-6 py-4 text-sm font-medium ${row.netChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {row.netChange >= 0 ? '+' : ''}{formatCurrency(row.netChange)}
                      </td>
                      <td className={`text-right px-6 py-4 text-sm font-semibold ${row.cash < 0 ? 'text-red-600' : 'text-stone-800'}`}>
                        {formatCurrency(row.cash)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}