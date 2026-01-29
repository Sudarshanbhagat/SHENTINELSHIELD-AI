'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp } from 'lucide-react';

interface RetrainingStatus {
  status: 'ready' | 'collecting';
  unprocessed_feedback: number;
  threshold: number;
  progress_percent: number;
  next_retrain_in_samples: number;
  estimated_improvement: string;
  last_retraining?: {
    completed_at: string;
    status: string;
    metrics?: {
      accuracy: number;
      precision: number;
      recall: number;
      f1_score: number;
    };
  };
}

export default function FeedbackWidget() {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const { data: retrainingStatus, isLoading } = useQuery<RetrainingStatus>({
    queryKey: ['retraining-status'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/threats/feedback/retraining-status');
      return response.data;
    },
    refetchInterval: 60000, // Refresh every 60 seconds
  });

  // Animate progress bar
  useEffect(() => {
    if (retrainingStatus) {
      const interval = setInterval(() => {
        setAnimatedProgress((prev) => {
          const target = retrainingStatus.progress_percent;
          if (prev < target) {
            return Math.min(prev + 1, target);
          }
          return prev;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [retrainingStatus?.progress_percent]);

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="animate-pulse text-slate-400">Loading retraining status...</div>
        </CardContent>
      </Card>
    );
  }

  const isReady = retrainingStatus?.status === 'ready';

  return (
    <Card className={`border-slate-700 ${isReady ? 'bg-slate-800 border-emerald-500/30' : 'bg-slate-800'}`}>
      <CardHeader className={`border-b ${isReady ? 'border-emerald-500/30' : 'border-slate-700'}`}>
        <CardTitle className="text-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={20} className={isReady ? 'text-emerald-400' : 'text-slate-400'} />
            AI Model Feedback Loop
          </div>
          {isReady && <div className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">READY</div>}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Progress Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-100">Feedback Collection</span>
            <span className="text-sm text-slate-400">
              {retrainingStatus?.unprocessed_feedback || 0} / {retrainingStatus?.threshold || 100}
            </span>
          </div>
          <Progress
            value={animatedProgress}
            className="h-2 bg-slate-700"
            indicatorClassName={isReady ? 'bg-emerald-500' : 'bg-blue-500'}
          />
          <p className="text-xs text-slate-500 mt-2">
            {retrainingStatus?.next_retrain_in_samples === 0
              ? 'Ready for retraining'
              : `${retrainingStatus?.next_retrain_in_samples} samples until retraining triggers`}
          </p>
        </div>

        {/* Estimated Improvement */}
        <div className="bg-slate-700/50 border border-slate-600 rounded p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-slate-400" />
              <span className="text-xs text-slate-400">Estimated Model Improvement</span>
            </div>
            <span className="text-sm font-bold text-emerald-400">{retrainingStatus?.estimated_improvement}</span>
          </div>
        </div>

        {/* Last Retraining */}
        {retrainingStatus?.last_retraining && (
          <div className="border-t border-slate-700 pt-4">
            <h4 className="text-xs font-semibold text-slate-100 mb-2">Last Retraining</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className="text-slate-100 font-medium capitalize">{retrainingStatus.last_retraining.status}</span>
              </div>
              {retrainingStatus.last_retraining.metrics && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Accuracy</span>
                    <span className="text-slate-100 font-medium">
                      {(retrainingStatus.last_retraining.metrics.accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">F1 Score</span>
                    <span className="text-slate-100 font-medium">
                      {retrainingStatus.last_retraining.metrics.f1_score.toFixed(3)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
          <p className="text-xs text-slate-300">
            The model improves continuously as analysts flag false positives. Each correction helps reduce false alarms.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
