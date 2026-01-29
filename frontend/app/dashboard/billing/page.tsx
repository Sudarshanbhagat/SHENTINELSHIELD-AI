'use client';

import { Check, CreditCard, Star } from 'lucide-react';

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: '$0',
    description: 'For individuals and small teams getting started',
    features: [
      'Up to 3 security scans per month',
      'Basic threat detection',
      '7-day activity log retention',
      'Email support',
      'Community access',
    ],
    cta: 'Current Plan',
  },
  {
    name: 'Pro',
    price: '$99',
    description: 'For growing organizations with advanced needs',
    features: [
      'Unlimited security scans',
      'Advanced AI threat detection',
      '90-day activity log retention',
      'Priority email & chat support',
      'Custom security policies',
      'Team collaboration features',
      'API access',
      'Advanced analytics & reporting',
      'SSO & SAML integration',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
];

export default function BillingPage() {
  const handleUpgrade = (tier: string) => {
    console.log(`Upgrade to ${tier} plan initiated`);
    console.log('Ready for Stripe integration');
    alert(`Upgrade to ${tier} will redirect to Stripe payment`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-blue-500" />
          Billing & Subscription
        </h1>
        <p className="text-slate-400 mt-2">
          Choose the perfect plan for your security needs
        </p>
      </div>

      {/* Current Plan Badge */}
      <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          <span className="font-semibold">Current Plan:</span> Free - Upgrade to
          unlock advanced features
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {pricingTiers.map((tier, index) => (
          <div
            key={index}
            className={`rounded-lg overflow-hidden transition transform hover:scale-105 ${
              tier.highlighted
                ? 'bg-gradient-to-b from-blue-500/20 to-cyan-500/10 border-2 border-blue-500 shadow-2xl'
                : 'bg-slate-700/30 border border-slate-600'
            }`}
          >
            {/* Card Header */}
            <div
              className={`p-6 ${
                tier.highlighted
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
                  : 'bg-slate-800'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    {tier.highlighted && (
                      <Star className="w-6 h-6 text-yellow-400" />
                    )}
                    {tier.name}
                  </h3>
                  <p className="text-slate-200 text-sm mt-2">
                    {tier.description}
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">
                  {tier.price}
                </span>
                {tier.price !== '$0' && (
                  <span className="text-slate-300">/month</span>
                )}
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6 space-y-6">
              {/* Features List */}
              <ul className="space-y-3">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleUpgrade(tier.name)}
                disabled={tier.name === 'Free'}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  tier.name === 'Free'
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : tier.highlighted
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {tier.cta}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-8 space-y-6">
        <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>

        <div className="space-y-4">
          <details className="group cursor-pointer">
            <summary className="flex items-center justify-between py-3 text-white font-semibold hover:text-blue-400">
              Can I change plans anytime?
              <span className="group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="text-slate-400 text-sm mt-2 pb-4">
              Yes! You can upgrade or downgrade your plan at any time. Changes
              take effect immediately.
            </p>
          </details>

          <details className="group cursor-pointer">
            <summary className="flex items-center justify-between py-3 text-white font-semibold hover:text-blue-400">
              What payment methods do you accept?
              <span className="group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="text-slate-400 text-sm mt-2 pb-4">
              We accept all major credit cards, PayPal, and wire transfers. All
              payments are processed securely through Stripe.
            </p>
          </details>

          <details className="group cursor-pointer">
            <summary className="flex items-center justify-between py-3 text-white font-semibold hover:text-blue-400">
              Is there a free trial for Pro?
              <span className="group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="text-slate-400 text-sm mt-2 pb-4">
              Yes! Get 14 days free on the Pro plan with full access to all
              features. No credit card required.
            </p>
          </details>

          <details className="group cursor-pointer">
            <summary className="flex items-center justify-between py-3 text-white font-semibold hover:text-blue-400">
              What happens if I downgrade?
              <span className="group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="text-slate-400 text-sm mt-2 pb-4">
              Your data remains safe. You'll lose access to Pro features but
              retain your activity history for 7 days.
            </p>
          </details>
        </div>
      </div>

      {/* Contact Sales */}
      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/50 rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold text-white mb-4">Need a custom plan?</h3>
        <p className="text-slate-300 mb-6">
          Contact our sales team for enterprise pricing and dedicated support
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition">
          Contact Sales
        </button>
      </div>
    </div>
  );
}
