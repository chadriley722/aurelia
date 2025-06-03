const ENDPOINT = 'https://aurelia-ecru.vercel.app/api/chat';
let threadId = null;
let currentAssistantMessage = '';
let currentMessageId = null;

const box = document.getElementById('chat-box');
const input = document.getElementById('chat-input');
const send = document.getElementById('chat-send');

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (send) send.addEventListener('click', submit);
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submit();
        });
    }
});

async function submit() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    // Add user message to chat
    append('user', text);
    
    // Reset for new assistant message
    currentAssistantMessage = '';
    currentMessageId = null;
    const assistantDiv = createAssistantDiv();
    
    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, threadId }),
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                if (!line.trim()) continue;
                
                try {
                    const eventData = JSON.parse(line);
                    
                    // Handle errors
                    if (eventData.error || eventData.last_error) {
                        throw new Error(eventData.error?.message || JSON.stringify(eventData.last_error));
                    }
                    
                    // Handle message delta (streaming)
                    if (eventData.event === 'thread.message.delta' && eventData.data?.delta?.content?.[0]?.text?.value) {
                        currentMessageId = eventData.data.id;
                        currentAssistantMessage += eventData.data.delta.content[0].text.value;
                        updateAssistantDiv(assistantDiv, currentAssistantMessage, false);
                    }
                    // Handle completed message (non-streaming or final chunk)
                    else if (eventData.event === 'thread.message.completed' || 
                             (eventData.data?.content?.[0]?.text?.value && !eventData.event)) {
                        const message = eventData.data?.content?.[0]?.text?.value || '';
                        if (message) {
                            currentAssistantMessage = message;
                            updateAssistantDiv(assistantDiv, currentAssistantMessage, false);
                        }
                    }
                    // Handle thread ID for future messages
                    if (eventData.thread_id) {
                        threadId = eventData.thread_id;
                    }
                } catch (e) {
                    console.error('Error parsing message:', e);
                    // Continue processing other lines even if one fails
                }
            }
        }
        
        // Process any remaining buffer
        if (buffer.trim()) {
            try {
                const eventData = JSON.parse(buffer);
                if (eventData.message?.content?.[0]?.text?.value) {
                    currentAssistantMessage = eventData.message.content[0].text.value;
                    updateAssistantDiv(assistantDiv, currentAssistantMessage, false);
                }
            } catch (e) {
                console.error('Error parsing final buffer:', e);
            }
        }
        
    } catch (error) {
        console.error('Error in chat submission:', error);
        updateAssistantDiv(assistantDiv, 'Aurelia is in silent reflection. Please try again later ✨', true);
    } finally {
        // If we have an incomplete message, make sure it's displayed
        if (assistantDiv.textContent.trim() === '') {
            updateAssistantDiv(assistantDiv, currentAssistantMessage || 'Aurelia is in silent reflection. Please try again later ✨', !currentAssistantMessage);
        }
    }
}

function append(role, text) {
    const div = document.createElement('div');
    div.className = `${role === 'user' ? 'text-right' : 'text-left'} my-2`;
    div.dataset.role = role;
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function createAssistantDiv() {
    const div = document.createElement('div');
    div.className = 'text-left my-2';
    div.dataset.role = 'assistant';
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return div;
}

function updateAssistantDiv(div, text, isError = false) {
    if (isError) {
        div.innerHTML = `<p class="text-red-400">${text}</p>`;
    } else {
        // Simple text content for now - could be enhanced with markdown or other formatting
        div.textContent = text;
    }
    box.scrollTop = box.scrollHeight;
}
