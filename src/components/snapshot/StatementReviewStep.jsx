import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import Card from '../shared/Card';

const CATEGORIES = [
  'Revenue',
  'Cost of Goods Sold',
  'Payroll',
  'Marketing',
  'Software',
  'Rent',
  'General & Administrative',
  'Other'
];

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function StatementReviewStep({ 
  businessId, 
  statementId, 
  lineItems, 
  onComplete 
}) {
  const [items, setItems] = useState(lineItems);
  const [saving, setSaving] = useState(false);

  const handleCategoryChange = (index, category) => {
    const updated = [...items];
    updated[index] = { ...updated[index], category, is_suggested: false };
    setItems(updated);
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await base44.entities.StatementLineItem.bulkCreate(
        items.map(item => ({
          business_id: businessId,
          statement_id: statementId,
          line_name: item.line_name,
          amount: item.amount,
          category: item.category,
          is_suggested: item.is_suggested
        }))
      );
      onComplete();
    } catch (error) {
      alert('Failed to save categories. Please try again.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const suggestedCount = items.filter(i => i.is_suggested).length;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl my-8">
        <Card padding="large">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-stone-800 mb-2">
              Review & categorize line items
            </h2>
            <p className="text-sm text-stone-500">
              We've extracted {items.length} line items from your statement. 
              {suggestedCount > 0 && (
                <span className="text-stone-600"> {suggestedCount} categories were suggested based on your past uploads.</span>
              )}
            </p>
          </div>

          <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
            {items.map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 mb-1">
                    {item.line_name}
                  </p>
                  <p className="text-lg font-semibold text-stone-900">
                    {formatCurrency(item.amount)}
                  </p>
                </div>

                <div className="w-56 flex items-center gap-2">
                  <Select
                    value={item.category}
                    onValueChange={(value) => handleCategoryChange(index, value)}
                  >
                    <SelectTrigger className="rounded-xl border-stone-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {item.is_suggested && (
                    <div className="group relative">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <div className="absolute right-0 top-6 hidden group-hover:block w-48 p-2 bg-stone-900 text-white text-xs rounded-lg">
                        Suggested from previous uploads
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-stone-200">
            <p className="text-sm text-stone-500">
              You can always adjust categories later
            </p>
            <Button
              onClick={handleConfirm}
              className="bg-stone-900 hover:bg-stone-800 rounded-xl px-6"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Confirm & continue'
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}