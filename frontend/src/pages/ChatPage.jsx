import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { Send, FileText, ArrowLeft, MessageSquare, AlertCircle, Bookmark, Compass } from 'lucide-react';
import toast from '../utils/toast';

const ChatPage = () => {
  const { documentId } = useParams();

  const [document, setDocument] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  const sampleQuestions = [
    "What is the termination clause?",
    "What penalties exist?",
    "What happens if payment is delayed?",
    "Who are the signing parties?"
  ];

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      // Fetch document details first
      const docRes = await apiFetch(`/api/analyze/history`);
      const docData = await docRes.json();
      if (docRes.ok) {
        const doc = (docData.documents || []).find(d => d._id === documentId);
        setDocument(doc);
      }

      // Fetch message history
      const chatRes = await apiFetch(`/api/chat/${documentId}`);
      const chatData = await chatRes.json();
      if (chatRes.ok) {
        setMessages(chatData.chatSession?.messages || []);
      }
    } catch (err) {
      toast.error('Failed to load chat details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, [documentId]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query || query.trim().length === 0) return;

    if (!textToSend) setInput('');
    setSending(true);

    // Optimistically add user query to messages UI
    const tempUserMsg = { _id: `temp_u_${Date.now()}`, role: 'user', content: query, timestamp: new Date() };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await apiFetch(`/api/chat/${documentId}`, {
        method: 'POST',
        body: JSON.stringify({ question: query })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate response');

      // Update state with updated session messages from backend (which includes assistant response + citations)
      setMessages(data.chatSession.messages);
    } catch (err) {
      toast.error(err.message);
      // Remove optimistic user message on error to avoid confusion
      setMessages(prev => prev.filter(m => m._id !== tempUserMsg._id));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="spinner mb-4"></div>
        <p className="font-semibold text-sm animate-pulse">Initializing semantic search node...</p>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-4xl flex flex-col h-[calc(100vh-64px)] justify-between">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
        <div>
          <Link to="/dashboard" className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--primary)] font-semibold transition mb-1">
            <ArrowLeft size={12} /> Back
          </Link>
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            <h3 className="font-display font-bold text-sm text-[var(--text-primary)] truncate max-w-md">
              {document ? document.fileName : 'Document QA'}
            </h3>
          </div>
        </div>
        <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-1 rounded-full uppercase tracking-wider">
          RAG Pipeline Active
        </span>
      </div>

      {/* Chat Messages */}
      <div className="chat-container flex-1 bg-[var(--surface-2)] my-4 rounded-xl border border-[var(--border)] overflow-hidden flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="feature-icon-wrap fi-blue text-white animate-float mb-4">
              <MessageSquare size={22} />
            </div>
            <h4 className="font-bold text-base text-[var(--text-primary)]">Ask Your Document</h4>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1.5 mb-6 leading-relaxed">
              Ask queries about specific sections, liabilities, auto-renewals, or dates. The AI answers using retrieved document segments.
            </p>

            <div className="w-full max-w-md">
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider text-left mb-2 flex items-center gap-1">
                <Compass size={12} /> Suggested Questions:
              </p>
              <div className="grid-2 gap-2 text-left">
                {sampleQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="p-3 bg-[var(--surface)] text-[11px] hover:border-blue-300 hover:bg-blue-50/50 text-[var(--text-secondary)] font-semibold rounded-lg border border-[var(--border)] transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg._id || i}
                  className={`chat-bubble ${isUser ? 'user' : 'assistant'}`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* Citations Excerpt */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1">
                        <Bookmark size={10} /> Cited Excerpts:
                      </p>
                      <div className="space-y-2">
                        {msg.citations.map((cit, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded border-l-2 border-blue-500 text-[10px]">
                            <p className="font-bold text-[var(--text-secondary)]">Page {cit.pageNumber || 'N/A'}:</p>
                            <p className="italic text-[var(--text-muted)] mt-0.5 leading-relaxed">"{cit.text}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {sending && (
              <div className="chat-bubble assistant flex items-center gap-2">
                <span className="spinner w-4 h-4 border-2 border-t-blue-500"></span>
                <span className="text-xs text-[var(--text-muted)] font-medium">Scanning vector index...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        <div className="chat-input-area">
          <textarea
            className="chat-input"
            rows="1"
            placeholder="Type your question here (e.g. What penalties exist?)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={sending}
          />
          <button
            onClick={() => handleSendMessage()}
            className="btn btn-primary btn-icon flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700"
            disabled={sending || !input.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
