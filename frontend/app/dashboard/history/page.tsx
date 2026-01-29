'use client';

import { useEffect, useState } from 'react';
import { Loader, Search, Download, AlertTriangle } from 'lucide-react';

interface AnalysisResult {
  id: string;
  scan_name: string;
  result_type: 'threat' | 'clean' | 'suspicious';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  ai_confidence: number;
  analyzed_at: string;
}

export default function HistoryPage() {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'threat' | 'clean' | 'suspicious'>('all');

  useEffect(() => {
    fetchResults();
  }, []);

  useEffect(() => {
    filterResults();
  }, [searchTerm, filterType, results]);

  const fetchResults = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/analysis', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analysis results');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Unable to load analysis history. Backend may not be running.');
      // Demo data
      setResults([
        {
          id: '1',
          scan_name: 'Full System Scan',
          result_type: 'threat',
          severity: 'high',
          description: 'Suspicious file detected in system32',
          ai_confidence: 0.95,
          analyzed_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '2',
          scan_name: 'Network Scan',
          result_type: 'clean',
          severity: 'low',
          description: 'No threats detected',
          ai_confidence: 0.98,
          analyzed_at: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: '3',
          scan_name: 'File Integrity Check',
          result_type: 'suspicious',
          severity: 'medium',
          description: 'Unusual file access patterns detected',
          ai_confidence: 0.78,
          analyzed_at: new Date(Date.now() - 259200000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterResults = () => {
    let filtered = results;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((r) => r.result_type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.scan_name.toLowerCase().includes(term) ||
          r.description.toLowerCase().includes(term)
      );
    }

    setFilteredResults(filtered);
  };

  const handleExport = () => {
    const csv = [
      ['Scan Name', 'Type', 'Severity', 'Description', 'AI Confidence', 'Date'],
      ...filteredResults.map((r) => [
        r.scan_name,
        r.result_type,
        r.severity,
        r.description,
        `${(r.ai_confidence * 100).toFixed(0)}%`,
        new Date(r.analyzed_at).toLocaleString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500 bg-red-500/10';
      case 'high':
        return 'text-orange-500 bg-orange-500/10';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'text-green-500 bg-green-500/10';
      default:
        return 'text-slate-500 bg-slate-500/10';
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case 'threat':
        return 'border-red-500/50 bg-red-500/5';
      case 'suspicious':
        return 'border-yellow-500/50 bg-yellow-500/5';
      case 'clean':
        return 'border-green-500/50 bg-green-500/5';
      default:
        return 'border-slate-600 bg-slate-700/30';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-blue-500" />
          Analysis History
        </h1>
        <p className="text-slate-400 mt-2">
          View all past AI analysis results and threat detections
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by scan name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Filter Dropdown */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        >
          <option value="all">All Results</option>
          <option value="threat">Threats Only</option>
          <option value="suspicious">Suspicious Only</option>
          <option value="clean">Clean Only</option>
        </select>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={filteredResults.length === 0}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Results Count */}
      <div className="text-slate-400 text-sm">
        Showing {filteredResults.length} of {results.length} results
      </div>

      {/* Results List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 text-blue-500 animate-spin mr-2" />
          <span className="text-slate-400">Loading analysis history...</span>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-12 text-center">
          <p className="text-slate-400">
            {results.length === 0
              ? 'No analysis results yet. Run a scan to see results here.'
              : 'No results match your search filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResults.map((result) => (
            <div
              key={result.id}
              className={`border rounded-lg p-6 transition hover:bg-slate-700/50 ${getResultColor(result.result_type)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {result.scan_name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(result.severity)}`}
                    >
                      {result.severity.toUpperCase()}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        result.result_type === 'threat'
                          ? 'bg-red-500/20 text-red-400'
                          : result.result_type === 'suspicious'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {result.result_type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">
                    {result.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      AI Confidence:{' '}
                      <span className="text-slate-300 font-semibold">
                        {(result.ai_confidence * 100).toFixed(0)}%
                      </span>
                    </span>
                    <span>
                      {new Date(result.analyzed_at).toLocaleDateString()} at{' '}
                      {new Date(result.analyzed_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
