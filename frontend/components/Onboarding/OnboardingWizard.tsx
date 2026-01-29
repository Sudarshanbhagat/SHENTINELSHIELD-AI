'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle2, AlertCircle, Copy } from 'lucide-react';

type OnboardingStep = 'organization' | 'domain' | 'admin' | 'verify' | 'complete';

interface FormData {
  organizationName: string;
  domain: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  adminPasswordConfirm: string;
}

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('organization');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dnsRecord, setDnsRecord] = useState<any>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    organizationName: '',
    domain: '',
    adminEmail: '',
    adminName: '',
    adminPassword: '',
    adminPasswordConfirm: '',
  });

  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateStep = (currentStep: OnboardingStep): boolean => {
    switch (currentStep) {
      case 'organization':
        if (formData.organizationName.length < 3) {
          setError('Organization name must be at least 3 characters');
          return false;
        }
        if (!formData.domain || !formData.domain.includes('.')) {
          setError('Please enter a valid domain');
          return false;
        }
        return true;

      case 'admin':
        if (!formData.adminEmail || !formData.adminEmail.includes('@')) {
          setError('Please enter a valid email address');
          return false;
        }
        if (!formData.adminName) {
          setError('Please enter your name');
          return false;
        }
        if (formData.adminPassword.length < 8) {
          setError('Password must be at least 8 characters');
          return false;
        }
        if (formData.adminPassword !== formData.adminPasswordConfirm) {
          setError('Passwords do not match');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleCreateOrganization = async () => {
    if (!validateStep('organization')) return;

    setIsLoading(true);
    try {
      const response = await axios.post('/api/v1/organizations', {
        name: formData.organizationName,
        domain: formData.domain,
        admin_email: formData.adminEmail,
        admin_name: formData.adminName,
        admin_password: formData.adminPassword,
      });

      setOrganizationId(response.data.id);
      setCompletedSteps([...completedSteps, 'organization']);
      setStep('domain');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!organizationId) return;

    setIsLoading(true);
    try {
      const response = await axios.post(
        `/api/v1/organizations/${organizationId}/verify-domain`,
        {},
        { params: { verification_method: 'dns' } }
      );

      setDnsRecord(response.data.dns_record);
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to verify domain');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDnsVerification = async () => {
    if (!organizationId || !dnsRecord) return;

    setIsLoading(true);
    try {
      // In production, this would poll the DNS and verify the record
      await axios.get(
        `/api/v1/organizations/${organizationId}/verify-domain/dns`,
        { params: { token: dnsRecord.value } }
      );

      setCompletedSteps([...completedSteps, 'domain']);
      setStep('complete');
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        'DNS record not found. Please ensure the TXT record is added and propagated (can take 5-10 minutes).'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Welcome to SentinelShield</h1>
          <p className="text-slate-400">Complete the setup to get started with threat detection</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-between mb-8">
          {(['organization', 'domain', 'verify', 'complete'] as OnboardingStep[]).map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                  completedSteps.includes(s)
                    ? 'bg-emerald-500 text-white'
                    : step === s
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {completedSteps.includes(s) ? <CheckCircle2 size={20} /> : i + 1}
              </div>
              {i < 3 && <div className="flex-1 h-1 mx-2 bg-slate-700 rounded"></div>}
            </div>
          ))}
        </div>

        {/* Form Cards */}
        {step === 'organization' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Create Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Organization Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Acme Corporation"
                  value={formData.organizationName}
                  onChange={(e) => handleInputChange('organizationName', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Domain
                </label>
                <Input
                  type="text"
                  placeholder="e.g., acme.com"
                  value={formData.domain}
                  onChange={(e) => handleInputChange('domain', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-slate-100"
                />
                <p className="text-xs text-slate-500 mt-1">
                  You'll verify ownership of this domain in the next step
                </p>
              </div>

              {error && (
                <div className="flex gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded">
                  <AlertCircle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-400">{error}</p>
                </div>
              )}

              <Button
                onClick={handleCreateOrganization}
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {isLoading ? 'Creating...' : 'Create Organization'}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'domain' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Verify Domain Ownership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300 text-sm">
                Add the following DNS TXT record to your domain to verify ownership:
              </p>

              {dnsRecord ? (
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Name</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm text-slate-300 bg-slate-800 p-2 rounded">
                        {dnsRecord.name}
                      </code>
                      <button
                        onClick={() => copyToClipboard(dnsRecord.name)}
                        className="p-2 hover:bg-slate-600 rounded"
                      >
                        <Copy size={16} className="text-slate-400" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Type</label>
                    <div className="text-sm text-slate-300 bg-slate-800 p-2 rounded">TXT</div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Value</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm text-slate-300 bg-slate-800 p-2 rounded break-all">
                        {dnsRecord.value}
                      </code>
                      <button
                        onClick={() => copyToClipboard(dnsRecord.value)}
                        className="p-2 hover:bg-slate-600 rounded"
                      >
                        <Copy size={16} className="text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleVerifyDomain}
                  disabled={isLoading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isLoading ? 'Generating...' : 'Generate DNS Record'}
                </Button>
              )}

              {dnsRecord && (
                <>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-xs text-slate-300">
                      After adding the DNS record, it may take 5-10 minutes to propagate. Click verify when ready.
                    </p>
                  </div>

                  {error && (
                    <div className="flex gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded">
                      <AlertCircle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-rose-400">{error}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleConfirmDnsVerification}
                    disabled={isLoading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    {isLoading ? 'Verifying...' : 'Verify DNS Record'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {step === 'complete' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <CheckCircle2 size={24} className="text-emerald-500" />
                Setup Complete!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300">
                Your organization has been created and your domain has been verified.
              </p>

              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-emerald-400">✓ Organization Created</p>
                <p className="text-sm font-semibold text-emerald-400">✓ Domain Verified</p>
                <p className="text-sm font-semibold text-emerald-400">✓ Security Policy Configured</p>
              </div>

              <p className="text-slate-400 text-sm">
                You can now log in with your admin credentials and start monitoring threats in real-time.
              </p>

              <Button
                onClick={() => router.push('/login')}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
