import { app, BrowserWindow, ipcMain } from "electron";
import { createServer, Socket } from "node:net";
import path from "node:path";
import { generateKeyPair, encryptMessage, decryptMessage } from "../utils/rsa";
import { generateRandomMatrix, Matrix, transposeMatrix } from "../utils/utils";
import { encrypt } from "../utils/utils-encrypt";
import { decrypt } from "../utils/utils-decrypt";

let win: BrowserWindow | null = null;
const messageFragments = new Map<
  string,
  { total: number; blocks: (Matrix | null)[] }
>();

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
  }) + "\n"; // ✅ Important
  socket.write(keyMessage);

  let buffer = "";

  socket.on("data", (data) => {
    buffer += data.toString();

    let newlineIndex;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      try {
        const parsed = JSON.parse(line);

        if (parsed.type === "public-key" && parsed.key) {
          const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
          const peerKey = parseBigInts(parsed.key);
          peers.set(remoteAddress, { socket, publicKey: peerKey });

        } else if (parsed.type === "aes-key") {
          try {
            const decrypted = decryptMessage(parsed.data.map(BigInt), privateKey);
            const keyMatrix = decrypted.split(",").map((n) => parseInt(n)) as Matrix;
            myAESKey = keyMatrix;
            aesKey = keyMatrix;

            console.log("Received and decrypted AES key:", aesKey);
          } catch (err) {
            console.error("Failed to decrypt AES key:", err);
          }
        } else if (parsed.type === "message-block") {
          const { messageId, totalBlocks, index, data } = parsed;

          if (!messageFragments.has(messageId)) {
            messageFragments.set(messageId, {
              total: totalBlocks,
              blocks: Array(totalBlocks).fill(null),
            });
          }

          const fragment = messageFragments.get(messageId)!;
          fragment.blocks[index] = data;

          if (fragment.blocks.every((b) => b !== null)) {
            if (!myAESKey) {
              console.warn("AES key not set. Cannot decrypt.");
              return;
            }

            const decryptedChunks = fragment.blocks.map((chunk: Matrix) =>
              decrypt(transposeMatrix(chunk!), transposeMatrix(myAESKey!))
            );
            const fullMessage = matricesToString(decryptedChunks);
            console.log("Reassembled message:", fullMessage);
            messageFragments.delete(messageId);
            if (win) win.webContents.send("message-received", fullMessage);
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

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});