const ipInput = document.getElementById("ip-input") as HTMLInputElement;
const portInput = document.getElementById("port-input") as HTMLInputElement;
const peerList = document.getElementById("peers") as HTMLUListElement;
const addPeerBtn = document.getElementById("add-peer-btn") as HTMLButtonElement;
const startChatBtn = document.getElementById(
  "start-chat-btn"
) as HTMLButtonElement;
const connectScreen = document.getElementById("connect-screen") as HTMLElement;
const chatScreen = document.getElementById("chat-screen") as HTMLElement;
const chatMessages = document.getElementById("chat-messages") as HTMLElement;
const sendBtn = document.getElementById("send-btn") as HTMLButtonElement;
const messageInput = document.getElementById(
  "message-input"
) as HTMLInputElement;

addPeerBtn.addEventListener("click", () => {
  const ip = ipInput.value.trim();
  const port = parseInt(portInput.value.trim(), 10);

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

startChatBtn.addEventListener("click", () => {
  console.log("asdsdadsa");
  console.log(connectScreen);
  console.log(chatScreen);
  connectScreen.classList.add("d-none");
  chatScreen.classList.remove("d-none");
});

window.electronAPI.onMessage((message: string) => {
  const div = document.createElement("div");
  div.classList.add("mb-2");
  div.innerHTML = `<div class="p-2 bg-light border rounded"><strong>Peer:</strong> ${message}</div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

sendBtn.addEventListener("click", () => {
  const message = messageInput.value.trim();
  if (message !== "") {
    window.electronAPI.sendMessage(message);

    const div = document.createElement("div");
    div.classList.add("mb-2", "text-end");
    div.innerHTML = `<div class="p-2 bg-primary text-white border rounded">${message}</div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    messageInput.value = "";
  }
});

messageInput.addEventListener("keypress", (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});
