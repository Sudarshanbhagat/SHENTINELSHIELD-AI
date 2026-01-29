'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Power, Lock } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth';

interface SessionRevocationRequest {
  user_id: string;
  reason: string;
}

export default function ActionCenter() {
  const [showKillSwitch, setShowKillSwitch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmRevocation, setConfirmRevocation] = useState(false);
  const [revocationReason, setRevocationReason] = useState('');
  const { user } = useAuthStore();

  const handleKillSwitch = async (userId: string) => {
    if (!revocationReason) {
      alert('Please provide a reason for session revocation');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`/api/v1/threats/admin/revoke-session/${userId}`, null, {
        params: { reason: revocationReason },
        headers: { 'X-Organization-ID': user?.organization_id },
      });

      if (response.status === 200) {
        alert(`Session revoked. ${response.data.connections_closed} connection(s) closed.`);
        setConfirmRevocation(false);
        setRevocationReason('');
        setShowKillSwitch(false);
      }
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.detail || 'Failed to revoke session'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700 h-[500px] flex flex-col">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-slate-100 flex items-center gap-2">
          <Lock size={20} className="text-slate-400" />
          Action Center
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-4 space-y-4 flex flex-col">
        {/* Kill Switch Button */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-100">Emergency Actions</h3>

          {!showKillSwitch ? (
            <Button
              onClick={() => setShowKillSwitch(true)}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2"
            >
              <Power size={18} />
              Revoke User Session
            </Button>
          ) : (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-rose-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-300">
                  This will immediately disconnect all active sessions for the selected user.
                </p>
              </div>

              {!confirmRevocation ? (
                <Button
                  onClick={() => setConfirmRevocation(true)}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white"
                  size="sm"
                >
                  Proceed to Revocation
                </Button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    placeholder="Reason for revocation (e.g., 'Suspicious activity detected')"
                    value={revocationReason}
                    onChange={(e) => setRevocationReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleKillSwitch('target_user_id')}
                      disabled={isLoading || !revocationReason}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                      size="sm"
                    >
                      {isLoading ? 'Processing...' : 'Confirm Revocation'}
                    </Button>
                    <Button
                      onClick={() => {
                        setConfirmRevocation(false);
                        setShowKillSwitch(false);
                        setRevocationReason('');
                      }}
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex-1 border-t border-slate-700 pt-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-100">Quick Stats</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
              <span className="text-xs text-slate-400">Active Sessions</span>
              <span className="text-sm font-bold text-emerald-400">—</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
              <span className="text-xs text-slate-400">API Keys Active</span>
              <span className="text-sm font-bold text-slate-300">—</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
              <span className="text-xs text-slate-400">Recent Alerts</span>
              <span className="text-sm font-bold text-rose-400">—</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-slate-700/50 border border-slate-600 rounded p-3">
          <p className="text-xs text-slate-400">
            Use this panel to respond to active threats. Changes are logged in the audit trail.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
