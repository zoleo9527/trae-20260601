export interface ElectronAPI {
  exportJSON: (data: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  importJSON: () => Promise<{ success: boolean; content?: string; filePath?: string; error?: string }>;
  exportCSV: (data: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  showMessage: (options: {
    type?: 'none' | 'info' | 'error' | 'question' | 'warning';
    title?: string;
    message: string;
    buttons?: string[];
  }) => Promise<{ response: number }>;
  getPlatform: () => Promise<string>;
  getVersion: () => Promise<string>;
  isDesktop: () => boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    isDesktopApp?: boolean;
  }
}

export {};
