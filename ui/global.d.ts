export {}; // Important to make it a module

declare global {
  interface Window {
    electronAPI: {
      addPeer: (ip: string, port: number) => void;
      sendMessage: (message: string) => void;
      onMessage: (callback: (message: string) => void) => void;
    };
  }
}
