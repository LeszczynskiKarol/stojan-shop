// frontend/src/types/global.d.ts
interface Window {
  dataLayer: any[];
  gtag: (...args: any[]) => void;
  grecaptcha: {
    ready: (callback: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
    render: (container: string | HTMLElement, options: any) => number;
  };
}
