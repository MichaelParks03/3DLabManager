import { setupWorker } from "msw/browser";
import { handlers } from "./handlers.js";

// Setup MSW service worker for browser environment
export const worker = setupWorker(...handlers);

// Start the worker and export the promise
export const startWorker = async () => {
  if (import.meta.env.DEV) {
    try {
      await worker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: {
          url: "/mockServiceWorker.js",
        },
      });
      console.log("🔧 MSW Service Worker started successfully");
      return true;
    } catch (error) {
      console.error("Failed to start MSW Service Worker:", error);
      return false;
    }
  }
  return false;
};

// Auto-start in development
/*
if (import.meta.env.DEV) {
  startWorker();
}
*/
