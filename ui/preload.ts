import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
	onConnectionInfo: (
		callback: (event: IpcRendererEvent, message: string) => void,
	) => ipcRenderer.on("connection-info", callback),
});
