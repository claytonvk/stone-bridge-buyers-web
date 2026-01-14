import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Home from "./Home.jsx";
import About from "./About.jsx";
import Legal from "./Legal.jsx";
import { Header } from "../components/Header.jsx";
import { Footer } from "../components/Footer.jsx";
import { GlobalStyles } from "../styles/GlobalStyles.jsx";
import { ScrollToTop } from "../components/ScrollToTop.jsx";
import Contact from "./Contact.jsx";
import Location from "./Location.jsx";
import Login from "./Login.jsx";
import ResetPassword from "./ResetPassword.jsx";
import RequireAuth from "../auth/RequireAuth.jsx";

import AdminLayout from "./AdminLayout.jsx";
import AdminDashboard from "./Admin/Dashboard.jsx";
import AdminForms from "./Admin/Forms.jsx";
import { AdminHeader } from "../components/AdminHeader.jsx";
import Sms from "./Admin/Sms.jsx";

export default function AppLayout() {
  const { pathname } = useLocation();
  const host = window.location.hostname;
  const isPro = host.startsWith("pro.");
  const isAbout = pathname === "/about";

  const isAdminRoute =
    isPro ||
    pathname.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/reset-password";

  return (
    <>
      <GlobalStyles />
      <ScrollToTop />

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: isAbout ? "#f9f9f9" : "#ffffff",
        }}
      >
        {isAdminRoute ? <AdminHeader isPro={isPro} /> : <Header />}

        <Routes>
          {/* Root: main domain shows marketing site, pro domain goes to admin dashboard */}
          <Route
            path="/"
            element={isPro ? <Navigate to="/admin" replace /> : <Home />}
          />

          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/locations/:state" element={<Location />} />

          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route path="sms" element={<Sms />} />
            <Route index element={<AdminDashboard />} />
            <Route path="forms" element={<AdminForms />} />

            {/* Any /admin/* unknown routes go back to dashboard */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>

        <Footer />
      </div>
    </>
  );
}
