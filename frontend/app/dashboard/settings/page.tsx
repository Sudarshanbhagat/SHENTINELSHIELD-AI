'use client';

import { useEffect, useState } from 'react';
import { Loader, CheckCircle, AlertCircle, Settings } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  organization_name: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    organizationName: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
      setFormData({
        fullName: data.full_name || '',
        organizationName: data.organization_name || '',
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Unable to load profile. Backend may not be running.');
      // Demo data
      setProfile({
        id: '1',
        email: 'user@example.com',
        full_name: 'John Doe',
        organization_name: 'Acme Corp',
      });
      setFormData({
        fullName: 'John Doe',
        organizationName: 'Acme Corp',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          organization_name: formData.organizationName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setProfile(data);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-500" />
          Profile Settings
        </h1>
        <p className="text-slate-400 mt-2">Manage your account and organization details</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 text-blue-500 animate-spin mr-2" />
          <span className="text-slate-400">Loading profile...</span>
        </div>
      ) : (
        <div className="max-w-2xl space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 flex items-gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-green-200 text-sm ml-2">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-200 text-sm ml-2">{error}</p>
            </div>
          )}

          {/* User Email (Read-only) */}
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Address (Read-only)
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-2">
              Contact support to change your email address
            </p>
          </div>

          {/* Settings Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                disabled={saving}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
              />
            </div>

            {/* Organization Name */}
            <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
              <label
                htmlFor="organizationName"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Organization Name
              </label>
              <input
                id="organizationName"
                name="organizationName"
                type="text"
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="Acme Corporation"
                disabled={saving}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          {/* Additional Settings */}
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Security</h3>
            <button className="text-blue-400 hover:text-blue-300 font-semibold text-sm">
              Change Password
            </button>
            <hr className="my-4 border-slate-600" />
            <button className="text-red-400 hover:text-red-300 font-semibold text-sm">
              Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
