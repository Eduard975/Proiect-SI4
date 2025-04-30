export {};

declare global {
  interface Window {
    electronAPI: {
      addPeer(ip: string, port: number): void;
      sendMessage(msg: string): void;
      onMessage(cb: (msg: string) => void): void;
      sendFile(filePath: string): void;
      onFileReceived(cb: (savePath: string) => void): void;
      openFileDialog(): Promise<string | null>;
    };
  }
}
