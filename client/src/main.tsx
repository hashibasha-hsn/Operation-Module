import { createRoot } from "react-dom/client";
import App from "./App";
import { getCurrentUserId } from "@/lib/authStorage";
import "./index.css";

const originalFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.includes("/api/")) {
    const userId = getCurrentUserId();
    if (userId) {
      if (!init) init = {};
      if (!init.headers) init.headers = {};
      if (init.headers instanceof Headers) {
        if (!init.headers.has("x-user-id")) init.headers.set("x-user-id", userId);
      } else if (Array.isArray(init.headers)) {
        if (!init.headers.some(([k]) => k.toLowerCase() === "x-user-id")) {
          init.headers.push(["x-user-id", userId]);
        }
      } else {
        (init.headers as Record<string, string>)["x-user-id"] = userId;
      }
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById("root")!).render(<App />);
