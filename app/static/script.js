// Local conversation state for multi-turn context
let chatHistory = [
  {
    role: "system",
    content: "You are a helpful, precise local AI assistant running on Apple Silicon."
  }
];

document.addEventListener("DOMContentLoaded", () => {
  const chatForm = document.getElementById("chat-form");
  const userInput = document.getElementById("user-input");
  const chatMessages = document.getElementById("chat-messages");
  const clearBtn = document.getElementById("clear-btn");

  // Handle form submission (or Enter key press)
  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      sendMessage();
    });
  }

  // Handle optional 'Clear Chat' button
  if (clearBtn) {
    clearBtn.addEventListener("click", clearChat);
  }

  /**
   * Sends the prompt and full chat history to the Flask backend
   */
  async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // 1. Add user message to history and render in UI
    chatHistory.push({ role: "user", content: text });
    appendMessage("user", text);

    userInput.value = "";
    userInput.disabled = true;

    // 2. Render temporary loading element for the response
    const loadingElement = appendMessage("assistant", "Thinking...");
    loadingElement.classList.add("loading");

    try {
      // 3. Post full conversation array to local Flask endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages: chatHistory })
      });

      const data = await response.json();
      loadingElement.classList.remove("loading");

      // Handle backend/Ollama errors
      if (!response.ok || data.error) {
        const errorText = data.error || `HTTP ${response.status} Error`;
        loadingElement.textContent = `[Error]: ${errorText}`;
        loadingElement.classList.add("error-message");
        // Remove unfulfilled user turn on failure so history remains clean
        chatHistory.pop();
        return;
      }

      // 4. Safely extract reply from Ollama /api/chat payload
      const assistantReply = data.message?.content || data.response || "No response returned.";

      // Update response bubble content
      loadingElement.textContent = assistantReply;

      // 5. Save assistant response into local context memory
      chatHistory.push({ role: "assistant", content: assistantReply });

    } catch (err) {
      loadingElement.classList.remove("loading");
      loadingElement.classList.add("error-message");
      loadingElement.textContent = `[Network Error]: ${err.message}`;
      chatHistory.pop();
    } finally {
      userInput.disabled = false;
      userInput.focus();
      scrollToBottom();
    }
  }

  /**
   * Appends a message bubble to the chat container
   * @param {string} role - "user", "assistant", or "system"
   * @param {string} text - Message body
   * @returns {HTMLElement} Content container element
   */
  function appendMessage(role, text) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", `message-${role}`);

    const contentDiv = document.createElement("div");
    contentDiv.classList.add("message-content");
    contentDiv.textContent = text;

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();

    return contentDiv;
  }

  /**
   * Auto-scrolls the chat window to the newest message
   */
  function scrollToBottom() {
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  /**
   * Resets local context history and UI
   */
  function clearChat() {
    chatHistory = [
      {
        role: "system",
        content: "You are a helpful, precise local AI assistant running on Apple Silicon."
      }
    ];
    if (chatMessages) {
      chatMessages.innerHTML = "";
    }
    appendMessage("system", "Conversation memory cleared.");
  }
});