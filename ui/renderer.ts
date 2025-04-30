// DOM refs
const ipInput = document.getElementById("ip-input") as HTMLInputElement;
const portInput = document.getElementById("port-input") as HTMLInputElement;
const peerList = document.getElementById("peers") as HTMLUListElement;
const addPeerBtn = document.getElementById("add-peer-btn") as HTMLButtonElement;
const startChatBtn = document.getElementById("start-chat-btn") as HTMLButtonElement;
const connectScreen = document.getElementById("connect-screen")!;
const chatScreen = document.getElementById("chat-screen")!;
const chatMessages = document.getElementById("chat-messages")!;
const sendBtn = document.getElementById("send-btn") as HTMLButtonElement;
const messageInput = document.getElementById("message-input") as HTMLInputElement;

const fileInput = document.getElementById("file-input") as HTMLInputElement;
const sendFileBtn = document.getElementById("send-file-btn") as HTMLButtonElement;

sendFileBtn.addEventListener("click", async () => {
  const filePath = await window.electronAPI.openFileDialog();
  console.log("📤 selected file path:", filePath);
  if (!filePath) return;   // user canceled
  window.electronAPI.sendFile(filePath);
});

// 2) FILE RECEIVE (unchanged)  
window.electronAPI.onFileReceived((savePath) => {
  console.log("📥 file-received:", savePath);
  const div = document.createElement("div");
  div.classList.add("mb-2");
  const link = document.createElement("a");
  link.href = `file://${savePath}`;
  link.textContent = `📁 ${savePath}`;
  link.target = "_blank";
  div.appendChild(link);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Display received file link
window.electronAPI.onFileReceived((savePath) => {
  const div = document.createElement("div");
  div.classList.add("mb-2");
  const a = document.createElement("a");
  a.href = `file://${savePath}`;
  a.textContent = `📁 ${savePath}`;
  a.target = "_blank";
  div.appendChild(a);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
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
