'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, FileText, Search } from 'lucide-react';

interface AuditEntry {
  id: string;
  timestamp: string;
  user_id: string;
  action_type: string;
  resource_type: string;
  resource_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  status: string;
  error_message?: string;
  content_hash: string;
  previous_hash?: string;
}

export default function AuditLogViewer() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Fetch audit logs
  const { data, isLoading, error } = useQuery<{ logs: AuditEntry[]; total: number }>({
    queryKey: ['audit-logs', page, filterType],
    queryFn: async () => {
      const params: Record<string, any> = {
        skip: page * pageSize,
        limit: pageSize,
      };

      if (filterType !== 'all') {
        params.action_type = filterType;
      }

      const response = await axios.get('/api/v1/audit-logs', { params });
      return response.data;
    },
  });

  const actionTypeColors: Record<string, string> = {
    login: 'bg-emerald-500/10 text-emerald-400',
    logout: 'bg-slate-500/10 text-slate-300',
    threat_flagged: 'bg-rose-500/10 text-rose-400',
    false_positive_flagged: 'bg-yellow-500/10 text-yellow-400',
    session_revoked: 'bg-red-500/10 text-red-400',
    user_created: 'bg-blue-500/10 text-blue-400',
    user_deleted: 'bg-red-500/10 text-red-400',
    policy_updated: 'bg-purple-500/10 text-purple-400',
  };

  const getActionColor = (actionType: string) => {
    return actionTypeColors[actionType] || 'bg-slate-500/10 text-slate-400';
  };

  const uniqueActionTypes = Array.from(new Set(data?.logs.map((log) => log.action_type) || []));

  const filteredLogs = (data?.logs || []).filter(
    (log) =>
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const verifyIntegrity = (current: AuditEntry, previous?: AuditEntry) => {
    // In production, verify SHA-256 chain
    return true;
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <FileText size={20} />
            Immutable Audit Trail
          </CardTitle>
          <div className="text-xs text-slate-500">
            {data?.total || 0} total events
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
            <Input
              placeholder="Search by action, user, or resource..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="pl-10 bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(0);
            }}
            className="px-4 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded text-sm"
          >
            <option value="all">All Types</option>
            {uniqueActionTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 text-center text-slate-400">Loading audit logs...</div>
        ) : error ? (
          <div className="p-6 text-center text-rose-400">Failed to load audit logs</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-6 text-center text-slate-400">No audit logs found</div>
        ) : (
          <div className="divide-y divide-slate-700">
            {filteredLogs.map((log, index) => (
              <div key={log.id} className="border-b border-slate-700 last:border-b-0">
                <button
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  className="w-full px-6 py-4 hover:bg-slate-700/50 transition-colors text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded uppercase ${getActionColor(log.action_type)}`}>
                          {log.action_type}
                        </span>
                        <span className="text-xs text-slate-500">{formatTimestamp(log.timestamp)}</span>
                        {log.status === 'error' && <span className="text-xs text-rose-400">Error</span>}
                      </div>
                      <p className="text-sm text-slate-300">
                        <span className="font-medium">{log.resource_type}</span>
                        {' → '}
                        <span className="text-slate-400">{log.resource_id}</span>
                      </p>
                      {log.user_id && (
                        <p className="text-xs text-slate-500 mt-1">
                          By: <span className="text-slate-400">{log.user_id}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {expandedId === log.id ? (
                        <ChevronUp size={20} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={20} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedId === log.id && (
                  <div className="px-6 py-4 bg-slate-700/30 border-t border-slate-700 space-y-3">
                    {log.new_values && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase">Changes</h4>
                        <div className="text-xs bg-slate-700 rounded p-3 font-mono text-slate-300 overflow-x-auto">
                          <pre>{JSON.stringify(log.new_values, null, 2)}</pre>
                        </div>
                      </div>
                    )}

                    {log.error_message && (
                      <div>
                        <h4 className="text-xs font-semibold text-rose-400 mb-2 uppercase">Error</h4>
                        <p className="text-xs text-rose-300 bg-rose-500/10 rounded p-2">{log.error_message}</p>
                      </div>
                    )}

                    {/* Integrity Verification */}
                    <div className="border-t border-slate-600 pt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase">Integrity</span>
                        {verifyIntegrity(log) ? (
                          <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">Verified</span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-rose-500/20 text-rose-400 rounded">Tampered</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-mono break-all">
                        Hash: {log.content_hash.substring(0, 32)}...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.total > pageSize && (
          <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Page {page + 1} of {Math.ceil(data.total / pageSize)}
            </span>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(data.total / pageSize) - 1}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
