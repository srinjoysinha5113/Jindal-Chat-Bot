/* ===================================
   Jindal Power Safety Bot - Frontend Script
   Connects to FastAPI Backend (app.py)
   =================================== */

// ===== Configuration =====
const API_BASE_URL = "http://localhost:8000";
const HEALTH_CHECK_INTERVAL = 5000; // 5 seconds

// ===== DOM Elements =====
const chatTab = document.getElementById("chat-tab");
const faqTab = document.getElementById("faq-tab");
const healthBtn = document.getElementById("health-btn");

const chatInterface = document.getElementById("chat-interface");
const faqInterface = document.getElementById("faq-interface");
const healthInterface = document.getElementById("health-interface");

const chatWindow = document.getElementById("chat-window");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const faqContainer = document.getElementById("faq-container");
const healthStatus = document.getElementById("health-status");
const healthDetails = document.getElementById("health-details");

const loadingIndicator = document.getElementById("loading-indicator");
const toast = document.getElementById("toast");

// ===== State =====
let isLoading = false;
let faqData = null;
let healthCheckInterval = null;

// ===== Tab Navigation =====
chatTab.addEventListener("click", () => switchTab("chat"));
faqTab.addEventListener("click", () => switchTab("faq"));
healthBtn.addEventListener("click", () => switchTab("health"));

function switchTab(tab) {
  // Update active button
  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));

  if (tab === "chat") {
    chatTab.classList.add("active");
    chatInterface.classList.add("active");
    faqInterface.classList.remove("active");
    healthInterface.classList.remove("active");
  } else if (tab === "faq") {
    faqTab.classList.add("active");
    faqInterface.classList.add("active");
    chatInterface.classList.remove("active");
    healthInterface.classList.remove("active");
    loadFAQData();
  } else if (tab === "health") {
    healthBtn.classList.add("active");
    healthInterface.classList.add("active");
    chatInterface.classList.remove("active");
    faqInterface.classList.remove("active");
    checkHealth();
  }
}

