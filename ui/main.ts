import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { createServer, Socket } from "node:net";
import path from "node:path";
import { generateKeyPair, encryptMessage, decryptMessage } from "../utils/rsa";
import { generateRandomMatrix, Matrix, transposeMatrix } from "../utils/utils";
import { encrypt } from "../utils/utils-encrypt";
import { decrypt } from "../utils/utils-decrypt";
import fs from "fs";

let win: BrowserWindow | null = null;
const messageFragments = new Map<
  string,
  { total: number; blocks: (Matrix | null)[] }
>();
const fileFragments = new Map<string, { filename: string; total: number; blocks: (Matrix | null)[] }>();

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

function bufferToMatrices(buf: Buffer): Matrix[] {
  const bytes = Array.from(buf);
  const mats: Matrix[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16);
    while (chunk.length < 16) chunk.push(0);
    mats.push(chunk as Matrix);
  }
  return mats;
}
function matricesToBuffer(mats: Matrix[]): Buffer {
  const bytes: number[] = [];
  mats.forEach(m => bytes.push(...m));
  return Buffer.from(bytes);
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
});
const server = createServer();

server.listen(port, host, () => {
  console.log(`TCP Server is running on ${host}:${port}`);
});

server.on("connection", (socket: Socket) => {
  console.log("Someone connected");
  clients.push(socket);

  // send our public key
  socket.write(
    JSON.stringify({ type: "public-key", key: stringifyBigInts(publicKey) }) + "\n"
  );

  let buffer = "";
  socket.on("data", (data) => {
    buffer += data.toString();
    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      try {
        const msg = JSON.parse(line);

        // ─── public-key ───────────────────────────────────
        if (msg.type === "public-key" && msg.key) {
          const addr = `${socket.remoteAddress}:${socket.remotePort}`;
          peers.set(addr, { socket, publicKey: parseBigInts(msg.key) });

        // ─── aes-key ───────────────────────────────────────
        } else if (msg.type === "aes-key") {
          const decrypted = decryptMessage(
            msg.data.map(BigInt),
            privateKey
          );
          const keyArr = decrypted.split(",").map(n => parseInt(n)) as Matrix;
          myAESKey = keyArr;
          aesKey = keyArr;
          console.log("Received AES key");

        // ─── text message blocks ───────────────────────────
        } else if (msg.type === "message-block") {
          const { messageId, totalBlocks, index, data } = msg;
          if (!messageFragments.has(messageId)) {
            messageFragments.set(messageId, { total: totalBlocks, blocks: Array(totalBlocks).fill(null) });
          }
          const frag = messageFragments.get(messageId)!;
          frag.blocks[index] = data;
          if (frag.blocks.every(b => b !== null) && myAESKey) {
            const decrypted = frag.blocks.map((c: Matrix) =>
              decrypt(transposeMatrix(c), transposeMatrix(myAESKey!))
            );
            const text = matricesToString(decrypted);
            win?.webContents.send("message-received", text);
            messageFragments.delete(messageId);
          }

        // ─── new: incoming file metadata ───────────────────
        } else if (msg.type === "file-meta") {
          fileFragments.set(msg.fileId, {
            filename: msg.filename,
            total: msg.totalBlocks,
            blocks: Array(msg.totalBlocks).fill(null),
          });

        // ─── new: incoming file block ──────────────────────
        } else if (msg.type === "file-block") {
          const frag = fileFragments.get(msg.fileId);
          if (frag) {
            frag.blocks[msg.index] = msg.data;
            if (frag.blocks.every(b => b !== null) && myAESKey) {
              const decrypted = frag.blocks.map((c: Matrix) =>
                decrypt(transposeMatrix(c), transposeMatrix(myAESKey!))
              );
              const outBuf = matricesToBuffer(decrypted);
              const savePath = path.join(app.getPath("downloads"), frag.filename);
              fs.writeFileSync(savePath, outBuf);
              win?.webContents.send("file-received", savePath);
              fileFragments.delete(msg.fileId);
            }
          }
        }
      } catch (err) {
        console.warn("Invalid JSON or block:", err);
      }
    }
  });

  socket.on("end", () => {
    console.log("Client disconnected");
    clients.splice(clients.indexOf(socket), 1);
  });
  socket.on("error", (err) => console.error("Socket error:", err.message));
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
    }) + "\n";
    client.write(keyMessage);
  });

  let buffer = "";
  client.on("data", (data) => {
    buffer += data.toString();

    let newlineIndex;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      try {
        const parsed = JSON.parse(line);

        if (parsed.type === "public-key" && parsed.key) {
          const remoteKey = parseBigInts(parsed.key);
          const entry = peers.get(peerKey);
          if (entry) entry.publicKey = remoteKey;

          console.log(`Received public key from ${peerKey}:`, remoteKey);

          if (aesKey) {
            const encrypted = encryptMessage(aesKey.join(","), remoteKey).map((b) =>
              b.toString()
            );

            const aesMessage = JSON.stringify({
              type: "aes-key",
              data: encrypted,
            }) + "\n";

            client.write(aesMessage);
            console.log(`Sent AES key to ${peerKey}`);
          }
        } else if (parsed.type === "aes-key") {
          try {
            const decrypted = decryptMessage(parsed.data.map(BigInt), privateKey);
            myAESKey = decrypted.split(",").map((s) => parseInt(s)) as Matrix;
            aesKey = myAESKey;

            console.log("Received and decrypted AES key:", myAESKey);
          } catch (err) {
            console.error("Failed to decrypt AES key:", err);
          }
        }
      } catch (err) {
        console.warn("Invalid JSON received:", line);
      }
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
    aesKey = generateRandomMatrix(16);
    myAESKey = aesKey;
    console.log("Generated AES key on demand:", aesKey);

    for (const [peerKey, { publicKey, socket }] of peers.entries()) {
      if (!publicKey) {
        console.warn(`No public key for peer ${peerKey}`);
        continue;
      }

      const encryptedKey = encryptMessage(aesKey.join(","), publicKey).map((b) =>
        b.toString()
      );

      const aesKeyMsg = JSON.stringify({
        type: "aes-key",
        data: encryptedKey,
      }) + "\n";

      socket.write(aesKeyMsg);
      console.log(`Sent AES key to ${peerKey}`);
    }
  }

  const matrices = stringToMatrices(message);
  const encrypted = matrices.map((m) =>
    encrypt(transposeMatrix(m), transposeMatrix(aesKey!))
  );

  const messageId = Math.random().toString(36).slice(2);

  encrypted.forEach((block, index) => {
    const jsonMessage = JSON.stringify({
      type: "message-block",
      messageId,
      totalBlocks: encrypted.length,
      index,
      data: block,
    }) + "\n";

    for (const [, { socket }] of peers.entries()) {
      if (!socket.destroyed) {
        socket.write(jsonMessage);
      }
    }
  });
});

ipcMain.on("send-file", (_event, filePath: string) => {
  console.log("🔔 main.ts got send-file:", filePath);
  if (!filePath || !aesKey) return;
  const filename = path.basename(filePath);
  const buf = fs.readFileSync(filePath);
  const mats = bufferToMatrices(buf);
  const encrypted = mats.map(m =>
    encrypt(transposeMatrix(m), transposeMatrix(aesKey!))
  );
  const fileId = Math.random().toString(36).slice(2);

  // send metadata
  const meta = JSON.stringify({
    type: "file-meta",
    fileId,
    filename,
    totalBlocks: encrypted.length,
  }) + "\n";
  peers.forEach(({ socket }) => socket.write(meta));

  // send each chunk
  encrypted.forEach((block, idx) => {
    const chunkMsg = JSON.stringify({
      type: "file-block",
      fileId,
      index: idx,
      data: block,
    }) + "\n";
    peers.forEach(({ socket }) => socket.write(chunkMsg));
  });
});

ipcMain.handle("dialog:open-file", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"]
  });
  if (canceled || filePaths.length === 0) return null;
  return filePaths[0];
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