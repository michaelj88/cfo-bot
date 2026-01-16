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
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  HelpCircle, 
  X, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock,
  ChevronRight,
  Sparkles
} from 'lucide-react';

function formatCurrency(amount) {
  if (!amount) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function Decisions() {
  const [businessId, setBusinessId] = useState(localStorage.getItem('selectedBusinessId'));
  const [showForm, setShowForm] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = (e) => setBusinessId(e.detail);
    window.addEventListener('businessChanged', handler);
    return () => window.removeEventListener('businessChanged', handler);
  }, []);

  const { data: decisions = [], isLoading } = useQuery({
    queryKey: ['decisions', businessId],
    queryFn: () => base44.entities.Decision.filter({ business_id: businessId }, '-created_date'),
    enabled: !!businessId,
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ['snapshots', businessId],
    queryFn: () => base44.entities.FinancialSnapshot.filter({ business_id: businessId }, '-period'),
    enabled: !!businessId,
  });

  const latestSnapshot = snapshots[0];

  const createDecision = useMutation({
    mutationFn: (data) => base44.entities.Decision.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['decisions', businessId]);
      setShowForm(false);
    },
  });

  const updateDecision = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Decision.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['decisions', businessId]);
    },
  });

  const analyzeDecision = async (decision) => {
    setAnalyzing(true);
    
    const context = latestSnapshot ? `
Current financial situation:
- Cash in bank: ${formatCurrency(latestSnapshot.cash_balance)}
- Monthly revenue: ${formatCurrency(latestSnapshot.revenue || 0)}
- Monthly expenses: ${formatCurrency(latestSnapshot.expenses || 0)}
- Monthly burn: ${formatCurrency((latestSnapshot.expenses || 0) - (latestSnapshot.revenue || 0))}
` : 'No financial data available yet.';

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `As a thoughtful, calm CFO advising a small business founder, analyze this financial decision:

Decision: ${decision.title}
Question: ${decision.question}
${decision.amount ? `Amount involved: ${formatCurrency(decision.amount)}` : ''}
${decision.context ? `Additional context: ${decision.context}` : ''}

${context}

Provide a balanced analysis with:
1. A clear recommendation (yes, no, or it depends)
2. Key considerations (2-3 bullet points)
3. What to watch out for
4. A confidence level for your recommendation

Be warm, conversational, and reassuring. Use plain language. Remember this is a real person making a stressful decision.`,
      response_json_schema: {
        type: 'object',
        properties: {
          recommendation: { type: 'string', enum: ['yes', 'no', 'depends'] },
          summary: { type: 'string' },
          considerations: { type: 'array', items: { type: 'string' } },
          watch_out_for: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
        }
      }
    });

    await updateDecision.mutateAsync({
      id: decision.id,
      data: { ai_analysis: JSON.stringify(result) }
    });

    setAnalyzing(false);
  };

  const statusConfig = {
    considering: { label: 'Considering', color: 'bg-amber-100 text-amber-700', icon: Clock },
    decided_yes: { label: 'Decided Yes', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    decided_no: { label: 'Decided No', color: 'bg-red-100 text-red-700', icon: XCircle },
    deferred: { label: 'Deferred', color: 'bg-stone-100 text-stone-600', icon: Clock },
  };

  if (!businessId) {
    return (
      <div className="min-h-screen p-6 lg:p-10">
        <EmptyState
          icon={HelpCircle}
          title="No business selected"
          description="Create a business in Settings to start tracking decisions."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader
        title="Decisions"
        subtitle="Think through big financial choices with clarity"
        action={
          <Button
            onClick={() => setShowForm(true)}
            className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-5"
          >
            <Plus className="w-4 h-4 mr-2" />
            New decision
          </Button>
        }
      />

      {/* New Decision Form */}
      {showForm && (
        <DecisionForm
          businessId={businessId}
          onClose={() => setShowForm(false)}
          onSave={(data) => createDecision.mutate(data)}
          saving={createDecision.isPending}
        />
      )}

      {/* Decision Detail View */}
      {selectedDecision && (
        <DecisionDetail
          decision={selectedDecision}
          onClose={() => setSelectedDecision(null)}
          onAnalyze={() => analyzeDecision(selectedDecision)}
          onUpdateStatus={(status) => {
            updateDecision.mutate({ id: selectedDecision.id, data: { status } });
            setSelectedDecision({ ...selectedDecision, status });
          }}
          analyzing={analyzing}
          statusConfig={statusConfig}
        />
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-stone-200 animate-pulse" />
          ))}
        </div>
      ) : decisions.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No decisions yet"
          description="When you're facing a big financial choice — hiring, purchasing, investing — add it here for a thoughtful analysis."
          action="Add your first decision"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-4">
          {decisions.map(decision => {
            const config = statusConfig[decision.status] || statusConfig.considering;
            const StatusIcon = config.icon;
            
            return (
              <Card
                key={decision.id}
                className="cursor-pointer hover:border-stone-300 transition-colors"
                onClick={() => setSelectedDecision(decision)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-stone-800 truncate">{decision.title}</h3>
                      <Badge className={`${config.color} text-xs flex-shrink-0`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-stone-500 line-clamp-2">{decision.question}</p>
                    {decision.amount && (
                      <p className="text-sm font-medium text-stone-600 mt-2">
                        {formatCurrency(decision.amount)}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-400 flex-shrink-0" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DecisionForm({ businessId, onClose, onSave, saving }) {
  const [formData, setFormData] = useState({
    title: '',
    question: '',
    context: '',
    amount: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      business_id: businessId,
      ...formData,
      amount: formData.amount ? parseFloat(formData.amount) : null,
      status: 'considering',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-stone-800">New decision</h2>
            <p className="text-sm text-stone-500 mt-1">What are you trying to decide?</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label className="text-stone-700">Title</Label>
            <Input
              placeholder="e.g., Hire a contractor"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1.5 rounded-xl border-stone-200"
            />
          </div>

          <div>
            <Label className="text-stone-700">What's the question?</Label>
            <Textarea
              placeholder="e.g., Should I hire a part-time designer at $3k/month?"
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              className="mt-1.5 rounded-xl border-stone-200 min-h-[100px]"
            />
          </div>

          <div>
            <Label className="text-stone-700">Amount involved (optional)</Label>
            <Input
              type="number"
              placeholder="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="mt-1.5 rounded-xl border-stone-200"
            />
          </div>

          <div>
            <Label className="text-stone-700">Additional context (optional)</Label>
            <Textarea
              placeholder="Any other details that might help with the analysis..."
              value={formData.context}
              onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
              className="mt-1.5 rounded-xl border-stone-200"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !formData.title || !formData.question}
              className="flex-1 bg-stone-900 hover:bg-stone-800 text-white rounded-xl"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add decision'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function DecisionDetail({ decision, onClose, onAnalyze, onUpdateStatus, analyzing, statusConfig }) {
  const analysis = decision.ai_analysis ? JSON.parse(decision.ai_analysis) : null;
  const config = statusConfig[decision.status] || statusConfig.considering;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-stone-800">{decision.title}</h2>
            <Badge className={`${config.color} text-xs mt-2`}>
              {config.label}
            </Badge>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-stone-500 mb-1">The question</p>
            <p className="text-stone-700">{decision.question}</p>
          </div>

          {decision.amount && (
            <div>
              <p className="text-sm text-stone-500 mb-1">Amount involved</p>
              <p className="text-lg font-semibold text-stone-800">{formatCurrency(decision.amount)}</p>
            </div>
          )}

          {decision.context && (
            <div>
              <p className="text-sm text-stone-500 mb-1">Context</p>
              <p className="text-stone-700">{decision.context}</p>
            </div>
          )}

          {/* AI Analysis */}
          <div className="border-t border-stone-100 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="font-medium text-stone-800">CFO Bot Analysis</h3>
              </div>
              <Button
                onClick={onAnalyze}
                disabled={analyzing}
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : analysis ? 'Re-analyze' : 'Get analysis'}
              </Button>
            </div>

            {analysis ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${
                  analysis.recommendation === 'yes' ? 'bg-emerald-50' :
                  analysis.recommendation === 'no' ? 'bg-red-50' : 'bg-amber-50'
                }`}>
                  <p className="text-sm font-medium mb-1">
                    {analysis.recommendation === 'yes' ? '✓ Recommendation: Go for it' :
                     analysis.recommendation === 'no' ? '✗ Recommendation: Hold off' :
                     '? Recommendation: It depends'}
                  </p>
                  <p className="text-sm text-stone-600">{analysis.summary}</p>
                  <p className="text-xs text-stone-400 mt-2">Confidence: {analysis.confidence}</p>
                </div>

                {analysis.considerations && analysis.considerations.length > 0 && (
                  <div className="p-4 rounded-xl bg-stone-50">
                    <p className="text-sm font-medium text-stone-700 mb-2">Key considerations</p>
                    <ul className="space-y-1">
                      {analysis.considerations.map((item, i) => (
                        <li key={i} className="text-sm text-stone-600 flex items-start gap-2">
                          <span className="text-stone-400">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.watch_out_for && (
                  <div className="p-4 rounded-xl bg-amber-50">
                    <p className="text-sm font-medium text-amber-700 mb-1">Watch out for</p>
                    <p className="text-sm text-stone-600">{analysis.watch_out_for}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-stone-400 text-sm">
                Click "Get analysis" to have CFO Bot think through this decision with you
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-stone-100 pt-6">
            <p className="text-sm text-stone-500 mb-3">Update status</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusConfig).map(([status, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <Button
                    key={status}
                    variant={decision.status === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onUpdateStatus(status)}
                    className={`rounded-xl ${decision.status === status ? 'bg-stone-900' : ''}`}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {cfg.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}