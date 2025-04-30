import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  addPeer: (ip: string, port: number): void => {
    ipcRenderer.send("add-peer", { ip, port });
  },

  sendMessage: (msg: string): void => {
    ipcRenderer.send("send-message", msg);
  },

  onMessage: (cb: (msg: string) => void): void => {
    // wrap in a block so we don't implicitly return the IpcRenderer
    ipcRenderer.on("message-received", (_evt, msg: string) => {
      cb(msg);
    });
  },

  sendFile: (filePath: string): void => {
    ipcRenderer.send("send-file", filePath);
  },
  
  openFileDialog: (): Promise<string | null> => {
    return ipcRenderer.invoke("dialog:open-file");
  },


  onFileReceived: (cb: (savePath: string) => void): void => {
    ipcRenderer.on("file-received", (_evt, savePath: string) => {
      cb(savePath);
    });
  },
});
