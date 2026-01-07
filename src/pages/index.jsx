import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout.jsx";
import { SpeedInsights } from "@vercel/speed-insights/react"
import "bootstrap/dist/css/bootstrap.min.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppLayout />
      <SpeedInsights />
    </BrowserRouter>
  </StrictMode>
);