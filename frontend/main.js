const micBtn = document.getElementById("mic-btn");
const chatbox = document.getElementById("chatbox");
const statusEl = document.getElementById("status");
const speakingText = document.getElementById("speaking-text");

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

function addBubble(text, type) {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${type}`;
  bubble.innerText = text;
  chatbox.appendChild(bubble);
  chatbox.scrollTop = chatbox.scrollHeight;
}

const BASE = "https://ai-gf-yd62.onrender.com";

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

      await ttsRequest(reply);
    } catch (e) {
      console.error(e);
    } finally {
      speakingText.innerText = "";
      statusEl.innerText = "Press mic to speak";
    }
  };

  recognition.onerror = (event) => {
    statusEl.innerText = "Speech error: " + event.error;
  };
}
