import Link from 'next/link';
import { Shield, AlertTriangle, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold text-white">SentinelShield AI</h1>
          </div>
          <div className="space-x-4">
            <Link href="/login" className="text-slate-300 hover:text-white transition">
              Login
            </Link>
            <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white">
            Real-Time Threat Detection
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Detect and prevent credential theft and Shadow AI usage through behavioral AI and Zero Trust principles.
          </p>
          <div className="flex justify-center space-x-4 pt-8">
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition"
            >
              Get Started
            </Link>
            <Link
              href="/docs"
              className="border border-slate-500 hover:border-slate-300 text-white px-8 py-3 rounded-lg font-semibold transition"
            >
              View Docs
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-16">
          <div className="border border-slate-700 rounded-lg p-8 bg-slate-800/50 hover:border-slate-600 transition">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Real-Time Detection</h3>
            <p className="text-slate-300">
              Instantly identify anomalous behavior and security threats with Isolation Forest AI.
            </p>
          </div>

          <div className="border border-slate-700 rounded-lg p-8 bg-slate-800/50 hover:border-slate-600 transition">
            <TrendingUp className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Human-in-the-Loop</h3>
            <p className="text-slate-300">
              Analysts correct AI classifications to continuously improve model accuracy.
            </p>
          </div>

          <div className="border border-slate-700 rounded-lg p-8 bg-slate-800/50 hover:border-slate-600 transition">
            <Shield className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Multi-Tenant</h3>
            <p className="text-slate-300">
              Enterprise-grade isolation with Row-Level Security and Zero Trust architecture.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 border border-slate-700 rounded-lg p-12 bg-slate-800/50 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Ready to enhance your security?</h3>
          <p className="text-slate-300 mb-8">
            Start with a free trial today. No credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 backdrop-blur mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-slate-400 text-sm">
          <p>&copy; 2024 SentinelShield AI. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
