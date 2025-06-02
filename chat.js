// Initialize chat functionality when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');
    const ENDPOINT = '/api/chat';
    let currentThreadId = null;

    // Add a message to the chat UI
    function addMessage(role, content) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${role}`;
        messageElement.textContent = content;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Handle form submission
    async function handleSubmit(e) {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (!message) return;

        // Add user message to UI
        addMessage('user', message);
        messageInput.value = '';

        // Add loading indicator
        const loadingElement = document.createElement('div');
        loadingElement.className = 'message assistant loading';
        loadingElement.textContent = 'Aurelia is thinking...';
        chatMessages.appendChild(loadingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const response = await fetch(ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    threadId: currentThreadId
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            // Remove loading indicator
            chatMessages.removeChild(loadingElement);

            // Process streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim() !== '');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.replace(/^data: /, '');
                        if (data === '[DONE]') continue;
                        
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.event === 'thread.message.delta' && parsed.data.delta.content) {
                                const content = parsed.data.delta.content[0]?.text?.value || '';
                                if (content) {
                                    assistantMessage += content;
                                    updateOrCreateAssistantMessage(assistantMessage);
                                }
                            }
                        } catch (e) {
                            console.error('Error parsing stream data:', e);
                        }
                    }
                }
            }

            // Save thread ID for future messages
            if (!currentThreadId) {
                // In a real implementation, you'd extract thread ID from the response
                // For now, we'll just set a placeholder
                currentThreadId = 'thread_' + Date.now();
            }

        } catch (error) {
            console.error('Error:', error);
            // Remove loading indicator
            if (chatMessages.contains(loadingElement)) {
                chatMessages.removeChild(loadingElement);
            }
            addMessage('error', 'Aurelia is unavailable, please try later.');
        }
    }

    // Update or create assistant message
    function updateOrCreateAssistantMessage(content) {
        let messageElement = document.querySelector('.message.assistant:not(.loading)');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.className = 'message assistant';
            chatMessages.appendChild(messageElement);
        }
        messageElement.textContent = content;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Event listeners
    if (chatForm && messageInput) {
        chatForm.addEventListener('submit', handleSubmit);
        
        // Optional: Allow sending message with Shift+Enter for new line, Enter to send
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
            }
        });
    }
});
