// Full Vercel URL for GitHub Pages compatibility
const ENDPOINT = 'https://aurelia-ecru.vercel.app/api/chat';
let threadId = null;

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

    append('user', text);

    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, threadId }),
        });

        if (!res.ok) throw new Error('Network response was not ok');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let aiText = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            aiText += decoder.decode(value);
            updateAssistant(aiText);
        }
    } catch (error) {
        console.error('Error:', error);
        updateAssistant('Aurelia is unavailable, please try later.');
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

function updateAssistant(text) {
    let div = box.querySelector('div[data-role="assistant"]:last-child');
    if (!div) {
        div = document.createElement('div');
        div.className = 'text-left my-2';
        div.dataset.role = 'assistant';
        box.appendChild(div);
    }
    div.textContent = text;
    box.scrollTop = box.scrollHeight;
}
