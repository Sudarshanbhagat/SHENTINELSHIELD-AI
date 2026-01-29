'use client';

import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, AlertTriangle, AlertCircle, Shield } from 'lucide-react';

interface ThreatStats {
  period_days: number;
  total_threats: number;
  severity_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  threats_blocked: number;
  false_positives: number;
  block_rate: string;
  false_positive_rate: string;
}

interface ChartData {
  time: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export default function RiskOverview() {
  const [chartData, setChartData] = useState<ChartData[]>([]);

  // Fetch threat statistics
  const { data: stats, isLoading } = useQuery<ThreatStats>({
    queryKey: ['threat-stats'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/threats/stats/summary?days=7');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Generate mock chart data based on stats
  useEffect(() => {
    if (stats) {
      const data: ChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        data.push({
          time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          critical: Math.floor(stats.severity_distribution.critical / 7),
          high: Math.floor(stats.severity_distribution.high / 7),
          medium: Math.floor(stats.severity_distribution.medium / 7),
          low: Math.floor(stats.severity_distribution.low / 7),
        });
      }
      setChartData(data);
    }
  }, [stats]);

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="animate-pulse text-slate-400">Loading threat overview...</div>
        </CardContent>
      </Card>
    );
  }

  const severityStats = [
    { label: 'Critical', value: stats?.severity_distribution.critical || 0, icon: AlertCircle, color: 'text-red-500' },
    { label: 'High', value: stats?.severity_distribution.high || 0, icon: AlertTriangle, color: 'text-orange-500' },
    { label: 'Medium', value: stats?.severity_distribution.medium || 0, icon: TrendingUp, color: 'text-yellow-500' },
    { label: 'Low', value: stats?.severity_distribution.low || 0, icon: Shield, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {severityStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase">{stat.label}</span>
                  <Icon className={`${stat.color}`} size={16} />
                </div>
                <div className="text-2xl font-bold text-slate-100">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">threats</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Chart */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-slate-100">Threat Severity Trend (7 Days)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="url(#colorCritical)" name="Critical" />
              <Area type="monotone" dataKey="high" stackId="1" stroke="#f97316" fill="url(#colorHigh)" name="High" />
              <Area type="monotone" dataKey="medium" stackId="1" stroke="#eab308" fill="url(#colorMedium)" name="Medium" />
              <Area type="monotone" dataKey="low" stackId="1" stroke="#3b82f6" fill="url(#colorLow)" name="Low" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="text-sm text-slate-400 mb-2">Total Threats</div>
            <div className="text-3xl font-bold text-slate-100">{stats?.total_threats || 0}</div>
            <div className="text-xs text-slate-500 mt-2">Last 7 days</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="text-sm text-slate-400 mb-2">Blocked</div>
            <div className="text-3xl font-bold text-emerald-400">{stats?.threats_blocked || 0}</div>
            <div className="text-xs text-slate-500 mt-2">{stats?.block_rate || '0%'} block rate</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="text-sm text-slate-400 mb-2">False Positives</div>
            <div className="text-3xl font-bold text-yellow-400">{stats?.false_positives || 0}</div>
            <div className="text-xs text-slate-500 mt-2">{stats?.false_positive_rate || '0%'} FP rate</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
