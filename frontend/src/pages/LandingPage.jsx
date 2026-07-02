import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, Languages, MessageSquare, ToggleLeft, ArrowRight, CheckCircle, Scale } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();

  const supportedDocs = [
    "Property Agreements & Sale Deeds",
    "Rental & Lease Contracts",
    "Insurance Policies & Claims",
    "Bank & Loan Agreements",
    "Employment Contracts & Offers",
    "Terms of Service & Privacy Policies",
    "Legal Notices & Government Sheets"
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="section gradient-hero text-white text-center py-20 relative overflow-hidden">
        <div className="container-md relative z-10 flex flex-col items-center">
          <div className="animate-float mb-6 p-3 bg-white/10 rounded-full backdrop-blur-md">
            <Scale size={48} className="text-yellow-400" />
          </div>
          
          <h1 className="font-display font-bold leading-tight mb-4 tracking-tight">
            Demystify Complex Legal Documents
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mb-8 font-medium">
            AI-powered, evidence-based legal document analysis. Get plain language summaries, risk assessments, red flags, financial obligations, and translations in seconds.
          </p>

          <div className="flex gap-4 justify-center">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg bg-yellow-500 hover:bg-yellow-600 text-slate-900 border-none flex items-center gap-2">
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg bg-white text-blue-900 hover:bg-blue-50 border-none flex items-center gap-2">
                  Get Started Free <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg bg-transparent text-white border-white/40 hover:bg-white/10">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2"></div>
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2"></div>
      </section>

      {/* Supported Documents Section */}
      <section className="section section-sm bg-[var(--surface-2)]">
        <div className="container">
          <h2 className="text-center mb-10 font-display font-bold text-[var(--text-primary)]">Supported Documents</h2>
          <div className="grid-3">
            {supportedDocs.map((doc, idx) => (
              <div key={idx} className="card p-6 flex items-start gap-4 card-hover">
                <div className="p-2 rounded bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1 text-[var(--text-primary)]">{doc}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Demystify terms, penalties, obligations, and risk factors instantly.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="section bg-[var(--surface)]">
        <div className="container">
          <h2 className="text-center mb-12 font-display font-bold text-[var(--text-primary)]">Advanced Platform Features</h2>
          
          <div className="grid-4">
            {/* Feature 1 */}
            <div className="text-center flex flex-col items-center">
              <div className="feature-icon-wrap fi-blue text-white animate-pulse-glow">
                <Shield size={24} />
              </div>
              <h3 className="font-bold text-base mb-2 text-[var(--text-primary)]">Evidence-Based Summary</h3>
              <p className="text-xs text-[var(--text-secondary)]">Never hallucinates. Extract plain language summaries, obligations, and red flags directly mapped to quoted citations.</p>
            </div>

            {/* Feature 2 */}
            <div className="text-center flex flex-col items-center">
              <div className="feature-icon-wrap fi-purple text-white">
                <MessageSquare size={24} />
              </div>
              <h3 className="font-bold text-base mb-2 text-[var(--text-primary)]">Interactive AI Q&A</h3>
              <p className="text-xs text-[var(--text-secondary)]">Ask the document anything. The chatbot fetches context from Pinecone and answers with source paragraph quotes.</p>
            </div>

            {/* Feature 3 */}
            <div className="text-center flex flex-col items-center">
              <div className="feature-icon-wrap fi-teal text-white">
                <ToggleLeft size={24} />
              </div>
              <h3 className="font-bold text-base mb-2 text-[var(--text-primary)]">What-If Simulation</h3>
              <p className="text-xs text-[var(--text-secondary)]">Modify payment schedules, values, interest rates, or durations and immediately calculate updated risk variations.</p>
            </div>

            {/* Feature 4 */}
            <div className="text-center flex flex-col items-center">
              <div className="feature-icon-wrap fi-amber text-white">
                <Languages size={24} />
              </div>
              <h3 className="font-bold text-base mb-2 text-[var(--text-primary)]">Multi-Language Translate</h3>
              <p className="text-xs text-[var(--text-secondary)]">Instantly translate legal analyses and breakdown summaries from English to Hindi or vice versa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section bg-slate-900 text-white text-center py-16">
        <div className="container-md flex flex-col items-center">
          <h2 className="font-display font-bold mb-4 text-white">Protect Yourself From Bad Terms</h2>
          <p className="text-sm text-slate-400 max-w-xl mb-6">
            Ensure you understand every liability, date, and hidden cost before signing. Demystifier simplifies legal talk so anyone can understand.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg bg-blue-600 hover:bg-blue-700 text-white border-none flex items-center gap-2">
            Get Started Now <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
