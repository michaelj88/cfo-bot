import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/shared/Card';
import MetricCard from '@/components/shared/MetricCard';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from "@/components/ui/button";
import { Plus, Camera, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { format, parseISO, subMonths } from 'date-fns';
import SnapshotForm from '@/components/snapshot/SnapshotForm';

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
          <Button
            onClick={() => setShowForm(true)}
            className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-5"
          >
            <Plus className="w-4 h-4 mr-2" />
            Update numbers
          </Button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              label="Cash in bank"
              value={formatCurrency(latestSnapshot?.cash_balance)}
              {...calculateTrend(latestSnapshot?.cash_balance, previousSnapshot?.cash_balance)}
            />
            <MetricCard
              label="Runway"
              value={calculateRunway()}
              subtext="at current burn"
            />
            <MetricCard
              label="Net burn this month"
              value={formatCurrency((latestSnapshot?.expenses || 0) - (latestSnapshot?.revenue || 0))}
              trendDirection={(latestSnapshot?.expenses || 0) - (latestSnapshot?.revenue || 0) > 0 ? 'down' : 'up'}
            />
          </div>

          {/* Revenue & Expenses */}
          <Card>
            <h3 className="text-lg font-medium text-stone-800 mb-6">This period</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-stone-500">Revenue</span>
                </div>
                <p className="text-2xl font-semibold text-stone-800">
                  {formatCurrency(latestSnapshot?.revenue)}
                </p>
                {previousSnapshot && (
                  <p className="text-sm text-stone-400 mt-1">
                    {formatCurrency(previousSnapshot?.revenue)} last period
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-stone-500">Expenses</span>
                </div>
                <p className="text-2xl font-semibold text-stone-800">
                  {formatCurrency(latestSnapshot?.expenses)}
                </p>
                {previousSnapshot && (
                  <p className="text-sm text-stone-400 mt-1">
                    {formatCurrency(previousSnapshot?.expenses)} last period
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Receivables & Payables */}
          <Card>
            <h3 className="text-lg font-medium text-stone-800 mb-6">Outstanding</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-stone-500 mb-1">Accounts receivable</p>
                <p className="text-xl font-semibold text-stone-800">
                  {formatCurrency(latestSnapshot?.accounts_receivable || 0)}
                </p>
                <p className="text-sm text-stone-400 mt-1">Money owed to you</p>
              </div>
              <div>
                <p className="text-sm text-stone-500 mb-1">Accounts payable</p>
                <p className="text-xl font-semibold text-stone-800">
                  {formatCurrency(latestSnapshot?.accounts_payable || 0)}
                </p>
                <p className="text-sm text-stone-400 mt-1">Money you owe</p>
              </div>
            </div>
          </Card>

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