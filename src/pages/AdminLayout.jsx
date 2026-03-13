import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import styled from "styled-components";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <Wrap>
      {/* Mobile top bar */}
      <TopBar>
        <TopLeft>
          <MenuBtn onClick={() => setOpen(true)} aria-label="Open menu">
            <MenuIcon viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </MenuIcon>
          </MenuBtn>
          <BrandMini>Admin</BrandMini>
        </TopLeft>

        <TopRight>
          {/* Optional: quick links/controls */}
        </TopRight>
      </TopBar>

      {/* Desktop sidebar */}
      <Sidebar>
        <Brand>Admin</Brand>
        <Nav>
          <NavItem to="/admin" end>
            Dashboard
          </NavItem>
          <NavItem to="/admin/analytics">Site Analytics</NavItem>
          <NavItem to="/admin/forms">Forms</NavItem>
          <NavItem to="/admin/leads">Leads</NavItem>
          <NavItem to="/admin/sms">SMS Flows</NavItem>
        </Nav>
      </Sidebar>

      {/* Mobile drawer */}
      <DrawerOverlay
        $open={open}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />
      <Drawer $open={open} role="dialog" aria-modal="true" aria-label="Admin menu">
        <DrawerTop>
          <Brand>Admin</Brand>
          <CloseBtn onClick={() => setOpen(false)} aria-label="Close menu">
            ✕
          </CloseBtn>
        </DrawerTop>

        <Nav>
          <NavItem to="/admin" end>
            Dashboard
          </NavItem>
          <NavItem to="/admin/analytics">Site Analytics</NavItem>
          <NavItem to="/admin/forms">Forms</NavItem>
          <NavItem to="/admin/sms">SMS Flows</NavItem>
          <NavItem to="/admin/leads">Leads</NavItem>
        </Nav>

        <DrawerHint>Tip: tap outside to close.</DrawerHint>
      </Drawer>

      <Main>
        <Outlet />
      </Main>
    </Wrap>
  );
}

/* styles */

const Wrap = styled.div`
  display: flex;
  min-height: calc(100vh - 120px);
  background: white;

  /* ✅ Desktop: sidebar + main */
  flex-direction: row;

  /* ✅ Mobile: topbar above main */
  @media (max-width: 860px) {
    flex-direction: column;
  }
`;

/* ---------- Mobile Top Bar ---------- */

const TopBar = styled.header`
  display: none;

  @media (max-width: 860px) {
    display: flex;
    position: sticky;
    top: 0;
    z-index: 20;

    width: 100%;
    height: 56px;
    align-items: center;
    justify-content: space-between;

    padding: 0 12px;
    background: rgba(243, 244, 246, 0.98);
    border-bottom: 1px solid rgba(47, 47, 50, 0.12);
    backdrop-filter: blur(8px);
  }
`;

const TopLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TopRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const MenuBtn = styled.button`
  border: 1px solid rgba(47, 47, 50, 0.10);
  background: rgba(255, 255, 255, 0.92);
  width: 44px;
  height: 44px;
  border-radius: 14px;
  cursor: pointer;

  display: grid;
  place-items: center;

  box-shadow:
    0 10px 26px rgba(0, 0, 0, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.8) inset;

  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: translateY(1px);
    box-shadow:
      0 6px 16px rgba(0, 0, 0, 0.10),
      0 1px 0 rgba(255, 255, 255, 0.75) inset;
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 4px rgba(125, 168, 193, 0.35),
      0 10px 26px rgba(0, 0, 0, 0.08);
  }
`;

const MenuIcon = styled.svg`
  width: 22px;
  height: 22px;

  path {
    stroke: rgba(47, 47, 50, 0.88);
    stroke-width: 2.4;
    stroke-linecap: round;
  }
`;

const BrandMini = styled.div`
  font-weight: 1000;
  font-size: 16px;
  color: #2f2f32;
`;

/* ---------- Desktop Sidebar ---------- */

const Sidebar = styled.aside`
  width: 220px;
  flex-shrink: 0;

  background: #f3f4f6;
  border-right: 1px solid rgba(47, 47, 50, 0.12);
  padding: 18px 14px;

  @media (max-width: 860px) {
    display: none;
  }
`;

const Brand = styled.div`
  font-weight: 900;
  font-size: 18px;
  color: #2f2f32;
  margin-bottom: 18px;
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const NavItem = styled(NavLink)`
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 900;
  color: rgba(47, 47, 50, 0.82);
  text-decoration: none;

  &.active {
    background: #7da8c1;
    color: white;
  }

  &:hover {
    background: rgba(47, 47, 50, 0.08);
  }
`;

/* ---------- Mobile Drawer ---------- */

const DrawerOverlay = styled.div`
  display: none;

  @media (max-width: 860px) {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 30;

    background: rgba(17, 24, 39, 0.45);
    opacity: ${(p) => (p.$open ? 1 : 0)};
    pointer-events: ${(p) => (p.$open ? "auto" : "none")};
    transition: opacity 160ms ease;
  }
`;

const Drawer = styled.aside`
  display: none;

  @media (max-width: 860px) {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 40;

    width: min(320px, 86vw);
    height: 100vh;
    padding: 16px 14px;

    background: rgba(243, 244, 246, 0.98);
    border-right: 1px solid rgba(47, 47, 50, 0.12);
    backdrop-filter: blur(10px);

    transform: translateX(${(p) => (p.$open ? "0" : "-105%")});
    transition: transform 180ms ease;
  }
`;

const DrawerTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const CloseBtn = styled.button`
  border: 1px solid rgba(47, 47, 50, 0.16);
  background: rgba(255, 255, 255, 0.9);
  width: 40px;
  height: 40px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 900;
  color: rgba(47, 47, 50, 0.78);

  &:active {
    transform: translateY(1px);
  }
`;

const DrawerHint = styled.div`
  margin-top: auto;
  padding-top: 12px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(47, 47, 50, 0.62);
`;

/* ---------- Main ---------- */

const Main = styled.main`
  flex: 1;
  padding: 22px;

  /* ✅ prevents overflow weirdness in flex layouts */
  min-width: 0;
  width: 100%;

  @media (max-width: 860px) {
    padding: 16px 12px;
    /* No need for padding-top “to account for top bar” since TopBar is now a row above */
  }
`;
