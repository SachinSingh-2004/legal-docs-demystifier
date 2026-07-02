import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { Layers, ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Calendar, DollarSign } from 'lucide-react';
import toast from '../utils/toast';

const WhatIfPage = () => {
  const { documentId } = useParams();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [modifications, setModifications] = useState([
    { field: 'payment amount', original: '', modified: '' }
  ]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const commonFields = [
    'payment amount', 'penalty rate', 'interest rate', 'notice period',
    'contract duration', 'late fee', 'security deposit', 'termination period',
    'service charges', 'renewal period'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const docRes = await apiFetch('/api/analyze/history');
        const docData = await docRes.json();
        if (docRes.ok) {
          const doc = (docData.documents || []).find(d => d._id === documentId);
          setDocument(doc);
        }

        const histRes = await apiFetch(`/api/whatif/history/${documentId}`);
        const histData = await histRes.json();
        if (histRes.ok) {
          setHistory(histData.simulations || []);
        }
      } catch (err) {
        toast.error('Failed to load simulation details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [documentId]);

  const addModification = () => {
    setModifications(prev => [...prev, { field: '', original: '', modified: '' }]);
  };

  const removeModification = (idx) => {
    setModifications(prev => prev.filter((_, i) => i !== idx));
  };

  const updateMod = (idx, field, value) => {
    setModifications(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleRunSimulation = async () => {
    const validMods = modifications.filter(m => m.field && m.original && m.modified);
    if (validMods.length === 0) {
      toast.error('Please fill at least one complete modification (field, original value, and modified value)');
      return;
    }

    setSimulating(true);
    setResult(null);

    try {
      const res = await apiFetch('/api/whatif', {
        method: 'POST',
        body: JSON.stringify({ documentId, modifications: validMods })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Simulation failed');

      setResult(data.result);
      toast.success('Simulation completed!');

      // Refresh history
      const histRes = await apiFetch(`/api/whatif/history/${documentId}`);
      const histData = await histRes.json();
      if (histRes.ok) setHistory(histData.simulations || []);
    } catch (err) {
      toast.error(err.message || 'Error running simulation');
    } finally {
      setSimulating(false);
    }
  };

  const getRiskBadge = (level) => {
    const l = (level || '').toLowerCase();
    if (l === 'high') return 'risk-high';
    if (l === 'medium') return 'risk-medium';
    return 'risk-low';
  };

  const getRiskChangeIcon = (change) => {
    const c = (change || '').toLowerCase();
    if (c === 'increased') return <TrendingUp size={16} className="text-red-500" />;
    if (c === 'decreased') return <TrendingDown size={16} className="text-green-500" />;
    return <Minus size={16} className="text-slate-400" />;
  };

  const getRiskChangeText = (change) => {
    const c = (change || '').toLowerCase();
    if (c === 'increased') return 'text-red-600 font-bold';
    if (c === 'decreased') return 'text-green-600 font-bold';
    return 'text-slate-500 font-semibold';
  };

  if (loading) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="spinner mb-4"></div>
        <p className="font-semibold text-sm animate-pulse">Loading simulation environment...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link to="/dashboard" className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--primary)] font-semibold transition mb-1">
            <ArrowLeft size={12} /> Back to Dashboard
          </Link>
          <h2 className="font-display font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Layers size={24} className="text-purple-600" />
            What-If Scenario Simulator
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {document ? `Simulating: ${document.fileName}` : 'Contract simulation environment'}
          </p>
        </div>
      </div>

      <div className="grid-2 gap-8">
        {/* Left: Input Panel */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-display font-semibold text-sm mb-4 text-[var(--text-primary)]">Configure Modifications</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-5 leading-relaxed">
              Define what contract clauses you want to modify. Specify the original value and your proposed change. The AI will analyze the risk impact.
            </p>

            <div className="space-y-4">
              {modifications.map((mod, idx) => (
                <div key={idx} className="p-4 bg-[var(--surface-2)] rounded-lg border border-[var(--border)]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Modification #{idx + 1}</span>
                    {modifications.length > 1 && (
                      <button
                        onClick={() => removeModification(idx)}
                        className="btn btn-danger btn-icon btn-sm h-7 w-7"
                        title="Remove"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="form-label text-[10px]">Clause / Field</label>
                      <select
                        className="form-input form-select text-xs py-2"
                        value={mod.field}
                        onChange={e => updateMod(idx, 'field', e.target.value)}
                      >
                        <option value="">Select or type below...</option>
                        {commonFields.map(f => (
                          <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="form-input text-xs py-2 mt-1.5"
                        placeholder="Or type custom field name..."
                        value={mod.field}
                        onChange={e => updateMod(idx, 'field', e.target.value)}
                      />
                    </div>

                    <div className="grid-2 gap-3">
                      <div>
                        <label className="form-label text-[10px]">Original Value</label>
                        <div className="relative">
                          <input
                            type="text"
                            className="form-input text-xs py-2 pl-6"
                            placeholder="e.g. 5,00,000"
                            value={mod.original}
                            onChange={e => updateMod(idx, 'original', e.target.value)}
                          />
                          <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        </div>
                      </div>
                      <div>
                        <label className="form-label text-[10px]">Modified Value</label>
                        <div className="relative">
                          <input
                            type="text"
                            className="form-input text-xs py-2 pl-6"
                            placeholder="e.g. 8,00,000"
                            value={mod.modified}
                            onChange={e => updateMod(idx, 'modified', e.target.value)}
                          />
                          <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addModification}
              className="btn btn-secondary btn-sm w-full mt-4 flex items-center justify-center gap-1.5 border-dashed"
            >
              <Plus size={14} /> Add Another Modification
            </button>

            <button
              onClick={handleRunSimulation}
              disabled={simulating}
              className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2"
            >
              {simulating ? (
                <>
                  <span className="spinner w-4 h-4 border-2 border-white border-t-transparent"></span>
                  Analyzing Risk Impact...
                </>
              ) : (
                <>
                  <Layers size={16} /> Run Simulation
                </>
              )}
            </button>
          </div>

          {/* Simulation History */}
          {history.length > 0 && (
            <div className="card p-6">
              <h3 className="font-display font-semibold text-sm mb-4 text-[var(--text-primary)]">
                Simulation History ({history.length})
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {history.map((sim) => (
                  <div key={sim._id} className="p-3 bg-[var(--surface-2)] rounded border border-[var(--border)] text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`risk-badge text-[9px] ${getRiskBadge(sim.result?.overallAfter)}`}>
                        After: {sim.result?.overallAfter} Risk
                      </span>
                      <span className="text-[var(--text-muted)] font-medium">
                        {new Date(sim.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)] truncate">{sim.result?.summary}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {sim.modifications.slice(0, 2).map((m, i) => (
                        <span key={i} className="text-[9px] bg-slate-200 dark:bg-slate-700 text-[var(--text-muted)] px-1.5 py-0.5 rounded font-medium">
                          {m.field}: {m.original} → {m.modified}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Result Panel */}
        <div>
          {!result ? (
            <div className="card p-8 h-full flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="feature-icon-wrap fi-purple text-white mx-auto mb-4 animate-float">
                <Layers size={24} />
              </div>
              <h4 className="font-bold text-sm text-[var(--text-primary)] mb-2">No Simulation Run Yet</h4>
              <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
                Configure one or more contract modifications on the left and click "Run Simulation" to see how changes affect risk.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Risk Summary Card */}
              <div className="card p-6 bg-slate-900 text-white border-none">
                <h3 className="font-display font-semibold text-sm mb-4 text-slate-300 uppercase tracking-wider">Simulation Result</h3>
                <p className="text-sm font-semibold leading-relaxed mb-5 text-white">{result.summary}</p>

                <div className="grid-2 gap-4">
                  <div className="p-4 bg-slate-800 rounded-xl text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Risk Before</p>
                    <span className={`risk-badge text-xs ${getRiskBadge(result.overallBefore)}`}>
                      {result.overallBefore}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-800 rounded-xl text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Risk After</p>
                    <span className={`risk-badge text-xs ${getRiskBadge(result.overallAfter)}`}>
                      {result.overallAfter}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mt-4 p-3 bg-slate-800 rounded-lg">
                  {getRiskChangeIcon(result.riskChange)}
                  <span className={`text-sm capitalize ${getRiskChangeText(result.riskChange)}`}>
                    Risk has {result.riskChange}
                  </span>
                </div>
              </div>

              {/* Recommendation Card */}
              <div className={`card p-5 border-l-4 ${
                result.recommendation === 'Reject' ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20' :
                result.recommendation === 'Accept' ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' :
                'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.recommendation === 'Reject' ? <AlertTriangle size={18} className="text-red-600" /> :
                   result.recommendation === 'Accept' ? <CheckCircle size={18} className="text-green-600" /> :
                   <AlertTriangle size={18} className="text-yellow-600" />}
                  <span className="font-bold text-sm">Recommendation: {result.recommendation}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{result.reasoning}</p>
              </div>

              {/* Category Risk Changes */}
              {result.categories && result.categories.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-display font-semibold text-sm mb-4 text-[var(--text-primary)]">Risk Category Changes</h3>
                  <div className="space-y-4">
                    {result.categories.map((cat, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                            {getRiskChangeIcon(cat.change)}
                            {cat.name}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-slate-400">{cat.scoreBefore}/10</span>
                            <span className="text-slate-300">→</span>
                            <span className={cat.scoreAfter > cat.scoreBefore ? 'text-red-500 font-bold' : cat.scoreAfter < cat.scoreBefore ? 'text-green-500 font-bold' : 'text-slate-400'}>{cat.scoreAfter}/10</span>
                          </div>
                        </div>
                        <div className="grid-2 gap-2 mb-1">
                          <div>
                            <div className="text-[9px] text-slate-400 mb-0.5">Before</div>
                            <div className="progress-wrap h-1.5">
                              <div className="progress-bar bg-slate-400" style={{ width: `${cat.scoreBefore * 10}%` }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-400 mb-0.5">After</div>
                            <div className="progress-wrap h-1.5">
                              <div className={`progress-bar ${cat.scoreAfter > cat.scoreBefore ? 'bg-red-500' : cat.scoreAfter < cat.scoreBefore ? 'bg-green-500' : ''}`} style={{ width: `${cat.scoreAfter * 10}%` }}></div>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)]">{cat.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Implications */}
              {result.implications && result.implications.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-display font-semibold text-sm mb-4 text-[var(--text-primary)]">Legal Implications</h3>
                  <ul className="space-y-2">
                    {result.implications.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></span>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatIfPage;
