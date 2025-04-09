//Initializator pt Electron
import { app, BrowserWindow } from "electron";
import { createServer } from "node:net";
import path from "node:path";

function createWindow() {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"), // optional
			// nodeIntegration: true, // Enable Node in renderer.js
		},
	});

	win.webContents.on("did-finish-load", () => {
		win.webContents.send("connection-info", `IP: ${host}, Port: ${port}`);
	});

	win.loadFile("index.html"); // your UI
}

export const host = "127.0.0.1";
export const port = 7070;

app.whenReady().then(() => {
	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
