// ========== ENHANCED AI CHAT SYSTEM ==========

const BACKEND_URL = 'http://localhost:5041';

class EnhancedChat {
    constructor() {
        this.currentConversationId = null;
        this.conversations = [];
        this.availableModels = {};
        this.isStreaming = false;
        this.currentProvider = null;
        this.init();
    }

    async init() {
        await this.loadAvailableModels();
        await this.loadConversations();
        this.setupEventListeners();
        this.loadChatConfig();
    }

    setupEventListeners() {
        // Send message button
        const sendBtn = document.getElementById('chat-send-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Message input enter key
        const messageInput = document.getElementById('chat-message-input');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // New conversation button
        const newChatBtn = document.getElementById('new-chat-btn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => this.createNewConversation());
        }

        // Export conversation button
        const exportBtn = document.getElementById('export-chat-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCurrentConversation());
        }

        // Model selector
        const modelSelect = document.getElementById('ai-model-select');
        if (modelSelect) {
            modelSelect.addEventListener('change', (e) => this.switchModel(e.target.value));
        }

        // Stream toggle
        const streamToggle = document.getElementById('stream-toggle');
        if (streamToggle) {
            streamToggle.addEventListener('change', (e) => this.toggleStreaming(e.target.checked));
        }
    }

    async loadAvailableModels() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/chat/models`);
            const data = await response.json();
            this.availableModels = data.models;
            this.populateModelSelector();
        } catch (error) {
            console.error('Error loading available models:', error);
        }
    }

    populateModelSelector() {
        const modelSelect = document.getElementById('ai-model-select');
        if (!modelSelect) return;

        modelSelect.innerHTML = '<option value="">Select Model</option>';

        // Group models by provider
        Object.keys(this.availableModels).forEach(provider => {
            if (this.availableModels[provider].length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = provider.toUpperCase();
                
                this.availableModels[provider].forEach(model => {
                    const option = document.createElement('option');
                    option.value = `${provider}:${model}`;
                    option.textContent = model;
                    optgroup.appendChild(option);
                });
                
                modelSelect.appendChild(optgroup);
            }
        });
    }

    async loadConversations() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/chat/conversations`);
            const data = await response.json();
            this.conversations = data.conversations || [];
            this.renderConversationsList();
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    renderConversationsList() {
        const conversationsList = document.getElementById('conversations-list');
        if (!conversationsList) return;

        conversationsList.innerHTML = '';

        this.conversations.forEach(conv => {
            const convElement = document.createElement('div');
            convElement.className = `conversation-item ${conv.id === this.currentConversationId ? 'active' : ''}`;
            convElement.innerHTML = `
                <div class="conversation-info" onclick="enhancedChat.loadConversation('${conv.id}')">
                    <div class="conversation-title">${conv.title}</div>
                    <div class="conversation-meta">
                        <span class="provider">${conv.provider}</span>
                        <span class="model">${conv.model}</span>
                        <span class="date">${new Date(conv.updated_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="conversation-actions">
                    <button class="btn btn-sm btn-outline-danger" onclick="enhancedChat.deleteConversation('${conv.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            conversationsList.appendChild(convElement);
        });
    }

    async createNewConversation() {
        try {
            const title = prompt('Enter conversation title (optional):') || null;
            const response = await fetch(`${BACKEND_URL}/api/chat/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });
            
            const data = await response.json();
            this.currentConversationId = data.conversation_id;
            await this.loadConversations();
            this.clearChatDisplay();
            
        } catch (error) {
            console.error('Error creating conversation:', error);
            alert('Error creating new conversation');
        }
    }

    async loadConversation(conversationId) {
        try {
            this.currentConversationId = conversationId;
            const response = await fetch(`${BACKEND_URL}/api/chat/conversations/${conversationId}`);
            const data = await response.json();
            
            this.renderConversationHistory(data.history);
            this.renderConversationsList(); // Update active state
            
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    }

    renderConversationHistory(history) {
        const chatDisplay = document.getElementById('chat-display');
        if (!chatDisplay) return;

        chatDisplay.innerHTML = '';

        history.forEach(message => {
            this.addMessageToDisplay(message.role, message.content, message.timestamp);
        });

        this.scrollToBottom();
    }

    async sendMessage() {
        const messageInput = document.getElementById('chat-message-input');
        if (!messageInput) return;

        const message = messageInput.value.trim();
        if (!message) return;

        messageInput.value = '';
        this.addMessageToDisplay('user', message);

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const requestData = {
                message: message,
                conversation_id: this.currentConversationId,
                stream: this.isStreaming
            };

            if (this.isStreaming) {
                await this.handleStreamingResponse(requestData);
            } else {
                await this.handleRegularResponse(requestData);
            }

        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessageToDisplay('assistant', 'Error: Failed to get response from AI');
        } finally {
            this.hideTypingIndicator();
        }
    }

    async handleRegularResponse(requestData) {
        const response = await fetch(`${BACKEND_URL}/api/chat/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();
        
        if (data.error) {
            this.addMessageToDisplay('assistant', `Error: ${data.error}`);
        } else {
            this.addMessageToDisplay('assistant', data.response);
            if (data.conversation_id) {
                this.currentConversationId = data.conversation_id;
                await this.loadConversations();
            }
        }
    }

    async handleStreamingResponse(requestData) {
        const response = await fetch(`${BACKEND_URL}/api/chat/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        const messageElement = this.addMessageToDisplay('assistant', '', null, true);
        const contentElement = messageElement.querySelector('.message-content');

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                contentElement.textContent += chunk;
                this.scrollToBottom();
            }
        } catch (error) {
            console.error('Streaming error:', error);
            contentElement.textContent += '\n[Error in streaming response]';
        }
    }

    addMessageToDisplay(role, content, timestamp = null, isStreaming = false) {
        const chatDisplay = document.getElementById('chat-display');
        if (!chatDisplay) return null;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${role}-message`;
        
        const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
        
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-role">${role === 'user' ? 'You' : 'AI'}</span>
                <span class="message-time">${timeStr}</span>
            </div>
            <div class="message-content">${content}</div>
            ${isStreaming ? '<div class="streaming-indicator">●</div>' : ''}
        `;

        chatDisplay.appendChild(messageElement);
        this.scrollToBottom();
        
        return messageElement;
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.style.display = 'block';
        }
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    scrollToBottom() {
        const chatDisplay = document.getElementById('chat-display');
        if (chatDisplay) {
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
        }
    }

    clearChatDisplay() {
        const chatDisplay = document.getElementById('chat-display');
        if (chatDisplay) {
            chatDisplay.innerHTML = '';
        }
    }

    async deleteConversation(conversationId) {
        if (!confirm('Are you sure you want to delete this conversation?')) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/chat/conversations/${conversationId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                if (conversationId === this.currentConversationId) {
                    this.currentConversationId = null;
                    this.clearChatDisplay();
                }
                await this.loadConversations();
            } else {
                alert('Error deleting conversation');
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
            alert('Error deleting conversation');
        }
    }

    async exportCurrentConversation() {
        if (!this.currentConversationId) {
            alert('No conversation selected');
            return;
        }

        const format = prompt('Export format (json/txt):', 'json');
        if (!format) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/chat/conversations/${this.currentConversationId}/export?format=${format}`);
            const data = await response.text();

            // Create download
            const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `conversation-${this.currentConversationId}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error exporting conversation:', error);
            alert('Error exporting conversation');
        }
    }

    async switchModel(modelString) {
        if (!modelString) return;

        const [provider, model] = modelString.split(':');
        this.currentProvider = provider;

        // Update configuration
        try {
            const response = await fetch(`${BACKEND_URL}/api/config/ai`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selected_ai_model: modelString,
                    // Include other existing config
                })
            });

            if (response.ok) {
                console.log(`Switched to ${provider}:${model}`);
            }
        } catch (error) {
            console.error('Error switching model:', error);
        }
    }

    toggleStreaming(enabled) {
        this.isStreaming = enabled;
        console.log('Streaming', enabled ? 'enabled' : 'disabled');
    }

    async loadChatConfig() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/chat/config`);
            const config = await response.json();
            
            // Update UI with current config
            const modelSelect = document.getElementById('ai-model-select');
            if (modelSelect && config.selected_ai_model) {
                modelSelect.value = config.selected_ai_model;
            }

            this.currentProvider = config.current_provider;
            
        } catch (error) {
            console.error('Error loading chat config:', error);
        }
    }
}

// Initialize Enhanced Chat
let enhancedChat;
document.addEventListener('DOMContentLoaded', function() {
    enhancedChat = new EnhancedChat();
});

// Export for global access
window.EnhancedChat = EnhancedChat;