// ===== Markdown Formatting =====
function formatMarkdown(text) {
  // Escape HTML first to prevent XSS
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Code blocks: ```code``` → <pre><code>code</code></pre> (do this first to preserve code)
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  
  // Split into lines for list processing
  const lines = html.split('\n');
  const result = [];
  let inOrderedList = false;
  let inBulletList = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for code blocks (already processed, skip)
    if (line.includes('<pre><code>') || line.includes('</code></pre>')) {
      if (inOrderedList) {
        result.push('</ol>');
        inOrderedList = false;
      }
      if (inBulletList) {
        result.push('</ul>');
        inBulletList = false;
      }
      result.push(line);
      continue;
    }
    
    // Headers: ## Header → <h3>Header</h3>
    if (line.match(/^### (.+)$/)) {
      if (inOrderedList) {
        result.push('</ol>');
        inOrderedList = false;
      }
      if (inBulletList) {
        result.push('</ul>');
        inBulletList = false;
      }
      result.push(line.replace(/^### (.+)$/, '<h4>$1</h4>'));
      continue;
    }
    if (line.match(/^## (.+)$/)) {
      if (inOrderedList) {
        result.push('</ol>');
        inOrderedList = false;
      }
      if (inBulletList) {
        result.push('</ul>');
        inBulletList = false;
      }
      result.push(line.replace(/^## (.+)$/, '<h3>$1</h3>'));
      continue;
    }
    if (line.match(/^# (.+)$/)) {
      if (inOrderedList) {
        result.push('</ol>');
        inOrderedList = false;
      }
      if (inBulletList) {
        result.push('</ul>');
        inBulletList = false;
      }
      result.push(line.replace(/^# (.+)$/, '<h2>$1</h2>'));
      continue;
    }
    
    // Numbered lists: 1. item → <ol><li>item</li></ol>
    const orderedMatch = line.match(/^(\d+)\. (.+)$/);
    if (orderedMatch) {
      if (inBulletList) {
        result.push('</ul>');
        inBulletList = false;
      }
      if (!inOrderedList) {
        result.push('<ol>');
        inOrderedList = true;
      }
      result.push(`<li>${orderedMatch[2]}</li>`);
      continue;
    }
    
    // Bullet lists: - item or * item → <ul><li>item</li></ul>
    const bulletMatch = line.match(/^[-*] (.+)$/);
    if (bulletMatch) {
      if (inOrderedList) {
        result.push('</ol>');
        inOrderedList = false;
      }
      if (!inBulletList) {
        result.push('<ul>');
        inBulletList = true;
      }
      result.push(`<li>${bulletMatch[1]}</li>`);
      continue;
    }
    
    // Regular line - close any open lists
    if (inOrderedList) {
      result.push('</ol>');
      inOrderedList = false;
    }
    if (inBulletList) {
      result.push('</ul>');
      inBulletList = false;
    }
    
    result.push(line);
  }
  
  // Close any remaining open lists
  if (inOrderedList) {
    result.push('</ol>');
  }
  if (inBulletList) {
    result.push('</ul>');
  }
  
  html = result.join('\n');
  
  // Bold: **text** → <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic: *text* → <em>text</em> (but not if it's part of **bold** or in code)
  html = html.replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  
  // Inline code: `code` → <code>code</code>
  // (Code blocks already processed, so this only matches inline code)
  html = html.replace(/`([^`\n]+?)`/g, '<code>$1</code>');
  
  // Line breaks: \n\n → <br><br> (paragraph break)
  html = html.replace(/\n\n/g, '<br><br>');
  // Single line breaks: \n → <br>
  html = html.replace(/\n/g, '<br>');
  
  return html;
}

// ===== Chat Functionality =====
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = userInput.value.trim();
  if (!message || isLoading) return;

  // Add user message
  addMessage(message, "user");
  userInput.value = "";
  isLoading = true;
  showLoading();

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    hideLoading();

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      showToast(
        `Error: ${error.detail || "Failed to get response from server"}`,
        "error"
      );
      addMessage(
        "⚠️ Sorry, I couldn't process your request. Please try again.",
        "bot"
      );
      isLoading = false;
      return;
    }

    const data = await response.json();
    addMessage(data.answer, "bot");

    // Optionally show source chunks (if you want to display them)
    if (data.source_chunks && data.source_chunks.length > 0) {
      const sourceInfo = `📚 Sources: ${data.source_chunks.length} relevant sections found`;
      addMessage(sourceInfo, "bot", true);
    }
  } catch (err) {
    hideLoading();
    console.error("Error:", err);
    showToast("Network error: Cannot connect to backend", "error");
    addMessage(
      "❌ Connection error. Please ensure:\n1. Backend is running (`python app.py`)\n2. You're accessing via localhost:8000 or similar\n3. Check CORS is enabled",
      "bot"
    );
  }

  isLoading = false;
});

function addMessage(content, role, isInfo = false) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");

  const avatar = document.createElement("div");
  avatar.classList.add("message-avatar");
  avatar.textContent = role === "user" ? "👤" : "🤖";

  const contentDiv = document.createElement("div");
  contentDiv.classList.add("message-content");
  
  // Apply markdown formatting for bot messages
  if (role === "bot" && !isInfo) {
    contentDiv.innerHTML = formatMarkdown(content);
  } else {
    // For user messages and info messages, use plain text (escape HTML)
    contentDiv.textContent = content;
  }

  const timeSpan = document.createElement("span");
  timeSpan.classList.add("message-time");
  const now = new Date();
  timeSpan.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (role === "user") {
    messageDiv.classList.add("user-message");
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(avatar);
  } else {
    messageDiv.classList.add("bot-message");
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
  }

  if (isInfo) {
    contentDiv.style.fontSize = "0.85rem";
    contentDiv.style.fontStyle = "italic";
    contentDiv.style.opacity = "0.8";
  }

  messageDiv.appendChild(timeSpan);
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Quick suggestion buttons
document.querySelectorAll(".suggestion-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const question = btn.getAttribute("data-question");
    userInput.value = question;
    userInput.focus();
  });
});

// ===== FAQ Functionality =====
async function loadFAQData() {
  if (faqData) {
    renderFAQ();
    return;
  }

  try {
    // Try to load faq_data.json from the same folder
    const response = await fetch("faq_data.json");
    if (!response.ok) throw new Error("FAQ data not found");
    faqData = await response.json();
    renderFAQ();
  } catch (err) {
    console.error("Error loading FAQ data:", err);
    faqContainer.innerHTML =
      '<p style="color: #cbd5e1; text-align: center;">⚠️ FAQ data could not be loaded. Make sure <code>faq_data.json</code> is in the same folder as this file.</p>';
  }
}

function renderFAQ() {
  faqContainer.innerHTML = "";

  if (!faqData || !faqData.categories) {
    faqContainer.innerHTML = "<p>No FAQ data available</p>";
    return;
  }

  faqData.categories.forEach((category) => {
    const categoryDiv = document.createElement("div");
    categoryDiv.classList.add("faq-category");

    const categoryTitle = document.createElement("h3");
    categoryTitle.textContent = category.name;
    categoryDiv.appendChild(categoryTitle);

    category.faqs.forEach((faq) => {
      const itemDiv = document.createElement("div");
      itemDiv.classList.add("faq-item", `severity-${faq.severity}`);

      const questionDiv = document.createElement("div");
      questionDiv.classList.add("faq-question");

      const toggle = document.createElement("span");
      toggle.classList.add("faq-toggle");
      toggle.textContent = "▶";

      const questionText = document.createElement("span");
      questionText.textContent = faq.question;

      questionDiv.appendChild(toggle);
      questionDiv.appendChild(questionText);

      const answerDiv = document.createElement("div");
      answerDiv.classList.add("faq-answer");
      answerDiv.innerHTML = faq.answer;

      // Toggle answer visibility
      questionDiv.addEventListener("click", () => {
        const isOpen = questionDiv.classList.contains("open");
        questionDiv.classList.toggle("open");
        answerDiv.classList.toggle("show");
      });

      itemDiv.appendChild(questionDiv);
      itemDiv.appendChild(answerDiv);
      categoryDiv.appendChild(itemDiv);
    });

    faqContainer.appendChild(categoryDiv);
  });
}

// ===== Health Check Functionality =====
async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) throw new Error("Health check failed");

    const data = await response.json();
    showHealthStatus(data, true);
  } catch (err) {
    console.error("Health check error:", err);
    showHealthStatus({}, false);
  }
}

function showHealthStatus(data, isHealthy) {
  healthStatus.innerHTML = "";

  const statusCard = document.createElement("div");
  statusCard.classList.add("status-card");

  if (isHealthy) {
    statusCard.classList.add("success");
    statusCard.innerHTML = `
      <div class="status-icon">✅</div>
      <h3>System Online</h3>
      <p class="status-text">Backend is running and responding normally</p>
    `;
  } else {
    statusCard.classList.add("error");
    statusCard.innerHTML = `
      <div class="status-icon">❌</div>
      <h3>Connection Failed</h3>
      <p class="status-text">Cannot connect to backend server</p>
    `;
  }

  healthStatus.appendChild(statusCard);

  // Populate details
  healthDetails.innerHTML = "";

  if (isHealthy) {
    const statusItem = (label, value) => {
      const div = document.createElement("div");
      div.classList.add("detail-item");
      div.innerHTML = `
        <div class="detail-label">${label}</div>
        <div class="detail-value">${value}</div>
      `;
      return div;
    };

    healthDetails.appendChild(statusItem("Vector Store", data.vector_store_ready ? "✅ Ready" : "⚠️ Not Ready"));
    healthDetails.appendChild(statusItem("Chunks Loaded", data.chunks_loaded || 0));
    healthDetails.appendChild(statusItem("Backend URL", API_BASE_URL));
    healthDetails.appendChild(
      statusItem("Last Check", new Date().toLocaleTimeString())
    );
  } else {
    const errorDiv = document.createElement("div");
    errorDiv.classList.add("detail-item");
    errorDiv.innerHTML = `
      <div class="detail-label">Troubleshooting</div>
      <div class="detail-value">
        1. Ensure backend is running<br>
        2. Check port 8000 is available<br>
        3. Verify CORS is enabled
      </div>
    `;
    healthDetails.appendChild(errorDiv);
  }
}

// ===== Utility Functions =====
function showLoading() {
  loadingIndicator.classList.remove("hidden");
}

function hideLoading() {
  loadingIndicator.classList.add("hidden");
}

function showToast(message, type = "info") {
  toast.textContent = message;
  toast.classList.remove("hidden", "success", "error");
  toast.classList.add(type);

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 4000);
}

// ===== Initialization =====
document.addEventListener("DOMContentLoaded", () => {
  // Set chat tab as active by default
  chatTab.classList.add("active");

  // Initial health check
  checkHealth();

  // Setup periodic health checks (optional)
  // healthCheckInterval = setInterval(checkHealth, HEALTH_CHECK_INTERVAL);
});

// ===== Cleanup =====
window.addEventListener("beforeunload", () => {
  if (healthCheckInterval) clearInterval(healthCheckInterval);
});

// Focus on input when page loads
userInput.focus();
