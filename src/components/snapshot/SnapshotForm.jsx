import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Loader2 } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import Card from '@/components/shared/Card';

export default function SnapshotForm({ businessId, onClose, onSave, latestSnapshot }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    period: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    cash_balance: latestSnapshot?.cash_balance || '',
    revenue: '',
    expenses: '',
    accounts_receivable: latestSnapshot?.accounts_receivable || '',
    accounts_payable: latestSnapshot?.accounts_payable || '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    await base44.entities.FinancialSnapshot.create({
      business_id: businessId,
      ...formData,
      cash_balance: parseFloat(formData.cash_balance) || 0,
      revenue: parseFloat(formData.revenue) || 0,
      expenses: parseFloat(formData.expenses) || 0,
      accounts_receivable: parseFloat(formData.accounts_receivable) || 0,
      accounts_payable: parseFloat(formData.accounts_payable) || 0,
    });
    
    setSaving(false);
    onSave();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-stone-800">Update your numbers</h2>
            <p className="text-sm text-stone-500 mt-1">Enter your financial data for this period</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-stone-700">Period</Label>
            <Input
              type="date"
              value={formData.period}
              onChange={(e) => handleChange('period', e.target.value)}
              className="mt-1.5 rounded-xl border-stone-200"
            />
          </div>

          <div>
            <Label className="text-stone-700">Cash in bank</Label>
            <p className="text-xs text-stone-400 mb-1.5">Total cash across all accounts</p>
            <Input
              type="number"
              placeholder="0"
              value={formData.cash_balance}
              onChange={(e) => handleChange('cash_balance', e.target.value)}
              className="rounded-xl border-stone-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700">Revenue</Label>
              <p className="text-xs text-stone-400 mb-1.5">This period</p>
              <Input
                type="number"
                placeholder="0"
                value={formData.revenue}
                onChange={(e) => handleChange('revenue', e.target.value)}
                className="rounded-xl border-stone-200"
              />
            </div>
            <div>
              <Label className="text-stone-700">Expenses</Label>
              <p className="text-xs text-stone-400 mb-1.5">This period</p>
              <Input
                type="number"
                placeholder="0"
                value={formData.expenses}
                onChange={(e) => handleChange('expenses', e.target.value)}
                className="rounded-xl border-stone-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700">Receivables</Label>
              <p className="text-xs text-stone-400 mb-1.5">Money owed to you</p>
              <Input
                type="number"
                placeholder="0"
                value={formData.accounts_receivable}
                onChange={(e) => handleChange('accounts_receivable', e.target.value)}
                className="rounded-xl border-stone-200"
              />
            </div>
            <div>
              <Label className="text-stone-700">Payables</Label>
              <p className="text-xs text-stone-400 mb-1.5">Money you owe</p>
              <Input
                type="number"
                placeholder="0"
                value={formData.accounts_payable}
                onChange={(e) => handleChange('accounts_payable', e.target.value)}
                className="rounded-xl border-stone-200"
              />
            </div>
          </div>

          <div>
            <Label className="text-stone-700">Notes (optional)</Label>
            <Textarea
              placeholder="Any context about this period..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="mt-1.5 rounded-xl border-stone-200 min-h-[80px]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !formData.cash_balance}
              className="flex-1 bg-stone-900 hover:bg-stone-800 text-white rounded-xl"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save snapshot'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}