# Legal Docs Demystifier ⚖️

An AI-powered Legal Document Analysis and Risk Assessment Platform that simplifies complex legal and business documents into plain language, extracts key clauses, identifies financial obligations, runs "What-If" contract modifications, and supports interactive document-grounded chat and translation.

---

## 🚀 Key Features

1. **RAG Pipeline**: Fully integrated semantic search using Google's `text-embedding-004` (768-dim) model and Pinecone vector store, with an automatic in-memory cosine-similarity fallback database for offline development.
2. **AI Analysis Output**: Custom legal expert prompts that return structured JSON outputs analyzing summaries, key clauses, red flags, obligations, dates, missing clauses, and recommendations.
3. **What-If Risk Simulator**: Simulate changes in payment terms, notice periods, or contract durations to see immediately how the risk profile shifts.
4. **Interactive Chat**: Document-grounded Q&A chatbot with citation references to document page numbers and chunk context.
5. **OCR Integration**: Auto-runs OCR via Tesseract.js when processing scanned documents or image formats.
6. **Multi-Language Translation**: Gemini-driven translation of the full analysis report into English and Hindi.
7. **JWT Security**: Complete session auth with short-lived access tokens and 7-day database-backed refresh tokens, utilizing bcrypt hashing.
8. **Modern React Dashboard**: Built on React 18 & Tailwind CSS. Includes user settings/profiles, loading skeletons, dark mode toggling, upload pages, and analysis results view.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router DOM, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express, Winston Logger, Swagger UI
- **Database**: MongoDB (Mongoose), Pinecone Vector DB (Local Fallback option)
- **AI Models**: Gemini 2.5 Pro (Primary), GPT-4o (Fallback)

---

## 📂 Project Structure

```text
legal-docs-demystifier/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB, Winston Logger, Swagger configuration
│   │   ├── models/          # User, Document, Analysis, Chat, Translation, Simulation schemas
│   │   ├── modules/auth/    # Auth controller, middleware, routes, and services
│   │   ├── routes/          # Analyze, Chat, What-If, and Translation endpoints
│   │   ├── services/
│   │   │   ├── ai/          # Gemini & GPT-4o calling layer, fallback orchestrator
│   │   │   ├── file/        # PDF/DOCX extractor, local storage, OCR via Tesseract
│   │   │   └── rag/         # Chunking, Embedding, Pinecone, Retrieval services
│   │   └── tests/           # Jest unit and integration tests
│   ├── server.js            # Express API server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── contexts/        # Auth and Theme React Contexts
│   │   ├── css/             # Stylesheet for custom animations & SaaS themes
│   │   ├── pages/           # All application pages (Dashboard, Upload, Chat, etc.)
│   │   ├── utils/           # API fetching wrappers and toast utilities
│   │   ├── App.jsx          # SPA Router & global layouts
│   │   └── main.jsx         # React bootstrapping
│   └── package.json
├── package.json             # Root-level monorepo orchestrator
└── README.md
```

---

## ⚙️ Environment Configuration

Create a `.env` file inside `/backend` directory based on `.env.example`:

```env
# AI Providers
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-pro
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
PRIMARY_AI_PROVIDER=gemini

# Vector DB
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX=legal-docs-index

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/legal-docs-demystifier

# Auth
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development
```

---

## 🏃 Run the Application

### 1. Install Dependencies
From the root directory, run:
```bash
npm run install:all
```

### 2. Start Services
To run both backend and frontend concurrently in development mode, open two terminals and run:

**Backend Terminal**:
```bash
npm run dev:backend
```

**Frontend Terminal**:
```bash
npm run dev:frontend
```

### 3. API Documentation
Open your browser and navigate to:
[http://localhost:3001/api/docs](http://localhost:3001/api/docs) to view the Swagger API Interactive playground.

### 4. Running Backend Tests
Execute the Jest test suite:
```bash
npm run test:backend
```
