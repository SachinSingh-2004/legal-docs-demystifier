import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { FileText, MessageSquare, AlertTriangle, Layers, Trash2, Calendar, HardDrive, ArrowRight, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import toast from '../utils/toast';

const DashboardPage = () => {
  const [documents, setDocuments] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/analyze/history');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch dashboard history');
      
      setDocuments(data.documents || []);
      setAnalyses(data.analyses || []);
    } catch (err) {
      toast.error(err.message || 'Error loading dashboard history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document? This will remove all associated analyses and vector embeddings permanently.')) {
      return;
    }

    try {
      const res = await apiFetch(`/api/analyze/document/${docId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete document');

      toast.success('Document deleted successfully');
      // Refresh list
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getRiskColor = (level) => {
    const l = (level || '').toLowerCase();
    if (l === 'high') return 'risk-high';
    if (l === 'medium') return 'risk-medium';
    return 'risk-low';
  };

  const getFormattedSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="font-display font-bold text-[var(--text-primary)]">Your Dashboard</h2>
          <p className="text-xs text-[var(--text-secondary)]">Manage your uploads, view analyses, and run simulations</p>
        </div>
        <Link to="/upload" className="btn btn-primary flex items-center gap-2">
          <HardDrive size={16} /> Upload New Document
        </Link>
      </div>

      {loading ? (
        <div className="grid-2 mt-8">
          <div className="card p-6">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4 animate-pulse"></div>
            <div className="space-y-3">
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="card p-6">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4 animate-pulse"></div>
            <div className="space-y-3">
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {/* Left panel: Uploaded Documents list */}
          <div className="card p-6">
            <h3 className="font-display font-semibold mb-4 text-[var(--text-primary)] flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              Uploaded Documents ({documents.length})
            </h3>

            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
                <p className="font-semibold text-sm text-[var(--text-secondary)]">No uploaded files yet</p>
                <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">Upload property agreements, rental contracts, etc. to get started.</p>
                <Link to="/upload" className="btn btn-secondary btn-sm">Upload File</Link>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[480px]">
                {documents.map((doc) => (
                  <div key={doc._id} className="p-4 bg-[var(--surface-2)] rounded-lg border border-[var(--border)] flex justify-between items-center hover:shadow-sm transition">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs capitalize text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-0.5 rounded">
                          {doc.documentType || 'General'}
                        </span>
                        <h4 className="font-semibold text-sm truncate text-[var(--text-primary)]" title={doc.fileName}>
                          {doc.fileName}
                        </h4>
                      </div>
                      <div className="flex gap-4 text-xs text-[var(--text-muted)] mt-1.5 font-medium">
                        <span className="flex items-center gap-1"><HardDrive size={12} /> {getFormattedSize(doc.fileSize)}</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {new Date(doc.uploadDate).toLocaleDateString()}
                        </span>
                        <span>
                          Status:{' '}
                          <span className={`font-bold capitalize ${doc.status === 'ready' ? 'text-green-600' : doc.status === 'processing' ? 'text-blue-500 animate-pulse' : 'text-red-500'}`}>
                            {doc.status}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.status === 'ready' && (
                        <>
                          <Link
                            to={`/chat/${doc._id}`}
                            className="btn btn-secondary btn-icon btn-sm text-blue-600 hover:bg-blue-50"
                            title="Interactive Chat"
                          >
                            <MessageSquare size={16} />
                          </Link>
                          <Link
                            to={`/whatif/${doc._id}`}
                            className="btn btn-secondary btn-icon btn-sm text-purple-600 hover:bg-purple-50"
                            title="What-If Simulation"
                          >
                            <Layers size={16} />
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteDoc(doc._id)}
                        className="btn btn-secondary btn-icon btn-sm text-red-600 hover:bg-red-50"
                        title="Delete Document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right panel: Analysis Reports History */}
          <div className="card p-6">
            <h3 className="font-display font-semibold mb-4 text-[var(--text-primary)] flex items-center gap-2">
              <ShieldAlert size={20} className="text-red-600" />
              Analysis History ({analyses.length})
            </h3>

            {analyses.length === 0 ? (
              <div className="text-center py-12">
                <ShieldAlert size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
                <p className="font-semibold text-sm text-[var(--text-secondary)]">No reports available</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Reports generate automatically when uploads finish processing.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[480px]">
                {analyses.map((an) => {
                  const hasDoc = !!an.documentId;
                  const name = hasDoc ? an.documentId.fileName : 'Deleted Document';
                  const date = new Date(an.createdAt).toLocaleDateString();
                  return (
                    <div key={an._id} className="p-4 bg-[var(--surface-2)] rounded-lg border border-[var(--border)] flex justify-between items-center hover:shadow-sm transition">
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {an.analysis && (an.analysis.atsScore !== null || (an.analysis.documentType || '').toLowerCase().includes('resume')) ? (
                            <>
                              <span className={`risk-badge font-bold text-[10px] ${an.analysis.atsScore >= 80 ? 'bg-green-100 text-green-800' : an.analysis.atsScore >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                ATS: {an.analysis.atsScore || 0}% Match
                              </span>
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded uppercase">
                                CV Profile
                              </span>
                            </>
                          ) : (
                            <>
                              <span className={`risk-badge ${getRiskColor(an.riskLevel)}`}>
                                {an.riskLevel} Risk
                              </span>
                              <span className="text-xs font-bold text-[var(--text-muted)] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded capitalize">
                                {an.persona} View
                              </span>
                            </>
                          )}
                          <span className="text-xs font-bold text-[var(--text-muted)] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded uppercase">
                            {an.language}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm mt-1.5 truncate text-[var(--text-primary)]" title={name}>
                          {name}
                        </h4>
                        {an.analysis && an.analysis.extractedSkills?.length > 0 && (
                          <p className="text-[10px] text-[var(--text-secondary)] font-semibold mt-1 truncate">
                            Skills: {an.analysis.extractedSkills.slice(0, 4).join(', ')}
                            {an.analysis.extractedSkills.length > 4 && '...'}
                          </p>
                        )}
                        <p className="text-xs text-[var(--text-muted)] mt-1 font-medium flex items-center gap-1">
                          <Calendar size={12} /> Analyzed on {date} • Confidence: {(an.confidenceScore * 100).toFixed(0)}%
                        </p>
                      </div>

                      {hasDoc ? (
                        <Link
                          to={`/analysis/${an._id}`}
                          className="btn btn-primary btn-sm flex items-center gap-1"
                        >
                          View <ArrowRight size={14} />
                        </Link>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] italic">Expired</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
