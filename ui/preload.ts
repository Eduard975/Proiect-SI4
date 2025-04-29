import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  addPeer: (ip: string, port: number) =>
    ipcRenderer.send("add-peer", { ip, port }),
  sendMessage: (msg: string) => ipcRenderer.send("send-message", msg),
  onMessage: (callback: (message: string) => void) => {
    ipcRenderer.on("message-received", (_event, message) => callback(message));
  },
});
