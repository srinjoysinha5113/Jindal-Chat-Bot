# 🚀 Complete Setup Guide - Jindal Power Safety Bot

## Project Structure

After setup, your project folder should look like this:

```
safety-bot-project/
├── Backend/
│   ├── app.py                  # FastAPI backend (from previous setup)
│   ├── requirements.txt         # Python dependencies
│   └── data/
│       ├── safety_manual.pdf
│       ├── operational_procedures.pdf
│       └── ... (your safety PDFs)
│
├── Frontend/
│   ├── index.html              # ✨ NEW - Main page
│   ├── styles.css              # ✨ NEW - Styling
│   ├── script.js               # ✨ NEW - Frontend logic
│   ├── faq_data.json           # ✨ NEW - FAQ database
│   ├── jindal_power_limited_logo.jpg  # ✨ NEW - Your logo
│   └── README.md               # ✨ NEW - Frontend docs
│
└── README.md                    # Overall project docs
```

## Step-by-Step Setup

### ✅ Step 1: Organize Files

1. **Create folder structure:**
   ```bash
   mkdir -p safety-bot-project/Backend
   mkdir -p safety-bot-project/Frontend
   ```

2. **Move backend files to Backend/ folder:**
   - `app.py` → `Backend/app.py`
   - `requirements.txt` → `Backend/requirements.txt`
   - `data/` → `Backend/data/` (with your PDFs)

3. **Move frontend files to Frontend/ folder:**
   - `index.html` → `Frontend/index.html`
   - `styles.css` → `Frontend/styles.css`
   - `script.js` → `Frontend/script.js`
   - `faq_data.json` → `Frontend/faq_data.json`
   - `jindal_power_limited_logo.jpg` → `Frontend/jindal_power_limited_logo.jpg`

### ✅ Step 2: Setup Backend

1. **Open terminal in Backend/ folder:**
   ```bash
   cd safety-bot-project/Backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv .venv
   ```

3. **Activate virtual environment:**
   - **Windows (PowerShell):**
     ```bash
     .venv\Scripts\Activate.ps1
     ```
   - **Windows (Command Prompt):**
     ```bash
     .venv\Scripts\activate.bat
     ```
   - **Linux/macOS:**
     ```bash
     source .venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Ensure Ollama is running:**
   ```bash
   ollama serve
   # In another terminal:
   ollama pull nomic-embed-text
   ollama pull llama3.2:1b
   ```

6. **Start backend server:**
   ```bash
   python app.py
   # Or:
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

   **Expected output:**
   ```
   INFO:     Uvicorn running on http://0.0.0.0:8000
   Initializing RAG system...
   FAISS index built with X vectors
   RAG system ready!
   ```

### ✅ Step 3: Setup Frontend

1. **Open a NEW terminal in Frontend/ folder:**
   ```bash
   cd safety-bot-project/Frontend
   ```

2. **Start a web server (choose one):**

   **Option A: Python (Easiest)**
   ```bash
   python -m http.server 8001
   ```
   Then open: `http://localhost:8001`

   **Option B: Node.js**
   ```bash
   npx http-server -p 8001
   ```
   Then open: `http://localhost:8001`

   **Option C: VS Code Live Server**
   - Install "Live Server" extension
   - Right-click `index.html` → "Open with Live Server"
   - Opens automatically at `http://127.0.0.1:5500`

### ✅ Step 4: Test Everything

1. **Check Backend Health:**
   - Open `http://localhost:8000/health` in browser
   - Should show: `{"status":"ok","vector_store_ready":true,...}`

2. **Check Frontend Connection:**
   - Open frontend (e.g., `http://localhost:8001`)
   - Click "🏥 Status" tab
   - Should show "✅ System Online"

3. **Test Chat:**
   - Type a safety question
   - Click "Send"
   - Should get an answer from the bot

4. **Test FAQ:**
   - Click "❓ FAQ" tab
   - Browse categories
   - Click questions to expand answers

### ✅ Step 5: Verify Frontend Files are Correct

Your `Frontend/` folder should contain **exactly** these files:

```bash
Frontend/
├── index.html                      (10 KB - HTML structure)
├── styles.css                      (15 KB - CSS styling)
├── script.js                       (8 KB - JavaScript logic)
├── faq_data.json                   (6 KB - FAQ content)
├── jindal_power_limited_logo.jpg   (5 KB - Logo image)
└── README.md                       (documentation)
```

## 🔗 Port Summary

