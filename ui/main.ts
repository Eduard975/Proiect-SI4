import { app, BrowserWindow, ipcMain } from "electron";
import { createServer, Socket } from "node:net";
import path from "node:path";
import { generateKeyPair, encryptMessage, decryptMessage } from "../utils/rsa";
import { generateRandomMatrix, Matrix, transposeMatrix } from "../utils/utils";
import { encrypt } from "../utils/utils-encrypt";
import { decrypt } from "../utils/utils-decrypt";

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile("index.html");
  win.webContents.openDevTools();
}

function stringifyBigInts(obj: any): any {
  if (typeof obj === "bigint") {
    return obj.toString();
  } else if (Array.isArray(obj)) {
    return obj.map(stringifyBigInts);
  } else if (typeof obj === "object" && obj !== null) {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = stringifyBigInts(obj[key]);
    }
    return result;
  }
  return obj;
}

function parseBigInts(obj: any): any {
  if (typeof obj === "string" && /^\d+$/.test(obj)) {
    return BigInt(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(parseBigInts);
  } else if (typeof obj === "object" && obj !== null) {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = parseBigInts(obj[key]);
    }
    return result;
  }
  return obj;
}

function stringToMatrices(str: string): Matrix[] {
  const encoder = new TextEncoder();
  const bytes = Array.from(encoder.encode(str));
  const matrices: Matrix[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16);
    while (chunk.length < 16) chunk.push(0);
    matrices.push(chunk as Matrix);
  }
  return matrices;
}

function matricesToString(matrices: Matrix[]): string {
  const bytes: number[] = [];
  for (const matrix of matrices) {
    bytes.push(...matrix);
  }
  const decoder = new TextDecoder();
  return decoder.decode(new Uint8Array(bytes)).replace(/\0+$/, "");
}

let publicKey: { e: bigint; n: bigint };
let privateKey: { d: bigint; n: bigint };
let aesKey: Matrix | null = null;
let myAESKey: Matrix | null = null;

const peers = new Map<
  string,
  { socket: Socket; publicKey?: { e: bigint; n: bigint } }
>();
const clients: Socket[] = [];

const args = process.argv.slice(2);
export const host = args[0];
export const port = Number(args[1]);

generateKeyPair(9).then((keys) => {
  publicKey = keys.publicKey;
  privateKey = keys.privateKey;
  console.log(`Public key: ${JSON.stringify(stringifyBigInts(publicKey))}`);
  console.log(`Private key: ${JSON.stringify(stringifyBigInts(privateKey))}`);
  if (host === "127.0.0.1") {
    aesKey = generateRandomMatrix(16);
    console.log("Generated AES key:", aesKey);
    myAESKey = aesKey;
  }
});

const server = createServer();

server.listen(port, host, () => {
  console.log(`TCP Server is running on ${host}:${port}`);
});

server.on("connection", (socket: Socket) => {
  console.log("Someone connected");
  clients.push(socket);

  const keyMessage = JSON.stringify({
    type: "public-key",
    key: stringifyBigInts(publicKey),
  });
  socket.write(keyMessage);

  socket.on("data", (data) => {
    const message = data.toString();
    try {
      const parsed = JSON.parse(message);

      if (parsed.type === "public-key" && parsed.key) {
        const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
        const peerKey = parseBigInts(parsed.key);
        peers.set(remoteAddress, { socket, publicKey: peerKey });
        console.log(`Received public key from ${remoteAddress}:`, peerKey);
      } else if (parsed.type === "aes-key") {
        const decrypted = decryptMessage(parsed.data.map(BigInt), privateKey);
        myAESKey = decrypted.split(",").map((s) => parseInt(s)) as Matrix;
        console.log(`Received and decrypted AES key:`, myAESKey);
        aesKey = myAESKey;
      } else if (parsed.type === "message") {
        if (!myAESKey) {
          console.warn("AES key not set. Cannot decrypt message.");
          return;
        }
        const decryptedChunks = parsed.data.map((chunk: Matrix) =>
          decrypt(transposeMatrix(chunk), transposeMatrix(myAESKey!))
        );
        const message = matricesToString(decryptedChunks);
        console.log("Received message:", message);
        if (win) win.webContents.send("message-received", message);
      }
    } catch (err) {
      console.warn("Invalid JSON received:", message);
    }
  });

  socket.on("end", () => {
    console.log("Client disconnected");
    clients.splice(clients.indexOf(socket), 1);
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err.message);
  });
});

ipcMain.on("add-peer", (event, { ip, port }: { ip: string; port: number }) => {
  const peerKey = `${ip}:${port}`;
  if (peers.has(peerKey)) {
    console.log(`Already connected to ${peerKey}`);
    return;
  }

  const client = new Socket();
  client.connect(port, ip, () => {
    console.log(`Connected to peer ${peerKey}`);
    peers.set(peerKey, { socket: client });

    const keyMessage = JSON.stringify({
      type: "public-key",
      key: stringifyBigInts(publicKey),
    });
    client.write(keyMessage);
  });

  client.on("data", (data) => {
    const message = data.toString();
    try {
      const parsed = JSON.parse(message);

      if (parsed.type === "public-key" && parsed.key) {
        const remoteKey = parseBigInts(parsed.key);
        const entry = peers.get(peerKey);
        if (entry) entry.publicKey = remoteKey;
        console.log(`Received public key from ${peerKey}:`, remoteKey);

        if (aesKey) {
          const encrypted = encryptMessage(aesKey.join(","), remoteKey).map(
            (b) => b.toString()
          );

          const aesMessage = JSON.stringify({
            type: "aes-key",
            data: encrypted,
          });
          client.write(aesMessage);
          console.log(`Sent AES key to ${peerKey}`);
        }
      } else if (parsed.type === "aes-key") {
        const decrypted = decryptMessage(parsed.data.map(BigInt), privateKey);
        myAESKey = decrypted.split(",").map((s) => parseInt(s)) as Matrix;
        console.log(
          `Received and decrypted AES key from ${peerKey}:`,
          myAESKey
        );
      }
      // else if (parsed.type === "message") {
      //   if (!myAESKey) {
      //     console.warn("AES key not set. Cannot decrypt message.");
      //     return;
      //   }
      //   const decryptedChunks = parsed.data.map((chunk: Matrix) =>
      //     decrypt(chunk, myAESKey!)
      //   );
      //   const message = matricesToString(decryptedChunks);
      //   console.log(`Message from ${peerKey}: ${message}`);
      //   if (win) win.webContents.send("message-received", message);
      // }
    } catch (err) {
      console.warn("Invalid JSON received:", message);
    }
  });

  client.on("end", () => {
    console.log(`Connection to ${peerKey} ended`);
    peers.delete(peerKey);
  });

  client.on("error", (err) => {
    console.error(`Could not connect to ${peerKey}: ${err.message}`);
    peers.delete(peerKey);
  });
});

ipcMain.on("send-message", (event, message: string) => {
  console.log(`Sending message to peers: ${message}`);

  if (!aesKey) {
    console.warn("AES key not available. Cannot encrypt message.");
    return;
  }

  const messageMatrices = stringToMatrices(message);
  const encryptedMatrices = messageMatrices.map((matrix) =>
    encrypt(transposeMatrix(matrix), transposeMatrix(aesKey!))
  );

  const jsonMessage = JSON.stringify({
    type: "message",
    data: encryptedMatrices,
  });

  for (const [peerKey, { socket }] of peers.entries()) {
    if (socket.destroyed) {
      console.warn(`Connection to ${peerKey} is closed`);
      continue;
    }
    socket.write(jsonMessage);
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
