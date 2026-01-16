import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/shared/Card';
import MetricCard from '@/components/shared/MetricCard';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from "@/components/ui/button";
import { Plus, Camera, TrendingUp, TrendingDown, Minus, Calendar, Upload } from 'lucide-react';
import { format, parseISO, subMonths } from 'date-fns';
import SnapshotForm from '@/components/snapshot/SnapshotForm';
import StatementUploadForm from '@/components/snapshot/StatementUploadForm';

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Snapshot() {
  const [businessId, setBusinessId] = useState(localStorage.getItem('selectedBusinessId'));
  const [showForm, setShowForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    const handler = (e) => setBusinessId(e.detail);
    window.addEventListener('businessChanged', handler);
    return () => window.removeEventListener('businessChanged', handler);
  }, []);

  const { data: snapshots = [], isLoading, refetch } = useQuery({
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
  const previousSnapshot = snapshots[1];

  useEffect(() => {
    async function generateInsights() {
      if (!latestSnapshot || loadingInsights || insights) return;
      
      setLoadingInsights(true);
      try {
        const context = {
          cash_balance: latestSnapshot.cash_balance,
          revenue: latestSnapshot.revenue || 0,
          expenses: latestSnapshot.expenses || 0,
          profit_loss: (latestSnapshot.revenue || 0) - (latestSnapshot.expenses || 0),
          runway_months: latestSnapshot.expenses > latestSnapshot.revenue 
            ? Math.floor(latestSnapshot.cash_balance / ((latestSnapshot.expenses || 0) - (latestSnapshot.revenue || 0)))
            : null,
          previous_revenue: previousSnapshot?.revenue,
          previous_expenses: previousSnapshot?.expenses,
          business_name: business?.name,
          industry: business?.industry
        };

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a calm, supportive CFO advisor. Given this financial snapshot for ${context.business_name}:

Cash: $${context.cash_balance?.toLocaleString()}
Monthly Revenue: $${context.revenue?.toLocaleString()}
Monthly Expenses: $${context.expenses?.toLocaleString()}
Monthly Profit/Loss: $${context.profit_loss?.toLocaleString()}
${context.runway_months ? `Runway: ${context.runway_months} months` : 'Profitable'}
${context.previous_revenue ? `Previous Revenue: $${context.previous_revenue?.toLocaleString()}` : ''}
${context.previous_expenses ? `Previous Expenses: $${context.previous_expenses?.toLocaleString()}` : ''}

Provide:
1. "what_this_means": A 2-3 sentence plain-language summary of their financial position. Be reassuring and factual.
2. "recommendations": An array of 2-3 objects, each with "action" (short title) and "reason" (1 sentence why). Be specific and actionable.

Keep the tone calm, human, and supportive. Avoid jargon.`,
          response_json_schema: {
            type: 'object',
            properties: {
              what_this_means: { type: 'string' },
              recommendations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    action: { type: 'string' },
                    reason: { type: 'string' }
                  }
                }
              }
            }
          }
        });

        setInsights(result);
      } catch (error) {
        console.error('Failed to generate insights:', error);
      } finally {
        setLoadingInsights(false);
      }
    }

    generateInsights();
  }, [latestSnapshot, business]);

  const calculateRunway = () => {
    if (!latestSnapshot) return null;
    const netBurn = (latestSnapshot.expenses || 0) - (latestSnapshot.revenue || 0);
    if (netBurn <= 0) return 'Profitable';
    const months = Math.floor(latestSnapshot.cash_balance / netBurn);
    return `${months} months`;
  };

  const calculateTrend = (current, previous) => {
    if (!current || !previous) return { trend: null, direction: 'neutral' };
    const diff = ((current - previous) / previous) * 100;
    if (Math.abs(diff) < 1) return { trend: 'No change', direction: 'neutral' };
    return {
      trend: `${diff > 0 ? '+' : ''}${diff.toFixed(0)}%`,
      direction: diff > 0 ? 'up' : 'down'
    };
  };

  const getExpenseChanges = () => {
    if (!latestSnapshot || !previousSnapshot) return [];
    
    const categories = ['revenue', 'expenses', 'accounts_payable'];
    const changes = categories
      .map(cat => {
        const current = latestSnapshot[cat] || 0;
        const previous = previousSnapshot[cat] || 0;
        if (previous === 0) return null;
        const change = current - previous;
        const percentChange = (change / previous) * 100;
        return {
          name: cat === 'accounts_payable' ? 'Accounts Payable' : cat.charAt(0).toUpperCase() + cat.slice(1),
          change,
          percentChange,
          current
        };
      })
      .filter(c => c && Math.abs(c.change) > 0)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 3);
    
    return changes;
  };

  if (!businessId) {
    return (
      <div className="min-h-screen p-6 lg:p-10">
        <EmptyState
          icon={Camera}
          title="No business selected"
          description="Create a business in Settings to get started with your financial snapshot."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader
        title="Snapshot"
        subtitle="Your current financial position at a glance"
        action={
          <div className="flex gap-3">
            <Button
              onClick={() => setShowUploadForm(true)}
              variant="outline"
              className="rounded-xl"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Statement
            </Button>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-5"
            >
              <Plus className="w-4 h-4 mr-2" />
              Update numbers
            </Button>
          </div>
        }
      />

      {showForm && (
        <SnapshotForm
          businessId={businessId}
          onClose={() => setShowForm(false)}
          onSave={() => {
            refetch();
            setShowForm(false);
          }}
          latestSnapshot={latestSnapshot}
        />
      )}

      {showUploadForm && (
        <StatementUploadForm
          businessId={businessId}
          onClose={() => setShowUploadForm(false)}
          onSuccess={() => setShowUploadForm(false)}
        />
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-stone-200 animate-pulse" />
          ))}
        </div>
      ) : snapshots.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No financial data yet"
          description="Add your first snapshot to see your financial health. We'll walk you through it."
          action="Add your first snapshot"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Cash on hand"
              value={formatCurrency(latestSnapshot?.cash_balance)}
              {...calculateTrend(latestSnapshot?.cash_balance, previousSnapshot?.cash_balance)}
            />
            <MetricCard
              label="Monthly profit/loss"
              value={formatCurrency((latestSnapshot?.revenue || 0) - (latestSnapshot?.expenses || 0))}
              trendDirection={(latestSnapshot?.revenue || 0) - (latestSnapshot?.expenses || 0) >= 0 ? 'up' : 'down'}
            />
            <MetricCard
              label="Runway"
              value={calculateRunway()}
              subtext="at current burn"
            />
            <MetricCard
              label="Revenue"
              value={formatCurrency(latestSnapshot?.revenue)}
              {...calculateTrend(latestSnapshot?.revenue, previousSnapshot?.revenue)}
            />
          </div>

          {/* Top Changes */}
          {previousSnapshot && getExpenseChanges().length > 0 && (
            <Card>
              <h3 className="text-lg font-medium text-stone-800 mb-4">
                Changes from last period
              </h3>
              <div className="space-y-3">
                {getExpenseChanges().map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      {item.change > 0 ? (
                        <TrendingUp className="w-4 h-4 text-red-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-emerald-600" />
                      )}
                      <span className="text-sm text-stone-700">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-stone-800">
                        {item.change > 0 ? '+' : ''}{formatCurrency(item.change)}
                      </p>
                      <p className="text-xs text-stone-400">
                        {item.percentChange > 0 ? '+' : ''}{item.percentChange.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* What this means */}
          {insights?.what_this_means && (
            <Card>
              <h3 className="text-lg font-medium text-stone-800 mb-3">
                What this means
              </h3>
              <p className="text-stone-600 leading-relaxed">
                {insights.what_this_means}
              </p>
            </Card>
          )}

          {/* Recommended next moves */}
          {insights?.recommendations && insights.recommendations.length > 0 && (
            <Card>
              <h3 className="text-lg font-medium text-stone-800 mb-4">
                Recommended next moves
              </h3>
              <div className="space-y-4">
                {insights.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center flex-shrink-0 text-xs font-medium mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-stone-800 mb-1">
                        {rec.action}
                      </p>
                      <p className="text-sm text-stone-600">
                        {rec.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent History */}
          {snapshots.length > 1 && (
            <Card padding="none">
              <div className="p-6 pb-4">
                <h3 className="text-lg font-medium text-stone-800">History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-t border-stone-100">
                      <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Period</th>
                      <th className="text-right text-xs font-medium text-stone-400 px-6 py-3">Cash</th>
                      <th className="text-right text-xs font-medium text-stone-400 px-6 py-3">Revenue</th>
                      <th className="text-right text-xs font-medium text-stone-400 px-6 py-3">Expenses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.slice(0, 6).map((snap, i) => (
                      <tr key={snap.id} className="border-t border-stone-100">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-stone-400" />
                            <span className="text-sm text-stone-700">
                              {format(parseISO(snap.period), 'MMM yyyy')}
                            </span>
                          </div>
                        </td>
                        <td className="text-right px-6 py-4 text-sm font-medium text-stone-800">
                          {formatCurrency(snap.cash_balance)}
                        </td>
                        <td className="text-right px-6 py-4 text-sm text-stone-600">
                          {formatCurrency(snap.revenue)}
                        </td>
                        <td className="text-right px-6 py-4 text-sm text-stone-600">
                          {formatCurrency(snap.expenses)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Notes */}
          {latestSnapshot?.notes && (
            <Card>
              <h3 className="text-sm font-medium text-stone-500 mb-2">Notes</h3>
              <p className="text-stone-700">{latestSnapshot.notes}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}