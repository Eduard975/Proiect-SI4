// DOM refs
const ipInput = document.getElementById("ip-input") as HTMLInputElement;
const portInput = document.getElementById("port-input") as HTMLInputElement;
const peerList = document.getElementById("peers") as HTMLUListElement;
const addPeerBtn = document.getElementById("add-peer-btn") as HTMLButtonElement;
const startChatBtn = document.getElementById(
  "start-chat-btn"
) as HTMLButtonElement;
const connectScreen = document.getElementById("connect-screen")!;
const chatScreen = document.getElementById("chat-screen")!;
const chatMessages = document.getElementById("chat-messages")!;
const sendBtn = document.getElementById("send-btn") as HTMLButtonElement;
const messageInput = document.getElementById(
  "message-input"
) as HTMLInputElement;

const fileInput = document.getElementById("file-input") as HTMLInputElement;
const sendFileBtn = document.getElementById(
  "send-file-btn"
) as HTMLButtonElement;

// Helper function to display files in chat
function displayFileInChat(filePath: string, type: "sent" | "received") {
  const filename = filePath.split(/[/\\]/).pop() || filePath; // Get filename from path
  const div = document.createElement("div");
  div.classList.add("mb-2");

  if (type === "sent") {
    div.className = "mb-2 text-end";
    div.innerHTML = `<div class="p-2 bg-success text-white rounded">📎 You sent: ${filename}</div>`;
  } else {
    div.className = "mb-2";
    const link = document.createElement("a");
    link.href = `file://${filePath}`;
    link.textContent = `📁 Received: ${filename}`;
    link.target = "_blank";
    link.className = "text-decoration-none";

    const fileDiv = document.createElement("div");
    fileDiv.className = "p-2 bg-light rounded";
    fileDiv.appendChild(link);
    div.appendChild(fileDiv);
  }

  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// File sending
sendFileBtn.addEventListener("click", async () => {
  const filePath = await window.electronAPI.openFileDialog();
  console.log("📤 selected file path:", filePath);
  if (!filePath) return; // user canceled
  window.electronAPI.sendFile(filePath);
});

// Handle sent files (NEW)
window.electronAPI.onFileSent((filePath: string) => {
  console.log("📤 file-sent:", filePath);
  displayFileInChat(filePath, "sent");
});

// Handle received files (UPDATED - removed duplicate)
window.electronAPI.onFileReceived((savePath) => {
  console.log("📥 file-received:", savePath);
  displayFileInChat(savePath, "received");
});

// Peers
addPeerBtn.addEventListener("click", () => {
  const ip = ipInput.value.trim();
  const port = +portInput.value;
  if (ip && !isNaN(port)) {
    window.electronAPI.addPeer(ip, port);
    const li = document.createElement("li");
    li.classList.add("list-group-item");
    li.textContent = `${ip}:${port}`;
    peerList.appendChild(li);
    ipInput.value = "";
    portInput.value = "7070";
  }
});

// Toggle screens
startChatBtn.addEventListener("click", () => {
  connectScreen.classList.add("d-none");
  chatScreen.classList.remove("d-none");
});

// Text messages
sendBtn.addEventListener("click", () => {
  const txt = messageInput.value.trim();
  if (txt) {
    window.electronAPI.sendMessage(txt);
    const div = document.createElement("div");
    div.className = "mb-2 text-end";
    div.innerHTML = `<div class="p-2 bg-primary text-white rounded">${txt}</div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    messageInput.value = "";
  }
});
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});

// Incoming text
window.electronAPI.onMessage((msg) => {
  const div = document.createElement("div");
  div.className = "mb-2";
  div.innerHTML = `<div class="p-2 bg-light rounded"><strong>Peer:</strong> ${msg}</div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});
