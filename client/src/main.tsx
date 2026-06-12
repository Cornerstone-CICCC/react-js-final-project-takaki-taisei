import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          classNames: {
            toast: "app-toast",
            title: "app-toast-title",
            description: "app-toast-description",
            actionButton: "app-toast-action",
            cancelButton: "app-toast-cancel",
            closeButton: "app-toast-close",
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
);
