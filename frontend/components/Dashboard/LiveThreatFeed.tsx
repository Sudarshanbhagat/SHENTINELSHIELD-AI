'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThreatSocket } from '@/hooks/useSocket';
import { AlertCircle, TrendingUp, Shield, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ThreatAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip: string;
  action: string;
  resource: string;
  timestamp: string;
  risk_score: number;
  is_blocked: boolean;
}

export default function LiveThreatFeed() {
  const { threat, isNew } = useThreatSocket();
  const [threats, setThreats] = useState<ThreatAlert[]>([]);

  useEffect(() => {
    if (isNew && threat) {
      const newThreat: ThreatAlert = {
        id: threat.id,
        severity: threat.severity,
        source_ip: threat.source_ip,
        action: threat.action,
        resource: threat.resource,
        timestamp: threat.timestamp,
        risk_score: threat.risk_score,
        is_blocked: threat.is_blocked,
      };

      setThreats((prev) => [newThreat, ...prev].slice(0, 20)); // Keep last 20
    }
  }, [threat, isNew]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500 bg-red-500/10';
      case 'high':
        return 'text-orange-500 bg-orange-500/10';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'text-blue-500 bg-blue-500/10';
      default:
        return 'text-slate-500 bg-slate-500/10';
    }
  };

  const getSeverityBorder = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/30';
      case 'high':
        return 'border-orange-500/30';
      case 'medium':
        return 'border-yellow-500/30';
      case 'low':
        return 'border-blue-500/30';
      default:
        return 'border-slate-500/30';
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700 h-[500px] flex flex-col">
      <CardHeader className="border-b border-slate-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <AlertCircle className="text-rose-500" size={20} />
            Live Threat Feed
          </CardTitle>
          <div className="text-xs text-slate-400">
            {threats.length > 0 && <span className="text-emerald-400">{threats.length} active</span>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-2">
        {threats.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <Shield size={40} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No threats detected</p>
              <p className="text-xs text-slate-500 mt-1">Monitoring in progress...</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {threats.map((threat, index) => (
              <motion.div
                key={threat.id}
                initial={{ opacity: 0, x: -20, y: -10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className={`p-3 rounded-lg border ${getSeverityBorder(threat.severity)} bg-slate-700/50 hover:bg-slate-700 transition-colors`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${getSeverityColor(threat.severity)}`}>
                        {threat.severity}
                      </span>
                      {threat.is_blocked && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Blocked</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-200 font-medium truncate">{threat.action}</p>
                    <p className="text-xs text-slate-400 truncate">{threat.source_ip} → {threat.resource}</p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <div className="text-lg font-bold text-orange-400">{threat.risk_score.toFixed(2)}</div>
                    <div className="text-xs text-slate-400">Risk Score</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}
