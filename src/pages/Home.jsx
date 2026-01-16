import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { ArrowRight, Check } from 'lucide-react';

export default function Home() {
  const handleSignup = (provider) => {
    const signupUrl = `${window.location.origin}/signup?provider=${provider}`;
    window.location.href = signupUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696a9c36c6b94fecaba3b1c3/eb5fb9eeb_cfo-bot-logo-1.png" 
              alt="CFO Bot" 
              className="h-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => base44.auth.redirectToLogin()}
              className="text-stone-700"
            >
              Sign in
            </Button>
            <Button 
              onClick={() => base44.auth.redirectToLogin()}
              className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl"
            >
              Get started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-stone-900 tracking-tight leading-tight">
            Finance without fear.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
            CFO Bot helps you understand your numbers, see what's ahead, 
            and make better financial decisions — without the anxiety or guesswork.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => base44.auth.redirectToLogin()}
              className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-8 py-6 text-lg"
            >
              Get your Snapshot
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <a href="#how-it-works">
              <Button variant="outline" className="rounded-xl px-8 py-6 text-lg border-stone-200 hover:bg-stone-50">
                See how it works
              </Button>
            </a>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <p className="text-sm text-stone-500">Sign up with:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSignup('google')}
                className="rounded-xl"
              >
                Google
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSignup('facebook')}
                className="rounded-xl"
              >
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSignup('linkedin')}
                className="rounded-xl"
              >
                LinkedIn
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSignup('microsoft')}
                className="rounded-xl"
              >
                Microsoft
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="px-6 py-20 bg-stone-100">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm uppercase tracking-wider text-stone-500 mb-4">The reality</p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900 leading-tight mb-6">
            Every founder has been here
          </h2>
          <div className="space-y-4 text-lg text-stone-700 leading-relaxed">
            <p>
              It's Wednesday night. You're looking at your bank balance wondering if you can 
              afford that hire. Or if you should take that client. Or how many months you really have left.
            </p>
            <p>
              Your spreadsheet tells you numbers. But it doesn't tell you what they mean. 
              It doesn't tell you if you're okay.
            </p>
            <p className="font-medium text-stone-900">
              And calling your accountant feels like admitting you don't know what you're doing.
            </p>
          </div>
        </div>
      </section>

      {/* What CFO Bot Does */}
      <section id="how-it-works" className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm uppercase tracking-wider text-stone-500 mb-4 text-center">What we do</p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900 text-center mb-16">
            Think of us as your financial clarity partner
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-stone-200">
              <div className="w-12 h-12 rounded-xl bg-stone-900 flex items-center justify-center mb-5">
                <span className="text-white text-lg font-semibold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">
                See where you stand
              </h3>
              <p className="text-stone-600 leading-relaxed">
                Your current cash, runway, and burn rate — explained in plain language. 
                No jargon, no confusion.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-stone-200">
              <div className="w-12 h-12 rounded-xl bg-stone-900 flex items-center justify-center mb-5">
                <span className="text-white text-lg font-semibold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">
                Understand what's coming
              </h3>
              <p className="text-stone-600 leading-relaxed">
                Simple forecasts that show you where your numbers are heading. 
                Adjust assumptions, see the impact.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-stone-200">
              <div className="w-12 h-12 rounded-xl bg-stone-900 flex items-center justify-center mb-5">
                <span className="text-white text-lg font-semibold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">
                Make better decisions
              </h3>
              <p className="text-stone-600 leading-relaxed">
                When you're facing a big choice, talk it through with someone who knows your numbers. 
                Get perspective, not pressure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Snapshot */}
      <section className="px-6 py-20 bg-stone-900 text-white">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm uppercase tracking-wider text-stone-400 mb-4">The core</p>
          <h2 className="text-3xl sm:text-4xl font-semibold mb-6 leading-tight">
            Your Snapshot is your financial truth
          </h2>
          <p className="text-lg text-stone-300 leading-relaxed mb-8">
            It's not a dashboard. It's not a report. It's a clear, honest picture of where you stand 
            right now. Cash in the bank. How long it lasts. What's coming in. What's going out.
          </p>
          <p className="text-lg text-stone-300 leading-relaxed">
            Everything you need to know, nothing you don't. Updated whenever your numbers change. 
            Always available when doubt creeps in at 11pm.
          </p>
        </div>
      </section>

      {/* How Founders Use It */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm uppercase tracking-wider text-stone-500 mb-4 text-center">In practice</p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900 text-center mb-12">
            How founders use CFO Bot
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center flex-shrink-0 mt-1">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-stone-900 mb-1">Monday morning check-in</h3>
                <p className="text-stone-600">
                  Update your numbers from last week. See your runway. Know if anything needs attention.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center flex-shrink-0 mt-1">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-stone-900 mb-1">Before big decisions</h3>
                <p className="text-stone-600">
                  Thinking about hiring? New equipment? Get a clear analysis based on your actual situation.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center flex-shrink-0 mt-1">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-stone-900 mb-1">When doubt hits</h3>
                <p className="text-stone-600">
                  Ask anything. "Am I okay?" "Should I be worried?" Get honest, grounded answers.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center flex-shrink-0 mt-1">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-stone-900 mb-1">End of month</h3>
                <p className="text-stone-600">
                  Close the books, forecast next month, adjust your plan. Five minutes instead of five hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm uppercase tracking-wider text-stone-500 mb-4 text-center">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900 text-center mb-4">
            Simple, honest pricing
          </h2>
          <p className="text-center text-stone-600 mb-12 max-w-2xl mx-auto">
            No hidden fees. No per-user charges. Just straightforward monthly pricing.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Starter */}
            <div className="bg-white rounded-2xl p-8 border border-stone-200">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-stone-900 mb-2">Starter</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-semibold text-stone-900">$29</span>
                  <span className="text-stone-500">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-stone-600">
                  <Check className="w-4 h-4 text-stone-900 flex-shrink-0 mt-0.5" />
                  1 business
                </li>
                <li className="flex items-start gap-2 text-sm text-stone-600">
                  <Check className="w-4 h-4 text-stone-900 flex-shrink-0 mt-0.5" />
                  Financial snapshots
                </li>
                <li className="flex items-start gap-2 text-sm text-stone-600">
                  <Check className="w-4 h-4 text-stone-900 flex-shrink-0 mt-0.5" />
                  Basic forecasting
                </li>
                <li className="flex items-start gap-2 text-sm text-stone-600">
                  <Check className="w-4 h-4 text-stone-900 flex-shrink-0 mt-0.5" />
                  Email support
                </li>
              </ul>
              <Button variant="outline" className="w-full rounded-xl border-stone-200 hover:bg-stone-50">
                Get started
              </Button>
            </div>

            {/* Professional */}
            <div className="bg-stone-900 text-white rounded-2xl p-8 border-2 border-stone-900 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-stone-900 text-white text-xs font-medium px-3 py-1 rounded-full border border-stone-700">
                  Most popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Professional</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-semibold">$79</span>
                  <span className="text-stone-300">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-stone-100">
                  <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  3 businesses
                </li>
                <li className="flex items-start gap-2 text-sm text-stone-100">
                  <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  Everything in Starter
                </li>
                <li className="flex items-start gap-2 text-sm text-stone-100">
                  <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  Advanced forecasting
                </li>
                <li className="flex items-start gap-2 text-sm text-stone-100">
                  <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  Decision analysis
                </li>
                <li className="flex items-start gap-2 text-sm text-stone-100">
                  <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  Unlimited CFO Bot conversations
                </li>
                <li className="flex items-start gap-2 text-sm text-stone-100">
                  <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  Priority support
                </li>
              </ul>
              <Button className="w-full rounded-xl bg-white text-stone-900 hover:bg-stone-100">
                Get started
              </Button>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-2xl p-8 border border-stone-200">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-stone-900 mb-2">Enterprise</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-semibold text-stone-900">$199</span>
                  <span className="text-stone-500">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-stone-600">
                  <Check className="w-4 h-4 text-stone-900 flex-shrink-0 mt-0.5" />
                  Unlimited businesses
                </li>
                <li className="flex items-start gap-2 text-sm text-stone-600">
                  <Check className="w-4 h-4 text-stone-900 flex-shrink-0 mt-0.5" />
                  Everything in Professional
                </li>
                <li className="flex items-start gap-2 text-sm text-stone-600">
                  <Check className="w-4 h-4 text-stone-900 flex-shrink-0 mt-0.5" />
                  Multi-user access
                </li>
                <li className="flex items-start gap-2 text-sm text-stone-600">
                  <Check className="w-4 h-4 text-stone-900 flex-shrink-0 mt-0.5" />
                  Custom integrations
                </li>
                <li className="flex items-start gap-2 text-sm text-stone-600">
                  <Check className="w-4 h-4 text-stone-900 flex-shrink-0 mt-0.5" />
                  Dedicated support
                </li>
              </ul>
              <Button variant="outline" className="w-full rounded-xl border-stone-200 hover:bg-stone-50">
                Get started
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900 mb-6 leading-tight">
            Get clarity on your finances tonight
          </h2>
          <p className="text-lg text-stone-600 mb-10">
            No credit card required. Start with your first Snapshot and see where you stand.
          </p>
          <Button 
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-8 py-6 text-lg"
          >
            Get your Snapshot
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-sm text-stone-400 mt-6">
            Takes 2 minutes to get started
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-stone-100">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696a9c36c6b94fecaba3b1c3/eb5fb9eeb_cfo-bot-logo-1.png" 
              alt="CFO Bot" 
              className="h-8"
            />
          </div>
          <p className="text-sm text-stone-400">
            Your calm financial partner
          </p>
        </div>
      </footer>
    </div>
  );
}