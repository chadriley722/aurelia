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

        let finalMessage = '';
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                // Attempt to parse the complete aiText as JSON only when the stream is done
                try {
                    const jsonResponse = JSON.parse(aiText);
                    // Assuming the actual message is in a structure like response.choices[0].message.content or similar
                    // Adjust this path based on the actual API response structure
                    if (jsonResponse && jsonResponse.content && jsonResponse.content[0] && jsonResponse.content[0].text && jsonResponse.content[0].text.value) {
                        finalMessage = jsonResponse.content[0].text.value;
                    } else if (jsonResponse && jsonResponse.message) { // A simpler structure perhaps
                        finalMessage = jsonResponse.message;
                    } else {
                        // If the expected structure is not found, it might be raw text or an unexpected JSON
                        // For now, let's assume if it's not the expected JSON, it might be a direct string message or an error string
                        finalMessage = aiText; // Or handle as an error/unexpected format
                    }
                } catch (e) {
                    // If JSON parsing fails, it might be a plain text stream or an error message not in JSON format.
                    // Or it could be an incomplete JSON stream if the connection broke unexpectedly.
                    console.error('Failed to parse AI response as JSON:', e);
                    finalMessage = aiText; // Fallback to displaying raw text if parsing fails
                }
                break;
            }
            aiText += decoder.decode(value);
            // Optionally, update with streaming text if desired, or wait for final message
            // For now, we'll just accumulate and parse at the end to get the final message.
        }
        updateAssistant(finalMessage, false); // Pass false for isError

    } catch (error) {
        console.error('Error:', error);
        updateAssistant('Aurelia is in silent reflection. Please try again later ✨', true); // Pass true for isError
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

function updateAssistant(text, isError = false) {
    let div = box.querySelector('div[data-role="assistant"]:last-child');
    if (!div) {
        div = document.createElement('div');
        div.className = 'text-left my-2';
        div.dataset.role = 'assistant';
        box.appendChild(div);
    }
    if (isError) {
        div.innerHTML = `<p class="text-red-400">${text}</p>`; // Style error messages differently
    } else {
        // For simplicity, assuming 'text' is plain text from Aurelia.
        // If 'text' can contain HTML from Aurelia, ensure it's sanitized or safely handled.
        div.textContent = text;
    }
    box.scrollTop = box.scrollHeight;
}
