import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/shared/Card';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Plus, 
  Settings as SettingsIcon, 
  Trash2, 
  X, 
  Loader2,
  Edit2,
  Check
} from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'saas', label: 'SaaS' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'services', label: 'Services' },
  { value: 'agency', label: 'Agency' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'AUD', label: 'AUD ($)' },
];

export default function Settings() {
  const urlParams = new URLSearchParams(window.location.search);
  const defaultTab = urlParams.get('tab') || 'businesses';
  
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const queryClient = useQueryClient();

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['businesses', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.Business.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user,
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createBusiness = useMutation({
    mutationFn: (data) => base44.entities.Business.create(data),
    onSuccess: (newBusiness) => {
      queryClient.invalidateQueries(['businesses']);
      setShowBusinessForm(false);
      // Auto-select the new business
      localStorage.setItem('selectedBusinessId', newBusiness.id);
      window.dispatchEvent(new CustomEvent('businessChanged', { detail: newBusiness.id }));
    },
  });

  const updateBusiness = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Business.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['businesses']);
      setEditingBusiness(null);
    },
  });

  const deleteBusiness = useMutation({
    mutationFn: (id) => base44.entities.Business.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['businesses']);
      const selectedId = localStorage.getItem('selectedBusinessId');
      if (selectedId && !businesses.find(b => b.id === selectedId)) {
        const remaining = businesses.filter(b => b.id !== selectedId);
        if (remaining.length > 0) {
          localStorage.setItem('selectedBusinessId', remaining[0].id);
          window.dispatchEvent(new CustomEvent('businessChanged', { detail: remaining[0].id }));
        } else {
          localStorage.removeItem('selectedBusinessId');
        }
      }
    },
  });

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        subtitle="Manage your businesses and preferences"
      />

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="bg-stone-100 rounded-xl p-1">
          <TabsTrigger value="businesses" className="rounded-lg data-[state=active]:bg-white">
            Businesses
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-white">
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="businesses" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-stone-800">Your businesses</h2>
              <p className="text-sm text-stone-500">Manage the businesses you're tracking</p>
            </div>
            <Button
              onClick={() => setShowBusinessForm(true)}
              className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add business
            </Button>
          </div>

          {showBusinessForm && (
            <BusinessForm
              onClose={() => setShowBusinessForm(false)}
              onSave={(data) => createBusiness.mutate(data)}
              saving={createBusiness.isPending}
            />
          )}

          {editingBusiness && (
            <BusinessForm
              business={editingBusiness}
              onClose={() => setEditingBusiness(null)}
              onSave={(data) => updateBusiness.mutate({ id: editingBusiness.id, data })}
              saving={updateBusiness.isPending}
            />
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[1,2].map(i => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-stone-200 animate-pulse" />
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No businesses yet"
              description="Add your first business to start tracking your finances"
              action="Add your first business"
              onAction={() => setShowBusinessForm(true)}
            />
          ) : (
            <div className="space-y-4">
              {businesses.map(business => {
                const selectedId = localStorage.getItem('selectedBusinessId');
                const isSelected = business.id === selectedId;
                
                return (
                  <Card key={business.id} className={isSelected ? 'ring-2 ring-stone-900' : ''}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-stone-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-stone-800">{business.name}</h3>
                            {isSelected && (
                              <span className="text-xs bg-stone-900 text-white px-2 py-0.5 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          {(business.industry || business.type) && (
                            <p className="text-sm text-stone-500 capitalize mt-0.5">
                              {BUSINESS_TYPES.find(t => t.value === (business.industry || business.type))?.label || business.industry || business.type}
                            </p>
                          )}
                          {business.description && (
                            <p className="text-sm text-stone-400 mt-1">{business.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingBusiness(business)}
                          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-stone-400" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this business? All associated data will be lost.')) {
                              deleteBusiness.mutate(business.id);
                            }
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-stone-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <h3 className="text-lg font-medium text-stone-800 mb-6">Account details</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-stone-500 text-sm">Email</Label>
                <p className="text-stone-800 mt-1">{user?.email || '—'}</p>
              </div>
              <div>
                <Label className="text-stone-500 text-sm">Name</Label>
                <p className="text-stone-800 mt-1">{user?.full_name || '—'}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-medium text-stone-800 mb-4">About CFO Bot</h3>
            <p className="text-sm text-stone-500 leading-relaxed">
              CFO Bot is your calm financial companion. We help small business founders 
              understand their numbers, reduce anxiety, and make better decisions — 
              all through plain language grounded in your real data.
            </p>
            <p className="text-sm text-stone-400 mt-4">
              Version 1.0
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BusinessForm({ business, onClose, onSave, saving }) {
  const [formData, setFormData] = useState({
    name: business?.name || '',
    industry: business?.industry || business?.type || '',
    description: business?.description || '',
    currency: business?.currency || 'USD',
    timezone: business?.timezone || 'America/New_York',
    monthly_burn_target: business?.monthly_burn_target || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      monthly_burn_target: formData.monthly_burn_target ? parseFloat(formData.monthly_burn_target) : null,
    });
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-stone-800">
          {business ? 'Edit business' : 'Add a business'}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg">
          <X className="w-5 h-5 text-stone-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label className="text-stone-700">Business name</Label>
          <Input
            placeholder="My Company"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1.5 rounded-xl border-stone-200"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-stone-700">Industry</Label>
            <Select
              value={formData.industry}
              onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
            >
              <SelectTrigger className="mt-1.5 rounded-xl border-stone-200">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-stone-700">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
            >
              <SelectTrigger className="mt-1.5 rounded-xl border-stone-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(cur => (
                  <SelectItem key={cur.value} value={cur.value}>
                    {cur.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-stone-700">Timezone</Label>
          <Select
            value={formData.timezone}
            onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
          >
            <SelectTrigger className="mt-1.5 rounded-xl border-stone-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map(tz => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-stone-700">Description (optional)</Label>
          <Textarea
            placeholder="Brief description of your business..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="mt-1.5 rounded-xl border-stone-200"
          />
        </div>

        <div>
          <Label className="text-stone-700">Monthly burn target (optional)</Label>
          <p className="text-xs text-stone-400 mb-1.5">Set a goal to stay under this amount</p>
          <Input
            type="number"
            placeholder="0"
            value={formData.monthly_burn_target}
            onChange={(e) => setFormData(prev => ({ ...prev, monthly_burn_target: e.target.value }))}
            className="rounded-xl border-stone-200"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || !formData.name}
            className="flex-1 bg-stone-900 hover:bg-stone-800 text-white rounded-xl"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : business ? 'Save changes' : 'Add business'}
          </Button>
        </div>
      </form>
    </Card>
  );
}