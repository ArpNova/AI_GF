// DOM
const micBtn = document.getElementById("mic-btn");
const chatbox = document.getElementById("chatbox");
const statusEl = document.getElementById("status");
const speakingText = document.getElementById("speaking-text");

// Session ID (persist per browser)
function getSessionId() {
  const KEY = "paro-session-id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
const SESSION_ID = getSessionId();

// Helpers
function addBubble(text, type) {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${type}`;
  bubble.innerText = text;
  chatbox.appendChild(bubble);
  chatbox.scrollTop = chatbox.scrollHeight;
}

// Backend base
const BASE = "https://ai-gf-yd62.onrender.com"; // change if your backend runs elsewhere

// Call chat backend (Gemini via server)
async function chatRequest(message) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId: SESSION_ID })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chat error: ${err}`);
  }
  return await res.json();
}

// Call TTS backend (ElevenLabs via server)
// async function ttsRequest(text) {
//   const res = await fetch(`${BASE}/api/tts`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ text })
//   });
//   if (!res.ok) {
//     const err = await res.text();
//     throw new Error(`TTS error: ${err}`);
//   }
//   const blob = await res.blob();
//   const url = URL.createObjectURL(blob);
//   const audio = new Audio(url);
//   await new Promise(resolve => {
//     audio.onended = resolve;
//     audio.play();
//   });
//   URL.revokeObjectURL(url);
// }

// Speech recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  statusEl.innerText = "Sorry, your browser doesn't support speech recognition.";
  micBtn.disabled = true;
} else {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  micBtn.addEventListener("click", () => {
    statusEl.innerText = "Listening...";
    recognition.start();
  });

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    addBubble(transcript, "user");
    statusEl.innerText = "Thinking...";

    try {
      const { reply } = await chatRequest(transcript);
      speakingText.innerText = reply;
      addBubble(reply, "bot");

      // Speak it
      await ttsRequest(reply);
    } catch (e) {
      console.error(e);
      // addBubble("Error: " + e.message, "bot");
    } finally {
      speakingText.innerText = "";
      statusEl.innerText = "Press mic to speak";
    }
  };

  recognition.onerror = (event) => {
    statusEl.innerText = "Speech error: " + event.error;
  };
}
