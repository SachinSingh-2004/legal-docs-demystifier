import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { UploadCloud, CheckCircle2, User, Briefcase, GraduationCap, Users, Languages, Loader2 } from 'lucide-react';
import toast from '../utils/toast';

const UploadPage = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [persona, setPersona] = useState('default');
  const [language, setLanguage] = useState('en');
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobDescription, setJobDescription] = useState('');
  const [documentType, setDocumentType] = useState('general');

  const documentTypes = [
    { id: 'general', name: 'General Legal/Business Document' },
    { id: 'resume', name: 'Resume / CV' },
    { id: 'property', name: 'Property Agreement' },
    { id: 'deed', name: 'Sale Deed' },
    { id: 'rental', name: 'Rental / Lease Agreement' },
    { id: 'insurance', name: 'Insurance Policy' },
    { id: 'bank', name: 'Bank / Loan Document' },
    { id: 'employment', name: 'Employment Contract' },
    { id: 'terms', name: 'Terms & Conditions' },
    { id: 'privacy', name: 'Privacy Policy' },
    { id: 'offer', name: 'Offer Letter' },
    { id: 'notice', name: 'Legal / Government Notice' }
  ];

  const personas = [
    { id: 'default', name: 'General Public', icon: <Users size={22} />, desc: 'Simple, direct overview. Balanced legal and risk insights.' },
    { id: 'student', name: 'Student', icon: <GraduationCap size={22} />, desc: 'Educational descriptions. Defines complex jargon in basic terms.' },
    { id: 'business', name: 'Business Owner', icon: <Briefcase size={22} />, desc: 'Focuses on financial costs, operational terms, and business impact.' },
    { id: 'lawyer', name: 'Legal Counsel', icon: <User size={22} />, desc: 'Technical assessment. Cites precedents, principles, and risks.' },
    { id: 'senior', name: 'Senior Citizen', icon: <Users size={22} />, desc: 'Clear, patient layout. Highlights protective rights and scams.' }
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const allowed = ['pdf', 'docx', 'doc', 'txt', 'md', 'png', 'jpg', 'jpeg'];
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    
    if (!allowed.includes(ext)) {
      toast.error(`Unsupported file type: .${ext}. Please upload a PDF, DOCX, TXT, or Image.`);
      return;
    }
    
    // limit size to 10MB
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    setFile(selectedFile);
    toast.success(`File selected: ${selectedFile.name}`);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please choose a file to upload');
      return;
    }

    setSubmitting(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('persona', persona);
    formData.append('language', language);
    formData.append('jobDescription', jobDescription);
    formData.append('documentType', documentType);

    try {
      setUploadProgress(40);
      const res = await apiFetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      setUploadProgress(75);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete document analysis');
      }

      setUploadProgress(100);
      toast.success('Document analyzed successfully!');
      
      // Redirect to the newly created analysis page
      navigate(`/analysis/${data.analysis._id}`);
    } catch (err) {
      toast.error(err.message || 'Error occurred during analysis');
      setUploadProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-8 animate-fade-in max-w-4xl">
      <div className="text-center mb-8">
        <h2 className="font-display font-bold text-[var(--text-primary)]">Upload Document</h2>
        <p className="text-xs text-[var(--text-secondary)]">Choose a file, configure your analysis persona, and parse it in seconds.</p>
      </div>

      <form onSubmit={handleUploadSubmit} className="space-y-8">
        {/* File Drag and Drop */}
        <div className="card p-6">
          <h3 className="font-display font-semibold mb-4 text-sm text-[var(--text-primary)]">1. Choose File</h3>
          
          <div
            className={`upload-area ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              type="file"
              id="file-input"
              className="hidden"
              onChange={handleChange}
              accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg"
            />
            
            <div className="flex flex-col items-center">
              <UploadCloud size={48} className="upload-icon text-blue-500" />
              {file ? (
                <div className="text-center">
                  <p className="font-bold text-sm text-green-600 flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={16} /> Ready: {file.name}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">Click or drag another to replace</p>
                </div>
              ) : (
                <>
                  <p className="font-semibold text-sm text-[var(--text-primary)]">Drag and drop file here, or click to browse</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5">Supports PDF, DOCX, TXT, PNG, JPG (Max 10MB)</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Document Type Dropdown */}
        <div className="card p-6">
          <h3 className="font-display font-semibold mb-2 text-sm text-[var(--text-primary)]">2. Select Document Category</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            Select the category of the document you are uploading. This helps the AI customize the grading metrics and interface layout.
          </p>
          <div className="form-group max-w-xs">
            <select
              className="form-input form-select text-xs font-semibold bg-[var(--surface-2)] border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-[var(--text-primary)] cursor-pointer py-2.5"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              {documentTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Persona Select */}
        <div className="card p-6">
          <h3 className="font-display font-semibold mb-4 text-sm text-[var(--text-primary)]">2. Select Analysis Persona</h3>
          <div className="grid-2 md:grid-3 gap-4">
            {personas.map((p) => (
              <div
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={`persona-card ${persona === p.id ? 'selected' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`persona-icon ${persona === p.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {p.icon}
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">{p.name}</h4>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)] mt-2 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Job Description (Optional) */}
        <div className="card p-6">
          <h3 className="font-display font-semibold mb-2 text-sm text-[var(--text-primary)]">
            Job Description Matching (Optional)
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
            If you are uploading a Resume or CV, paste the target Job Description or job role requirements below to calculate an ATS compatibility score and get tailored resume feedback.
          </p>
          <textarea
            className="form-input w-full h-32 p-3 text-xs bg-[var(--surface-2)] border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-[var(--text-primary)] font-sans"
            placeholder="Paste target job role details here..."
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
          />
        </div>

        {/* Language Select */}
        <div className="card p-6">
          <h3 className="font-display font-semibold mb-4 text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Languages size={18} className="text-blue-600" />
            3. Select Analysis Language
          </h3>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-xs">
              <input
                type="radio"
                name="language"
                value="en"
                checked={language === 'en'}
                onChange={() => setLanguage('en')}
                className="w-4 h-4 text-blue-600"
              />
              English
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-xs">
              <input
                type="radio"
                name="language"
                value="hi"
                checked={language === 'hi'}
                onChange={() => setLanguage('hi')}
                className="w-4 h-4 text-blue-600"
              />
              Hindi (हिन्दी)
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col items-center">
          {submitting && (
            <div className="w-full max-w-md mb-4 text-center">
              <div className="progress-wrap mb-2">
                <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-semibold flex items-center justify-center gap-2 animate-pulse">
                <Loader2 size={12} className="animate-spin" />
                {uploadProgress < 40 ? 'Uploading file...' : uploadProgress < 75 ? 'Running OCR & Vector Indexing...' : 'Generative Legal Brain analyzing... Please wait.'}
              </p>
            </div>
          )}
          
          <button
            type="submit"
            className="btn btn-primary btn-lg px-12 flex items-center gap-2"
            disabled={submitting}
          >
            {submitting ? 'Analyzing Contract...' : 'Demystify Now'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadPage;
