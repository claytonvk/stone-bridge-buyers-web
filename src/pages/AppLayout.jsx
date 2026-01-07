import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./Home.jsx";
import About from "./About.jsx";
import { Header } from "../components/Header.jsx";
import { Footer } from "../components/Footer.jsx";
import { GlobalStyles } from "../styles/GlobalStyles.jsx";
import { ScrollToTop } from "../components/ScrollToTop.jsx";
import Contact from "./Contact.jsx";
import Location from "./Location.jsx";

export default function AppLayout() {
  const { pathname } = useLocation();
  const isAbout = pathname === "/about";

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
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/locations/:state" element={<Location />} />
        </Routes>
        <Footer />
      </div>
    </>
  );
}
