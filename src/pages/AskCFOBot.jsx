import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/shared/Card';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

export default function AskCFOBot() {
  const [businessId, setBusinessId] = useState(localStorage.getItem('selectedBusinessId'));
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = (e) => {
      setBusinessId(e.detail);
      setSelectedConversation(null);
    };
    window.addEventListener('businessChanged', handler);
    return () => window.removeEventListener('businessChanged', handler);
  }, []);

  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations', businessId],
    queryFn: () => base44.entities.Conversation.filter({ business_id: businessId }, '-updated_date'),
    enabled: !!businessId,
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ['snapshots', businessId],
    queryFn: () => base44.entities.FinancialSnapshot.filter({ business_id: businessId }, '-period'),
    enabled: !!businessId,
  });

  const { data: statements = [] } = useQuery({
    queryKey: ['statements', businessId],
    queryFn: () => base44.entities.FinancialStatement.filter({ business_id: businessId }, '-period'),
    enabled: !!businessId,
  });

  const { data: lineItems = [] } = useQuery({
    queryKey: ['lineItems', businessId],
    queryFn: () => base44.entities.StatementLineItem.filter({ business_id: businessId }, '-created_date', 50),
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

  const createConversation = useMutation({
    mutationFn: async (firstMessage) => {
      const conv = await base44.entities.Conversation.create({
        business_id: businessId,
        title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : ''),
        messages: [{
          role: 'user',
          content: firstMessage,
          timestamp: new Date().toISOString(),
        }],
      });
      return conv;
    },
    onSuccess: (conv) => {
      queryClient.invalidateQueries(['conversations', businessId]);
      setSelectedConversation(conv);
      processMessage(conv, conv.messages[0].content);
    },
  });

  const updateConversation = useMutation({
    mutationFn: ({ id, messages }) => base44.entities.Conversation.update(id, { messages }),
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations', businessId]);
    },
  });

  const deleteConversation = useMutation({
    mutationFn: (id) => base44.entities.Conversation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations', businessId]);
      setSelectedConversation(null);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  const formatCurrency = (amount) => {
    if (!amount) return 'Not available';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getFinancialContext = () => {
    if (!latestSnapshot) return 'No financial data available yet.';
    
    const netMonthly = (latestSnapshot.revenue || 0) - (latestSnapshot.expenses || 0);
    const runwayMonths = netMonthly < 0 
      ? Math.floor(latestSnapshot.cash_balance / Math.abs(netMonthly))
      : null;
    
    let context = `Current financial snapshot for ${business?.name || 'the business'}:
- Cash on hand: ${formatCurrency(latestSnapshot.cash_balance)}
- Monthly revenue: ${formatCurrency(latestSnapshot.revenue)}
- Monthly expenses: ${formatCurrency(latestSnapshot.expenses)}
- Monthly profit/loss: ${formatCurrency(netMonthly)} ${netMonthly >= 0 ? '(profitable)' : '(burning cash)'}`;

    if (runwayMonths !== null) {
      context += `\n- Runway: ${runwayMonths} months at current burn rate`;
    }

    context += `\n- Accounts receivable: ${formatCurrency(latestSnapshot.accounts_receivable || 0)}
- Accounts payable: ${formatCurrency(latestSnapshot.accounts_payable || 0)}`;

    if (previousSnapshot) {
      const revChange = latestSnapshot.revenue && previousSnapshot.revenue 
        ? ((latestSnapshot.revenue - previousSnapshot.revenue) / previousSnapshot.revenue * 100).toFixed(0)
        : null;
      const expChange = latestSnapshot.expenses && previousSnapshot.expenses
        ? ((latestSnapshot.expenses - previousSnapshot.expenses) / previousSnapshot.expenses * 100).toFixed(0)
        : null;
      
      if (revChange) context += `\n- Revenue vs last month: ${revChange > 0 ? '+' : ''}${revChange}%`;
      if (expChange) context += `\n- Expenses vs last month: ${expChange > 0 ? '+' : ''}${expChange}%`;
    }

    if (lineItems.length > 0) {
      const recentCategories = {};
      lineItems.slice(0, 20).forEach(item => {
        if (!recentCategories[item.category]) {
          recentCategories[item.category] = 0;
        }
        recentCategories[item.category] += item.amount || 0;
      });
      
      const topCategories = Object.entries(recentCategories)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, 5);
      
      if (topCategories.length > 0) {
        context += `\n\nRecent expense breakdown:`;
        topCategories.forEach(([cat, amt]) => {
          context += `\n- ${cat}: ${formatCurrency(Math.abs(amt))}`;
        });
      }
    }

    return context;
  };

  const processMessage = async (conversation, userMessage) => {
    setSending(true);
    
    const messagesHistory = conversation.messages.slice(-10).map(m => 
      `${m.role === 'user' ? 'User' : 'CFO Bot'}: ${m.content}`
    ).join('\n\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are CFO Bot, a calm, conservative, and supportive virtual CFO for small business founders. 
You speak in plain language, you're reassuring but realistic, and you always ground your advice in the user's actual numbers.

CORE PRINCIPLES:
1. Always reference specific numbers from their data when available
2. Clearly state any assumptions you're making
3. Offer options and trade-offs instead of absolute answers
4. Ask clarifying questions when data is missing or ambiguous
5. Be conservative in projections and optimistic about capabilities

${getFinancialContext()}

Conversation so far:
${messagesHistory}

User's latest message: ${userMessage}

RESPONSE GUIDELINES:
- Start with the specific numbers relevant to their question
- Explain what those numbers mean in plain terms
- If making projections, state your assumptions clearly (e.g., "Assuming revenue stays flat...")
- Present 2-3 options when possible, with trade-offs for each
- If you need more info, ask specific questions about what would help
- Keep paragraphs short (2-3 sentences max)
- Use concrete examples when explaining concepts
- Be conservative with recommendations but encouraging in tone

If critical data is missing, say something like: "I don't see [specific data] in your snapshot yet. If you have that, it would help me give you a more accurate answer."`,
    });

    const updatedMessages = [
      ...conversation.messages,
      {
        role: 'assistant',
        content: result,
        timestamp: new Date().toISOString(),
      }
    ];

    await updateConversation.mutateAsync({
      id: conversation.id,
      messages: updatedMessages,
    });

    setSelectedConversation(prev => ({
      ...prev,
      messages: updatedMessages,
    }));

    setSending(false);
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    
    const userMessage = message.trim();
    setMessage('');

    if (!selectedConversation) {
      createConversation.mutate(userMessage);
    } else {
      const updatedMessages = [
        ...selectedConversation.messages,
        {
          role: 'user',
          content: userMessage,
          timestamp: new Date().toISOString(),
        }
      ];

      setSelectedConversation(prev => ({
        ...prev,
        messages: updatedMessages,
      }));

      await updateConversation.mutateAsync({
        id: selectedConversation.id,
        messages: updatedMessages,
      });

      processMessage({ ...selectedConversation, messages: updatedMessages }, userMessage);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "How healthy is my runway?",
    "Should I be worried about my burn rate?",
    "What should I focus on this month?",
    "How do my numbers compare to last month?",
  ];

  if (!businessId) {
    return (
      <div className="min-h-screen p-6 lg:p-10">
        <EmptyState
          icon={MessageCircle}
          title="No business selected"
          description="Create a business in Settings to start chatting with CFO Bot."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar - Conversation List */}
      <div className={`lg:w-80 border-r border-stone-200 bg-white ${selectedConversation ? 'hidden lg:block' : ''}`}>
        <div className="p-4 border-b border-stone-100">
          <Button
            onClick={() => setSelectedConversation(null)}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            New conversation
          </Button>
        </div>
        
        <div className="overflow-y-auto h-[calc(100vh-130px)] lg:h-[calc(100vh-80px)]">
          {loadingConversations ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 bg-stone-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-stone-400">No conversations yet</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-3 rounded-xl text-left transition-colors ${
                    selectedConversation?.id === conv.id 
                      ? 'bg-stone-100' 
                      : 'hover:bg-stone-50'
                  }`}
                >
                  <p className="text-sm font-medium text-stone-700 truncate">{conv.title}</p>
                  <p className="text-xs text-stone-400 mt-1">
                    {format(new Date(conv.updated_date), 'MMM d, h:mm a')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedConversation && 'hidden lg:flex'}`}>
        {/* Mobile Back Button */}
        {selectedConversation && (
          <div className="lg:hidden p-4 border-b border-stone-100 flex items-center gap-3">
            <button
              onClick={() => setSelectedConversation(null)}
              className="p-2 hover:bg-stone-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-medium truncate">{selectedConversation.title}</span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedConversation ? (
            <div className="max-w-2xl mx-auto">
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-7 h-7 text-stone-400" />
                </div>
                <h2 className="text-2xl font-semibold text-stone-800 mb-2">
                  Ask CFO Bot
                </h2>
                <p className="text-stone-500 max-w-md mx-auto">
                  Get clear, calm answers about your finances. Ask anything from runway questions 
                  to whether you should make a big purchase.
                </p>
              </div>

              <div className="mt-8">
                <p className="text-sm text-stone-500 mb-3">Try asking:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setMessage(q);
                      }}
                      className="p-3 text-left text-sm rounded-xl border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-colors text-stone-600"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {selectedConversation.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-stone-900 text-white'
                        : 'bg-white border border-stone-200'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : (
                      <div className="text-sm prose prose-sm prose-stone max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-stone-200 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2 text-stone-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-stone-100 bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask CFO Bot anything about your finances..."
                className="flex-1 min-h-[50px] max-h-[150px] rounded-xl border-stone-200 resize-none"
                rows={1}
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-4 self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {selectedConversation && (
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => {
                    if (confirm('Delete this conversation?')) {
                      deleteConversation.mutate(selectedConversation.id);
                    }
                  }}
                  className="text-xs text-stone-400 hover:text-red-500 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}