// If you have a separate types file (e.g., types.d.ts), update it like this:
declare global {
  interface Window {
    electronAPI: {
      addPeer(ip: string, port: number): void;
      sendMessage(msg: string): void;
      onMessage(cb: (msg: string) => void): void;
      sendFile(filePath: string): void;
      openFileDialog(): Promise<string | null>;
      onFileReceived(cb: (savePath: string) => void): void;
      onFileSent(cb: (filePath: string) => void): void; // NEW
    };
  }
}

export {};

// OR, if you don't have a separate types file, add this at the top of your renderer.ts:
declare global {
  interface Window {
    electronAPI: {
      addPeer(ip: string, port: number): void;
      sendMessage(msg: string): void;
      onMessage(cb: (msg: string) => void): void;
      sendFile(filePath: string): void;
      openFileDialog(): Promise<string | null>;
      onFileReceived(cb: (savePath: string) => void): void;
      onFileSent(cb: (filePath: string) => void): void; // NEW
    };
  }
}