| Service | URL | Status |
|---------|-----|--------|
| Backend API | `http://localhost:8000` | Running (Terminal 1) |
| Frontend (Python HTTP) | `http://localhost:8001` | Running (Terminal 2) |
| Frontend (Live Server) | `http://127.0.0.1:5500` | Running (VS Code) |

## 🧪 Quick Tests

### Test Backend Directly
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is PPE?"}'
```

Expected response:
```json
{
  "answer": "Personal Protective Equipment (PPE) includes...",
  "source_chunks": ["chunk1", "chunk2", ...]
}
```

### Test Frontend Loads
```bash
curl http://localhost:8001
# Should return HTML content
```

## ⚠️ Common Issues & Fixes

### Issue: "Cannot connect to backend"
**Solution:**
```bash
# Check if backend is running
curl http://localhost:8000/health

# If not, restart backend in Terminal 1
cd Backend
python app.py
```

### Issue: "Ollama model not found"
**Solution:**
```bash
ollama pull nomic-embed-text
ollama pull llama3.2:1b
```

### Issue: "Port 8001 already in use"
**Solution:**
```bash
# Use different port
python -m http.server 8002
# Then open: http://localhost:8002
```

### Issue: "Logo not showing"
**Solution:**
1. Check file exists: `Frontend/jindal_power_limited_logo.jpg`
2. Check filename matches in `index.html`
3. Refresh browser cache (Ctrl+Shift+Delete)

### Issue: "FAQ not loading"
**Solution:**
1. Check `faq_data.json` exists in `Frontend/` folder
2. Validate JSON: https://jsonlint.com/
3. Check browser console (F12) for errors

## 📚 Documentation Files

- **Backend Setup**: See `Backend/README.md` or main setup guide
- **Frontend Docs**: See `Frontend/README.md`
- **API Documentation**: See `/health` and `/chat` endpoints in backend

## 🎓 Understanding the Architecture

```
User (Browser)
    ↓
Frontend (HTML/CSS/JS) on Port 8001
    ↓
HTTP Request to Backend API
    ↓
Backend (FastAPI) on Port 8000
    ↓
RAG Pipeline:
  1. Query embedding (Ollama)
  2. FAISS similarity search
  3. Chunk reranking (Ollama)
  4. RAG prompt building
  5. LLM response (Ollama llama3.2:1b)
    ↓
Response back to Frontend
    ↓
Display in Chat Interface
```

## 🚀 Next Steps (After Getting Everything Working)

1. **Add More PDFs:**
   - Put new safety manuals in `Backend/data/`
   - Call `/rebuild-index` endpoint to re-embed

2. **Customize FAQ:**
   - Edit `Frontend/faq_data.json` with your content

3. **Deploy to Server:**
   - Set up on company intranet/server
   - Update `API_BASE_URL` in `Frontend/script.js`

4. **Monitor Performance:**
   - Check backend logs for errors
   - Monitor Ollama memory usage
   - Track response times

## 📞 Verification Checklist

Before considering the project complete, verify:

- [ ] Backend running on port 8000
- [ ] Frontend accessible on port 8001/8002/5500
- [ ] Health check shows "✅ System Online"
- [ ] Can send chat message and get response
- [ ] FAQ loads and questions expand
- [ ] Logo displays in header
- [ ] Responsive on mobile (test with F12 device toolbar)
- [ ] No JavaScript errors (check F12 console)
- [ ] PDFs in `Backend/data/` folder
- [ ] All 5 frontend files present and named correctly

## 💾 Backup & Restore

### Backup everything:
```bash
cp -r safety-bot-project safety-bot-project.backup
```

### Restore from backup:
```bash
rm -rf safety-bot-project
mv safety-bot-project.backup safety-bot-project
```

## 📝 Project Completion Summary

**Frontend Component:** ✅ Complete
- Responsive Glassmorphism UI
- 3 tabs: Chat, FAQ, Status
- Connected to FastAPI backend
- Professional Jindal Power branding
- Mobile & desktop support

**Backend Component:** ✅ Complete (from previous)
- FastAPI REST API
- RAG with FAISS embeddings
- Ollama integration (llama3.2:1b)
- Reranking for accuracy
- Temperature 0.1 for safety

**Ready for:** ✅
- Internal deployment
- Employee training
- On-premises operation
- Resume/portfolio inclusion

---

**Good luck with your Jindal Power Safety Bot project! 🎉**

Questions? Check the README.md files in Frontend/ and Backend/ folders.
