'use client';

import { useEffect, useState } from 'react';
import { Loader, Plus, Activity, AlertTriangle, TrendingUp } from 'lucide-react';

interface Scan {
  id: string;
  name: string;
  status: 'completed' | 'in_progress' | 'failed';
  threats_detected: number;
  scan_date: string;
}

export default function DashboardPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/scans', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch scans');
      }

      const data = await response.json();
      setScans(data.scans || []);
    } catch (err) {
      console.error('Error fetching scans:', err);
      setError('Unable to load security scans. Backend may not be running.');
      setScans([
        {
          id: '1',
          name: 'Full System Scan',
          status: 'completed',
          threats_detected: 2,
          scan_date: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Quick Scan',
          status: 'in_progress',
          threats_detected: 0,
          scan_date: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartScan = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/scans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `Scan ${new Date().toLocaleTimeString()}`,
          scan_type: 'full',
        }),
      });

      if (response.ok) {
        fetchScans();
      }
    } catch (err) {
      console.error('Error starting scan:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Dashboard</h1>
          <p className="text-slate-400 mt-2">Command center for threat detection</p>
        </div>
        <button
          onClick={handleStartScan}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          Start New Scan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Scans</p>
              <p className="text-3xl font-bold text-white mt-2">{scans.length}</p>
            </div>
            <Activity className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Threats Detected</p>
              <p className="text-3xl font-bold text-red-400 mt-2">
                {scans.reduce((sum, s) => sum + s.threats_detected, 0)}
              </p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-500 opacity-20" />
          </div>
        </div>

        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Completed</p>
              <p className="text-3xl font-bold text-green-400 mt-2">
                {scans.filter((s) => s.status === 'completed').length}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Security Scans Table */}
      <div className="bg-slate-700/30 border border-slate-600 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-600">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Recent Security Scans
          </h2>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="ml-2 text-slate-400">Loading scans...</span>
          </div>
        ) : scans.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p>No scans yet. Start your first scan to begin monitoring.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Scan Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Threats
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600">
                {scans.map((scan) => (
                  <tr
                    key={scan.id}
                    className="hover:bg-slate-700/20 transition"
                  >
                    <td className="px-6 py-4 text-white font-medium">
                      {scan.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          scan.status === 'completed'
                            ? 'bg-green-500/20 text-green-400'
                            : scan.status === 'in_progress'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {scan.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold ${
                          scan.threats_detected > 0
                            ? 'text-red-400'
                            : 'text-green-400'
                        }`}
                      >
                        {scan.threats_detected}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(scan.scan_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
