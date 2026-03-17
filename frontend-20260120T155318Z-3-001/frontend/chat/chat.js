const chatBtn = document.getElementById("aiChatButton");
const chatWindow = document.getElementById("aiChatWindow");
const chatClose = document.getElementById("aiChatClose");
const chatInput = document.getElementById("aiChatInput");
const chatMessages = document.getElementById("aiChatMessages");
const chatSend = document.getElementById("aiChatSend");

chatBtn.onclick = () => {
    chatWindow.style.display = "flex";
};

chatClose.onclick = () => {
    chatWindow.style.display = "none";
};

chatSend.onclick = sendMessage;
chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

function addMessage(text, type) {
    const msg = document.createElement("div");
    msg.className = "message " + type;
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const msg = chatInput.value.trim();
    if (!msg) return;

    addMessage(msg, "userMsg");
    chatInput.value = "";

    addMessage("🤖 Typing...", "aiMsg");

    const token = localStorage.getItem("token");

    const response = await fetch("http://localhost:8000/chat/ask", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ message: msg })
    });

    let data = await response.json();

    // Remove typing message
    chatMessages.lastChild.remove();

    addMessage(data.reply, "aiMsg");
}
