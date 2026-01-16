import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Camera, 
  TrendingUp, 
  HelpCircle, 
  MessageCircle, 
  Settings, 
  Menu, 
  X,
  ChevronDown,
  Building2,
  Plus
} from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { name: 'Snapshot', page: 'Snapshot', icon: Camera },
  { name: 'Forecast', page: 'Forecast', icon: TrendingUp },
  { name: 'Decisions', page: 'Decisions', icon: HelpCircle },
  { name: 'Ask CFO Bot', page: 'AskCFOBot', icon: MessageCircle },
  { name: 'Settings', page: 'Settings', icon: Settings },
];

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  
  // Hide layout chrome on Home page
  if (currentPageName === 'Home') {
    return <>{children}</>;
  }

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: businesses = [] } = useQuery({
    queryKey: ['businesses', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.Business.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (businesses.length > 0 && !selectedBusinessId) {
      const stored = localStorage.getItem('selectedBusinessId');
      if (stored && businesses.find(b => b.id === stored)) {
        setSelectedBusinessId(stored);
      } else {
        setSelectedBusinessId(businesses[0].id);
        localStorage.setItem('selectedBusinessId', businesses[0].id);
      }
    }
  }, [businesses, selectedBusinessId]);

  const handleSelectBusiness = (id) => {
    setSelectedBusinessId(id);
    localStorage.setItem('selectedBusinessId', id);
    window.dispatchEvent(new CustomEvent('businessChanged', { detail: id }));
  };

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);

  return (
    <div className="min-h-screen bg-stone-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        * { font-family: 'Inter', sans-serif; }
        :root {
          --color-primary: #3d3d3d;
          --color-secondary: #6b6b6b;
          --color-accent: #2563eb;
          --color-accent-soft: #dbeafe;
          --color-success: #059669;
          --color-warning: #d97706;
          --color-surface: #fafaf9;
          --color-border: #e7e5e4;
        }
      `}</style>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-stone-200">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696a9c36c6b94fecaba3b1c3/eb5fb9eeb_cfo-bot-logo-1.png" 
                alt="CFO Bot" 
                className="w-8 h-8"
              />
              <span className="text-lg font-semibold text-stone-800">CFO Bot</span>
            </div>
          </div>

          {/* Business Selector */}
          {businesses.length > 0 && (
            <div className="px-4 py-4 border-b border-stone-100">
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-4 h-4 text-stone-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-stone-700 truncate">
                      {selectedBusiness?.name || 'Select business'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {businesses.map(business => (
                    <DropdownMenuItem 
                      key={business.id}
                      onClick={() => handleSelectBusiness(business.id)}
                      className={cn(
                        "cursor-pointer",
                        business.id === selectedBusinessId && "bg-stone-100"
                      )}
                    >
                      <Building2 className="w-4 h-4 mr-2 text-stone-500" />
                      {business.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Settings') + '?tab=businesses'} className="cursor-pointer">
                      <Plus className="w-4 h-4 mr-2 text-stone-500" />
                      Add business
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map(item => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-stone-900 text-white" 
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-stone-100">
            <p className="text-xs text-stone-400 text-center">
              Your calm financial partner
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-50 bg-white border-b border-stone-200">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">C</span>
            </div>
            <span className="font-semibold text-stone-800">CFO Bot</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-stone-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-14 inset-x-0 bg-white border-b border-stone-200 shadow-lg">
            {businesses.length > 0 && (
              <div className="px-4 py-3 border-b border-stone-100">
                <select
                  value={selectedBusinessId || ''}
                  onChange={(e) => handleSelectBusiness(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-stone-50 text-sm"
                >
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
            <nav className="py-2">
              {navItems.map(item => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm",
                    currentPageName === item.page 
                      ? "bg-stone-100 text-stone-900 font-medium" 
                      : "text-stone-600"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}