import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "@/assets/themes/global.css";
import "@/assets/languages/i18n";

import { ModalProvider, QueryProvider, ThemeProvider } from "@/providers";

import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <ThemeProvider defaultTheme="default">
        <BrowserRouter>
          <ModalProvider>
            <App />
          </ModalProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryProvider>
  </StrictMode>,
);
