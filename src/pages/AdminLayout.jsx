import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import styled from "styled-components";

export default function AdminLayout() {
  return (
    <Wrap>
      <Sidebar>
        <Brand>Admin</Brand>

        <Nav>
          <NavItem to="/admin" end>
            Dashboard
          </NavItem>

          <NavItem to="/admin/forms">
            Forms
          </NavItem>

          <NavItem to="/admin/sms">
            SMS Flows
          </NavItem>

          <NavItem to="/admin/leads">
            Leads
          </NavItem>
        </Nav>
      </Sidebar>

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
`;

const Sidebar = styled.aside`
  width: 220px;
  flex-shrink: 0;

  background: #f3f4f6;
  border-right: 1px solid rgba(47, 47, 50, 0.12);
  padding: 18px 14px;
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

const Main = styled.main`
  flex: 1;
  padding: 22px;
  max-width: calc(100vw - 220px);
`;
