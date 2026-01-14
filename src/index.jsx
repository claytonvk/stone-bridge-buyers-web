import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppLayout from "./pages/AppLayout.jsx";
import { SpeedInsights } from "@vercel/speed-insights/react"
import { AuthProvider } from "./auth/AuthProvider.jsx";
import "bootstrap/dist/css/bootstrap.min.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
       </AuthProvider>
      <SpeedInsights />
    </BrowserRouter>
  </StrictMode>
);