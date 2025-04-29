import { app, BrowserWindow, ipcMain } from "electron";
import { createServer, Socket } from "node:net";
import path from "node:path";

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, // important for security
      nodeIntegration: false,
    },
  });

  win.loadFile("index.html");
  win.webContents.openDevTools();
}

const server = createServer();
const clients: Socket[] = [];
const peers: { ip: string; port: number }[] = [];
const args = process.argv.slice(2);
console.log(args);

export const host = args[0];
export const port = Number(args[1]);

server.listen(port, host, () => {
  console.log(`TCP Server is running on ${host}:${port}`);
});

server.on("connection", (socket: Socket) => {
  console.log("Someone connected");
  clients.push(socket);

  socket.on("end", () => {
    console.log("Client disconnected");
    clients.splice(clients.indexOf(socket), 1);
  });

  socket.on("data", (data) => {
    const message = data.toString();
    console.log("Received:", message);

    // Forward to renderer (UI)
    if (win) {
      win.webContents.send("message-received", message);
    }
  });
});

// 🛠️ Listen to renderer requests:
ipcMain.on("add-peer", (event, { ip, port }: { ip: string; port: number }) => {
  console.log(`Adding peer ${ip}:${port}`);
  peers.push({ ip, port });
});

ipcMain.on("send-message", (event, message: string) => {
  console.log(`Sending message to peers: ${message}`);

  for (const { ip, port } of peers) {
    const client = new Socket();
    client.connect(port, ip, () => {
      client.write(message);
      client.end();
    });

    client.on("error", (err) => {
      console.error(`Could not connect to ${ip}:${port} - ${err.message}`);
    });
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
