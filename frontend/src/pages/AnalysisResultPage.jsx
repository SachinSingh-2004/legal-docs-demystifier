import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { FileText, ShieldAlert, AlertTriangle, Calendar, DollarSign, HelpCircle, Layers, MessageSquare, ArrowLeft, Languages, ClipboardList, CheckCircle, Info } from 'lucide-react';
import toast from '../utils/toast';

const AnalysisResultPage = () => {
  const { analysisId } = useParams();

  const [analysisRecord, setAnalysisRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [translating, setTranslating] = useState(false);
  const [currentAnalysisJSON, setCurrentAnalysisJSON] = useState(null);
  const [currentLang, setCurrentLang] = useState('en');
  const [checkedItems, setCheckedItems] = useState({});

  const toggleCheck = (idx) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/analyze/${analysisId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch analysis details');
        
        setAnalysisRecord(data.analysis);
        setCurrentAnalysisJSON(data.analysis.analysis);
        setCurrentLang(data.analysis.language || 'en');
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisData();
  }, [analysisId]);

  const handleTranslate = async (langCode) => {
    if (langCode === currentLang) return;
    
    setTranslating(true);
    try {
      const res = await apiFetch(`/api/translation/${analysisId}`, {
        method: 'POST',
        body: JSON.stringify({ language: langCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Translation failed');

      setCurrentAnalysisJSON(data.translation);
      setCurrentLang(langCode);
      toast.success(`Translated to ${langCode === 'hi' ? 'Hindi' : 'English'}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTranslating(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="spinner mb-4"></div>
        <p className="font-semibold text-sm animate-pulse">Retrieving contract audit metrics...</p>
      </div>
    );
  }

  if (!analysisRecord) {
    return (
      <div className="container py-12 text-center">
        <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
        <h3 className="font-bold text-lg">Report Not Found</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1">This analysis could not be found or you do not have permission to view it.</p>
        <Link to="/dashboard" className="btn btn-primary btn-sm mt-4">Back to Dashboard</Link>
      </div>
    );
  }

  const { documentId } = analysisRecord;
  const analysis = currentAnalysisJSON || {};
  const isResume = (analysis.documentType || '').toLowerCase().includes('resume') || (analysis.documentType || '').toLowerCase().includes('cv') || analysis.atsScore !== null;

  const getRiskBadge = (level) => {
    const l = (level || '').toLowerCase();
    if (l === 'high') return 'risk-high';
    if (l === 'medium') return 'risk-medium';
    return 'risk-low';
  };

  const getClauseBorder = (importance) => {
    const imp = (importance || '').toLowerCase();
    if (imp === 'high') return 'clause-legal';
    if (imp === 'medium') return 'clause-financial';
    return 'clause-operational';
  };

  return (
    <div className="container py-8 animate-fade-in">
      {/* Header breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Link to="/dashboard" className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] font-semibold transition">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        {/* Translation Trigger & Tools */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTranslate('en')}
            className={`btn btn-sm ${currentLang === 'en' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-1`}
            disabled={translating}
          >
            <Languages size={12} /> EN
          </button>
          <button
            onClick={() => handleTranslate('hi')}
            className={`btn btn-sm ${currentLang === 'hi' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-1`}
            disabled={translating}
          >
            <Languages size={12} /> हिन्दी (HI)
          </button>
          
          <Link to={`/chat/${documentId._id}`} className="btn btn-secondary btn-sm flex items-center gap-1.5 text-blue-600 hover:bg-blue-50">
            <MessageSquare size={14} /> AI Document Chat
          </Link>
          <Link to={`/whatif/${documentId._id}`} className="btn btn-secondary btn-sm flex items-center gap-1.5 text-purple-600 hover:bg-purple-50">
            <Layers size={14} /> What-If Scenario
          </Link>
        </div>
      </div>

      {/* Metadata Card */}
      <div className="card p-6 mb-8 bg-slate-900 text-white border-none flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`risk-badge ${getRiskBadge(analysis.riskLevel)}`}>
              {analysis.riskLevel} Risk
            </span>
            <span className="text-xs bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded capitalize">
              {analysisRecord.persona} view
            </span>
            <span className="text-xs bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded uppercase">
              {currentLang}
            </span>
          </div>
          <h2 className="font-display font-bold mt-2 text-white">{documentId.fileName}</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Category: {analysis.documentType || 'General Contract'} • Confidence Score: {((analysis.confidenceScore || 0.9) * 100).toFixed(0)}%
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-lg w-full md:w-auto">
          {isResume && analysis.atsScore !== null && (
            <>
              <div className="text-center flex-1 md:flex-none">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">ATS Score</p>
                <p className={`font-bold text-sm mt-0.5 ${analysis.atsScore >= 80 ? 'text-green-400' : analysis.atsScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{analysis.atsScore}%</p>
              </div>
              <div className="w-px h-8 bg-slate-700"></div>
            </>
          )}
          <div className="text-center flex-1 md:flex-none">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Analysis Status</p>
            <p className="font-bold text-sm text-green-400 mt-0.5">READY</p>
          </div>
          <div className="w-px h-8 bg-slate-700"></div>
          <div className="text-center flex-1 md:flex-none">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Confidence</p>
            <p className="font-bold text-sm text-blue-400 mt-0.5">{((analysis.confidenceScore || 0.9) * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Tab controls */}
      <div className="tabs-nav mb-6">
        <button onClick={() => setActiveTab('summary')} className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}>Overview Summary</button>
        {isResume ? (
          <>
            <button onClick={() => setActiveTab('skills')} className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}>Extracted Skills</button>
            <button onClick={() => setActiveTab('ats')} className={`tab-btn ${activeTab === 'ats' ? 'active' : ''}`}>ATS Score & Feedback</button>
            <button onClick={() => setActiveTab('contact')} className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`}>Candidate Contacts</button>
          </>
        ) : (
          <>
            <button onClick={() => setActiveTab('clauses')} className={`tab-btn ${activeTab === 'clauses' ? 'active' : ''}`}>Key Clauses</button>
            <button onClick={() => setActiveTab('flags')} className={`tab-btn ${activeTab === 'flags' ? 'active' : ''}`}>Red Flags & Risks</button>
            <button onClick={() => setActiveTab('obligations')} className={`tab-btn ${activeTab === 'obligations' ? 'active' : ''}`}>Obligations & Dates</button>
            <button onClick={() => setActiveTab('compliance')} className={`tab-btn ${activeTab === 'compliance' ? 'active' : ''}`}>Missing Clauses</button>
            <button onClick={() => setActiveTab('checklist')} className={`tab-btn ${activeTab === 'checklist' ? 'active' : ''}`}>Action Checklist & Caveats</button>
          </>
        )}
      </div>

      {/* Tab Content 1: Overview Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="grid-2">
            <div className="card p-6">
              <h3 className="font-display font-semibold text-sm mb-4 text-[var(--text-primary)] flex items-center gap-2">
                <ClipboardList size={18} className="text-blue-500" />
                Executive Summary
              </h3>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-line font-medium">
                {analysis.executiveSummary || 'No summary available.'}
              </p>
            </div>
            
            <div className="card p-6">
              <h3 className="font-display font-semibold text-sm mb-4 text-[var(--text-primary)] flex items-center gap-2">
                <Info size={18} className="text-teal-500" />
                Plain Language Breakdown
              </h3>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-line font-medium">
                {analysis.plainLanguageSummary || 'No breakdown details generated.'}
              </p>
            </div>
          </div>

          {/* Recommendations Card */}
          <div className="card p-6">
            <h3 className="font-display font-semibold text-sm mb-4 text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle size={18} className="text-green-500" />
              Recommendations & Action Items
            </h3>
            {analysis.recommendations && analysis.recommendations.length > 0 ? (
              <div className="grid-2 gap-4">
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} className="p-4 bg-[var(--surface-2)] rounded border-l-4 border-green-500 text-xs">
                    <p className="font-bold text-[var(--text-primary)] mb-1">{rec.action}</p>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{rec.rationale}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">No recommendations identified.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 2: Key Clauses */}
      {activeTab === 'clauses' && (
        <div className="card p-6">
          <h3 className="font-display font-semibold text-sm mb-6 text-[var(--text-primary)]">Contractual Key Clauses</h3>
          {analysis.importantClauses && analysis.importantClauses.length > 0 ? (
            <div className="space-y-4">
              {analysis.importantClauses.map((cls, i) => (
                <div key={i} className={`clause-card ${getClauseBorder(cls.importance)}`}>
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">{cls.title || 'Clause'}</h4>
                    <span className="text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                      {cls.importance} importance
                    </span>
                  </div>
                  {cls.excerpt && cls.excerpt !== 'Information Not Found In Document' && (
                    <blockquote className="my-3 p-3.5 bg-[var(--surface-2)] rounded border-l-4 border-[var(--border-strong)] font-mono text-[11.5px] text-[var(--text-primary)] font-semibold italic leading-relaxed">
                      "{cls.excerpt}"
                    </blockquote>
                  )}
                  <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
                    <span className="font-semibold text-[var(--text-primary)]">Explanation:</span> {cls.explanation}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)] italic">No clause metrics found.</p>
          )}
        </div>
      )}

      {/* Tab Content 3: Red Flags */}
      {activeTab === 'flags' && (
        <div className="card p-6">
          <h3 className="font-display font-semibold text-sm mb-6 text-[var(--text-primary)] flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            Identified Risks & Red Flags
          </h3>
          {analysis.redFlags && analysis.redFlags.length > 0 ? (
            <div className="space-y-4">
              {analysis.redFlags.map((flag, i) => (
                <div key={i} className="p-5 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="font-bold text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                      <ShieldAlert size={16} /> {flag.title || 'Red Flag'}
                    </h4>
                    <span className="text-[10px] font-bold uppercase bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-0.5 rounded">
                      {flag.severity} severity
                    </span>
                  </div>
                  
                  {flag.excerpt && flag.excerpt !== 'Information Not Found In Document' && (
                    <blockquote className="my-2.5 p-3.5 bg-[var(--surface-2)] rounded border-l-4 border-red-500 font-mono text-[11.5px] text-[var(--text-primary)] font-semibold italic">
                      "{flag.excerpt}"
                    </blockquote>
                  )}

                  <div className="grid-2 gap-4 mt-3 text-xs">
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">Explanation of Risk:</p>
                      <p className="text-[var(--text-secondary)] leading-relaxed mt-0.5">{flag.risk}</p>
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">Potential Consequences:</p>
                      <p className="text-[var(--text-secondary)] leading-relaxed mt-0.5">{flag.consequences}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle size={40} className="mx-auto text-green-500 mb-2" />
              <p className="font-semibold text-sm">No red flags detected!</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">This agreement appears to follow standard fair parameters.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 4: Obligations & Dates */}
      {activeTab === 'obligations' && (
        <div className="space-y-6">
          {/* Financial Obligations */}
          <div className="card p-6">
            <h3 className="font-display font-semibold text-sm mb-4 text-[var(--text-primary)] flex items-center gap-2">
              <DollarSign size={18} className="text-yellow-500" />
              Financial Obligations & Penalties
            </h3>
            {analysis.financialObligations && analysis.financialObligations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-strong)] text-[var(--text-muted)] font-bold">
                      <th className="py-2.5">Obligation Description</th>
                      <th className="py-2.5">Amount</th>
                      <th className="py-2.5">Trigger Terms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.financialObligations.map((ob, i) => (
                      <tr key={i} className="border-b border-[var(--border)] font-medium">
                        <td className="py-3 pr-4 text-[var(--text-primary)] font-semibold">{ob.description}</td>
                        <td className="py-3 pr-4"><span className={ob.amount.includes('Not Found') ? 'text-[var(--text-muted)] italic' : 'hl-amount'}>{ob.amount}</span></td>
                        <td className="py-3 text-[var(--text-secondary)] leading-relaxed">{ob.terms}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">No financial metrics detected.</p>
            )}
          </div>

          {/* Important Dates */}
          <div className="card p-6">
            <h3 className="font-display font-semibold text-sm mb-4 text-[var(--text-primary)] flex items-center gap-2">
              <Calendar size={18} className="text-blue-500" />
              Critical Timeframes & Deadlines
            </h3>
            {analysis.importantDates && analysis.importantDates.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-strong)] text-[var(--text-muted)] font-bold">
                      <th className="py-2.5">Significance</th>
                      <th className="py-2.5">Critical Date</th>
                      <th className="py-2.5">Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.importantDates.map((dt, i) => (
                      <tr key={i} className="border-b border-[var(--border)] font-medium">
                        <td className="py-3 pr-4 text-[var(--text-primary)] font-semibold">{dt.description}</td>
                        <td className="py-3 pr-4"><span className={dt.date.includes('Not Found') ? 'text-[var(--text-muted)] italic' : 'hl-date'}>{dt.date}</span></td>
                        <td className="py-3 text-[var(--text-secondary)] leading-relaxed">{dt.significance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">No dates or milestones detected.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 5: Missing Clauses */}
      {activeTab === 'compliance' && (
        <div className="card p-6">
          <h3 className="font-display font-semibold text-sm mb-4 text-[var(--text-primary)] flex items-center gap-2">
            <HelpCircle size={18} className="text-purple-500" />
            Missing Clauses & Protective Exclusions
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed">
            AI has scanned the contract for key clauses that are typical for this document type but are currently missing. Adding these clauses can protect you from liabilities.
          </p>

          {analysis.missingClauses && analysis.missingClauses.length > 0 ? (
            <div className="space-y-4">
              {analysis.missingClauses.map((mc, i) => (
                <div key={i} className="p-4 bg-[var(--surface-2)] rounded border-l-4 border-purple-500 text-xs">
                  <h4 className="font-bold text-sm text-[var(--text-primary)] mb-1">{mc.clause}</h4>
                  <p className="text-[var(--text-secondary)] leading-relaxed mt-1">{mc.explanation}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)] italic">No critical missing clauses detected.</p>
          )}
        </div>
      )}

      {/* Tab Content 6: Extracted Skills */}
      {activeTab === 'skills' && (
        <div className="card p-6">
          <h3 className="font-display font-semibold text-sm mb-4 text-[var(--text-primary)]">Extracted Resume Skills</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-6">
            The AI has parsed the profile and extracted hard skills and soft skills automatically.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {analysis.extractedSkills && analysis.extractedSkills.length > 0 ? (
              analysis.extractedSkills.map((skill, i) => (
                <span
                  key={i}
                  className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-150 dark:border-blue-900/60 font-semibold px-3.5 py-1.5 rounded-full text-xs hover:scale-105 transition"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">No skills extracted from this profile.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 7: ATS Score & Feedback */}
      {activeTab === 'ats' && (
        <div className="grid-1 md:grid-[1fr_2fr] gap-6 items-start">
          {/* Progress Circular Ring */}
          <div className="card p-6 flex flex-col items-center justify-center text-center">
            <h4 className="font-display font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider mb-6">Match Metric</h4>
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="var(--border)" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={analysis.atsScore >= 80 ? '#10B981' : analysis.atsScore >= 50 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * (analysis.atsScore || 0)) / 100}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-extrabold text-[var(--text-primary)]">{analysis.atsScore || 0}%</span>
                <span className="text-[10px] block text-[var(--text-muted)] font-bold uppercase mt-0.5">COMPATIBILITY</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] mt-6 leading-relaxed">
              {analysis.atsScore >= 80 ? '🎉 Excellent resume matching profile!' : analysis.atsScore >= 60 ? '⚡ Strong match, but recommends keywords optimization.' : '⚠️ Low score comparison. Please address critical issues.'}
            </p>
          </div>

          {/* Feedback details */}
          <div className="card p-6">
            <h3 className="font-display font-semibold text-sm mb-4 text-[var(--text-primary)]">Improvement Suggestions & Changes</h3>
            {analysis.resumeFeedback && analysis.resumeFeedback.length > 0 ? (
              <div className="space-y-4">
                {analysis.resumeFeedback.map((fb, i) => (
                  <div key={i} className="p-4 bg-[var(--surface-2)] rounded border-l-4 border-yellow-500 text-xs">
                    <span className="font-bold text-[10px] uppercase text-yellow-700 bg-yellow-100 dark:bg-yellow-950/40 dark:text-yellow-400 px-2 py-0.5 rounded">
                      {fb.category || 'Feedback'}
                    </span>
                    <p className="font-bold text-sm text-[var(--text-primary)] mt-2">{fb.issue}</p>
                    <p className="text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                      <span className="font-bold text-[var(--text-primary)]">Suggested improvement:</span> {fb.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">No specific issues or improvements generated.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 8: Candidate Contacts */}
      {activeTab === 'contact' && (
        <div className="card p-6 max-w-xl">
          <h3 className="font-display font-semibold text-sm mb-4 text-[var(--text-primary)]">Candidate Contact Information</h3>
          <div className="space-y-3.5 text-xs text-[var(--text-secondary)] font-medium">
            <div className="p-3 bg-[var(--surface-2)] rounded border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Contact Name</span>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">{analysis.contactInfo?.name || 'Information Not Found In Document'}</p>
            </div>
            <div className="p-3 bg-[var(--surface-2)] rounded border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Email Address</span>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">{analysis.contactInfo?.email || 'Information Not Found In Document'}</p>
            </div>
            <div className="p-3 bg-[var(--surface-2)] rounded border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Phone Number</span>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">{analysis.contactInfo?.phone || 'Information Not Found In Document'}</p>
            </div>
            <div className="p-3 bg-[var(--surface-2)] rounded border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Websites & Links</span>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">{analysis.contactInfo?.links || 'Information Not Found In Document'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 9: Action Items & Caveats (Contracts) */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          {/* Action checklist */}
          <div className="card p-6">
            <h3 className="font-display font-semibold text-sm mb-4 text-[var(--text-primary)]">Interactive Contract Checklist</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              Check off tasks as you complete them to track obligations chronologically.
            </p>
            {analysis.actionItems && analysis.actionItems.length > 0 ? (
              <div className="space-y-2.5">
                {analysis.actionItems.map((act, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-3 p-3 bg-[var(--surface-2)] rounded border border-[var(--border)] cursor-pointer text-xs font-semibold select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition ${checkedItems[i] ? 'opacity-50 line-through' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedItems[i]}
                      onChange={() => toggleCheck(i)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[var(--text-primary)]">{act}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">No daily operational checklist items extracted.</p>
            )}
          </div>

          {/* Hidden Caveats */}
          <div className="card p-6 border-l-4 border-amber-500">
            <h3 className="font-display font-semibold text-sm mb-4 text-[var(--text-primary)] flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500 animate-bounce" /> Hidden Caveats & Warn Clauses
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              AI flags hidden auto-renewal clauses, unilateral edits, or hidden interest fees:
            </p>
            {analysis.hiddenCaveats && analysis.hiddenCaveats.length > 0 ? (
              <div className="space-y-2.5">
                {analysis.hiddenCaveats.map((cav, i) => (
                  <div
                    key={i}
                    className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg text-xs leading-relaxed text-amber-800 dark:text-amber-300 font-semibold"
                  >
                    {cav}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">No hidden traps or caveats detected.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisResultPage;
