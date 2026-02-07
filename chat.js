// ChatGPT-like Chat Interface with Improvements
// - Loading indicators with spinner animation
// - Message history with context
// - Better error handling
// - Timestamps and visual separation
// - System instructions for consistent bot personality
// - Prevents empty inputs

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('.main-search-input');
  const searchButton = Array.from(document.querySelectorAll('.main-search-option')).find(btn => btn.textContent.includes('Search'));

  if (!searchInput) return;

  // Conversation history for context (last 10 messages)
  let conversationHistory = [];
  const MAX_HISTORY = 10;

  // System message to define bot personality
  const SYSTEM_MESSAGE = {
    role: 'system',
    content: 'You are a helpful, friendly, and knowledgeable AI assistant. Provide clear, concise, and helpful responses. Use emojis occasionally to make responses more engaging. Be conversational and approachable.'
  };

  // Create chat container if it doesn't exist
  let chatContainer = document.getElementById('ai-chat-container');
  if (!chatContainer) {
    chatContainer = document.createElement('div');
    chatContainer.id = 'ai-chat-container';
    chatContainer.style.border = '1px solid rgba(102, 126, 234, 0.3)';
    chatContainer.style.borderRadius = '12px';
    chatContainer.style.padding = '16px';
    chatContainer.style.marginTop = '16px';
    chatContainer.style.maxHeight = '500px';
    chatContainer.style.overflow = 'auto';
    chatContainer.style.background = 'rgba(255, 255, 255, 0.95)';
    chatContainer.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
    chatContainer.style.backdropFilter = 'blur(10px)';
    searchInput.parentNode.insertBefore(chatContainer, searchInput.nextSibling);
  }

  // Handle Enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage(searchInput.value);
    }
  });

  // Handle search button
  if (searchButton) {
    searchButton.addEventListener('click', (e) => {
      e.preventDefault();
      sendMessage(searchInput.value);
    });
  }

  // Get current timestamp
  function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  // Create spinner animation for loading indicator
  function createSpinner() {
    const spinner = document.createElement('div');
    spinner.style.width = '20px';
    spinner.style.height = '20px';
    spinner.style.border = '3px solid rgba(0, 102, 195, 0.2)';
    spinner.style.borderTop = '3px solid #0066C3';
    spinner.style.borderRadius = '50%';
    spinner.style.animation = 'spin 0.8s linear infinite';
    spinner.style.display = 'inline-block';
    spinner.style.marginRight = '8px';
    return spinner;
  }

  // Add CSS for spinner animation if not already present
  if (!document.getElementById('spinner-style')) {
    const style = document.createElement('style');
    style.id = 'spinner-style';
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // Append message bubble with timestamp and visual separation
  function appendMessage(role, text) {
    const wrapper = document.createElement('div');
    wrapper.style.margin = '12px 0';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = role === 'user' ? 'flex-end' : 'flex-start';

    // Timestamp
    const timestamp = document.createElement('small');
    timestamp.style.fontSize = '11px';
    timestamp.style.color = '#999';
    timestamp.style.marginBottom = '4px';
    timestamp.style.marginRight = role === 'user' ? '0' : '0';
    timestamp.style.marginLeft = role === 'user' ? '0' : '0';
    timestamp.textContent = getTimestamp();

    // Message bubble
    const bubble = document.createElement('div');
    bubble.textContent = text;
    bubble.style.display = 'inline-block';
    bubble.style.padding = '12px 16px';
    bubble.style.borderRadius = '16px';
    bubble.style.maxWidth = '85%';
    bubble.style.whiteSpace = 'pre-wrap';
    bubble.style.wordWrap = 'break-word';
    bubble.style.lineHeight = '1.5';
    bubble.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';

    if (role === 'user') {
      bubble.style.background = 'linear-gradient(135deg, #0066C3 0%, #0052a3 100%)';
      bubble.style.color = '#fff';
      bubble.style.borderBottomRightRadius = '4px';
    } else if (role === 'assistant') {
      bubble.style.background = '#e9eef7';
      bubble.style.color = '#1a1a1a';
      bubble.style.borderBottomLeftRadius = '4px';
    } else if (role === 'error') {
      bubble.style.background = 'rgba(220, 53, 69, 0.1)';
      bubble.style.color = '#721c24';
      bubble.style.borderLeft = '4px solid #dc3545';
      bubble.style.paddingLeft = '12px';
    }

    wrapper.appendChild(timestamp);
    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return { wrapper, bubble };
  }

  // Disable/enable input during loading
  function setLoading(isLoading) {
    searchInput.disabled = isLoading;
    if (searchButton) searchButton.disabled = isLoading;
    searchInput.style.opacity = isLoading ? '0.6' : '1';
  }

  // Send message to Python backend
  async function sendMessage(query) {
    // Validate input
    if (!query || !query.trim()) {
      appendMessage('error', '⚠️ Please enter a message before sending.');
      return;
    }

    const trimmedQuery = query.trim();

    // Add user message to history and UI
    appendMessage('user', trimmedQuery);
    conversationHistory.push({ role: 'user', content: trimmedQuery });

    // Trim history if it exceeds max length
    if (conversationHistory.length > MAX_HISTORY) {
      conversationHistory = conversationHistory.slice(-MAX_HISTORY);
    }

    searchInput.value = '';
    setLoading(true);

    // Show loading indicator with spinner
    const { wrapper: typingWrapper, bubble: typingBubble } = appendMessage('assistant', '');
    const spinner = createSpinner();
    typingBubble.appendChild(spinner);
    const typingText = document.createElement('span');
    typingText.textContent = 'AI is thinking...';
    typingBubble.appendChild(typingText);

    try {
      // Build messages array with system instruction and conversation history
      const messagesPayload = [
        SYSTEM_MESSAGE,
        ...conversationHistory
      ];

      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesPayload,
          model: 'mixtral-8x7b-32768',
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        let errorMessage = `Server Error (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Continue with default error message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const reply = data.reply || 'No response received';

      // Add bot message to history
      conversationHistory.push({ role: 'assistant', content: reply });
      if (conversationHistory.length > MAX_HISTORY) {
        conversationHistory = conversationHistory.slice(-MAX_HISTORY);
      }

      // Replace loading indicator with actual response
      typingBubble.innerHTML = '';
      typingBubble.textContent = reply;
      typingBubble.style.background = '#e9eef7';
      typingBubble.style.color = '#1a1a1a';
      typingBubble.style.borderLeft = 'none';
      chatContainer.scrollTop = chatContainer.scrollHeight;

    } catch (err) {
      // Clear loading indicator and show error
      typingBubble.innerHTML = '';
      const errorMessage = `🚨 Oops! Something went wrong — ${err.message || 'Please try again.'}`;
      typingBubble.textContent = errorMessage;
      typingBubble.style.background = 'rgba(220, 53, 69, 0.1)';
      typingBubble.style.color = '#721c24';
      typingBubble.style.borderLeft = '4px solid #dc3545';
      typingBubble.style.paddingLeft = '12px';
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  }
});
