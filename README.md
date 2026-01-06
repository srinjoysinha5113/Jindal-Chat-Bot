# Jindal Power Safety Bot - Frontend

A professional, production-ready safety chatbot interface for Jindal Power Limited employees. This frontend connects to your FastAPI backend to provide real-time safety guidance.

## 📋 Features

✅ **Chat Interface** - Ask safety questions in natural language  
✅ **FAQ Section** - Browse categorized safety guidelines  
✅ **System Health Check** - Monitor backend connection status  
✅ **Glassmorphism UI** - Modern, professional design  
✅ **Responsive Design** - Works on desktop and mobile  
✅ **Real-time Connection** - Direct API integration with backend  
✅ **Toast Notifications** - User feedback on actions  
✅ **Jindal Power Branding** - Professional company styling  

## 📁 Files in This Package

```
frontend/
├── index.html          # Main HTML structure
├── styles.css          # Professional styling with Jindal branding
├── script.js           # Frontend logic & API connections
├── faq_data.json       # FAQ content database
├── jindal_power_limited_logo.jpg  # Company logo
└── README.md           # This file
```

## 🚀 Quick Start

### Prerequisites

- **Backend Running**: Ensure your FastAPI backend (`app.py`) is running on `http://localhost:8000`
- **Modern Browser**: Chrome, Firefox, Safari, or Edge (modern versions)
- **Static Server**: Live Server or any HTTP server (NOT file:// protocol)

### Setup Steps

1. **Place Frontend Files**
   ```bash
   # Copy all frontend files to your project folder:
   frontend/
   ├── index.html
   ├── styles.css
   ├── script.js
   ├── faq_data.json
   └── jindal_power_limited_logo.jpg
   ```

2. **Ensure Backend is Running**
   ```bash
   # In a separate terminal, from your project root:
   python app.py
   
   # Or using uvicorn:
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Start Frontend Server**

   **Option A: VS Code Live Server (Recommended)**
   - Install "Live Server" extension in VS Code
   - Right-click `index.html` → "Open with Live Server"
   - Browser opens at `http://127.0.0.1:5500`

   **Option B: Python HTTP Server**
   ```bash
   python -m http.server 8001
   # Then open: http://localhost:8001
   ```

   **Option C: Node.js HTTP Server**
   ```bash
   npx http-server -p 8001
   # Then open: http://localhost:8001
   ```

4. **Test the Connection**
   - Open the frontend in your browser
   - Click the "🏥 Status" tab
   - You should see "✅ System Online" if backend is connected
   - Try asking a safety question in the chat

## 🔧 Configuration

### Backend URL (if not localhost:8000)

If your backend is running on a different URL, edit `script.js`:

```javascript
// Line 5 in script.js
const API_BASE_URL = "http://your-backend-url:8000";
```

### Adding Your Company Logo

Replace `jindal_power_limited_logo.jpg` with your logo file (same name or update in `index.html`):

```html
<!-- In index.html, line ~17 -->
<img src="your-logo.jpg" alt="Company Logo" class="logo">
```

### Customizing FAQ Content

Edit `faq_data.json` to add/modify safety questions and answers:

```json
{
  "categories": [
    {
      "name": "Your Category",
      "faqs": [
        {
          "question": "Your question?",
          "answer": "Your answer...",
          "severity": "info|warning|high|critical"
        }
      ]
    }
  ]
}
```

## 🎨 UI Customization

### Colors (Jindal Power Brand)

Edit `:root` variables in `styles.css`:

```css
:root {
  --primary-color: #1a1a1a;      /* Dark background */
  --secondary-color: #d4a574;    /* Gold accent */
  --accent-color: #c9302c;       /* Red accent */
  --success-color: #28a745;      /* Green */
  --warning-color: #ffc107;      /* Yellow */
  --danger-color: #dc3545;       /* Red */
}
```

### Typography

Change font in `styles.css`:

```css
--font-main: 'Your Font', sans-serif;
```

## 🔌 API Endpoints Used

Your frontend communicates with these backend endpoints:

### 1. Chat Endpoint
```
POST /chat
Content-Type: application/json

Request:
{
  "message": "What PPE is required?"
}

Response:
{
  "answer": "Safety helmet, safety shoes...",
  "source_chunks": ["chunk1", "chunk2", ...]
}
```

### 2. Health Check Endpoint
```
GET /health

Response:
{
  "status": "ok",
  "vector_store_ready": true,
  "chunks_loaded": 150
}
```

## 📱 Browser Support

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome  | ✅      | ✅     |
| Firefox | ✅      | ✅     |
| Safari  | ✅      | ✅     |
| Edge    | ✅      | ✅     |

## ⚠️ Troubleshooting

### "Connection error: Cannot connect to backend"

**Solution:**
1. Check backend is running: `python app.py`
2. Verify port 8000 is available: `netstat -ano | findstr :8000` (Windows)
3. Ensure you're NOT opening as file:// (use http://localhost)
4. Check CORS is enabled in backend

### "FAQ data could not be loaded"

**Solution:**
1. Ensure `faq_data.json` is in the same folder as `index.html`
2. Check file is valid JSON: use https://jsonlint.com/
3. Clear browser cache (Ctrl+Shift+Delete)

### "Slow response / Timeout"

**Solution:**
1. Ollama model might be loading (first request is slow)
2. Check: `ollama ps` to verify models are loaded
3. Try a simpler question first
4. If persistent, check system resources (CPU/RAM)

### "Logo not showing"

**Solution:**
1. Check `jindal_power_limited_logo.jpg` exists in same folder
2. Verify filename capitalization matches
3. Open browser console (F12) to see specific errors

## 📊 Performance Tips

1. **Preload Models**: Ensure Ollama models are pulled before deploying:
   ```bash
   ollama pull nomic-embed-text
   ollama pull llama3.2:1b
   ```

2. **Rerank Disabled?**: If responses are slow, disable reranking in backend:
   ```python
   # In app.py, /chat endpoint, comment out:
   # final_chunks = rerank_chunks(...)
   # Use: final_chunks = retrieve_relevant_chunks(...)
   ```

3. **Cache Embeddings**: Backend caches embeddings automatically (in `faiss_index/`)

4. **Browser Cache**: Clear cookies/cache periodically for fresh data

## 🔐 Security Notes

- **CORS**: Frontend and backend communicate via CORS
- **No Auth**: Current implementation has no authentication (for internal use)
- **Local Data**: All safety PDFs stay on-premises (not sent externally)
- **HTTPS**: For production, deploy with HTTPS/SSL

## 📈 Deployment

### For Internal Network

1. Host backend on company server with fixed IP
2. Update `API_BASE_URL` in `script.js`
3. Deploy frontend to intranet web server
4. Restrict access via firewall rules

### For Production

1. Use HTTPS/SSL certificates
2. Add authentication (JWT/SSO)
3. Deploy with Docker containers
4. Use load balancer for high availability
5. Monitor logs and error rates

## 📞 Support

For issues or questions:
1. Check backend logs: `python app.py` console output
2. Check browser console: F12 → Console tab
3. Review troubleshooting section above
4. Verify backend API health: `GET /health`

## 📝 Version Info

- **Frontend Version**: 1.0
- **Backend Requirement**: FastAPI with RAG support
- **Built**: January 2026
- **Company**: Jindal Power Limited

---

**Last Updated**: January 5, 2026  
**Maintained By**: Safety Engineering Team
