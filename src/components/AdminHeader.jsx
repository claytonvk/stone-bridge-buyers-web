import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export function AdminHeader({
  brand = "Stone Bridge Buyers",
  isPro
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { session } = useAuth();
  const [email, setEmail] = useState("");

  const isAuthRoute = pathname === "/login" || pathname === "/reset-password";

  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    } else {
      setEmail("");
    }
  }, [session]);

  const signOut = async () => {
    try {
      // Create fresh client with current session token to ensure signout works
      const { createClient } = await import("@supabase/supabase-js");
      const freshClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${session?.access_token || ''}`
            }
          }
        }
      );
      
      await freshClient.auth.signOut();
      
      // Clear local storage
      localStorage.removeItem('supabase.auth.token');
      
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Sign out error:", error);
      
      // Force clear local storage and navigate anyway
      localStorage.removeItem('supabase.auth.token');
      navigate("/login", { replace: true });
    }
  };

  return (
    <Wrap>
      <GlowGrid aria-hidden />

      <Inner>
        <Left onClick={() => navigate("/admin")} role="button" tabIndex={0}>
          <Mark aria-hidden />
          <div>
            <TopLine>
              <Brand>{brand}</Brand>
              <Pill>ADMIN</Pill>
            </TopLine>
          </div>
        </Left>

        <Right>
          {!isPro &&
            <Nav>
              <NavBtn
                type="button"
                onClick={() => navigate("/")}
                title="Back to public site"
              >
                ← Back to site
              </NavBtn>
            </Nav>
          }

          <Divider />
          {!isAuthRoute && session ? (
            <>
              <User>
                <UserDot aria-hidden />
                <UserMeta>
                  <UserLabel>Signed in</UserLabel>
                  <UserValue>{email || "—"}</UserValue>
                </UserMeta>
              </User>
              <Primary type="button" onClick={signOut}>
                Sign out
              </Primary>
            </>
          ) : null}
        </Right>
      </Inner>
    </Wrap>
  );
}

/* styles */

const Wrap = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  background: linear-gradient(180deg, #7da8c1, #4f6d8a);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
`;

const GlowGrid = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.55;
  pointer-events: none;
`;

const Inner = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 18px;
  margin: 0 auto;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
`;

const Mark = styled.div`
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow:
    0 0 0 6px rgba(255, 255, 255, 0.12),
    0 14px 40px rgba(0, 0, 0, 0.35);
`;

const TopLine = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Brand = styled.div`
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.2px;
  color: #ffffff;
`;

const Pill = styled.div`
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.6px;
  color: #ffffff;
  background: #4f6d8a;
  border-radius: 999px;
  padding: 4px 10px;
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NavBtn = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.10);
  color: #ffffff;
  font-weight: 900;
  font-size: 12px;
  border-radius: 999px;
  padding: 10px 12px;
  cursor: pointer;

  &:hover {
    border-color: rgba(255, 255, 255, 0.26);
    background: rgba(0, 0, 0, 0.18);
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 34px;
  background: rgba(255, 255, 255, 0.12);

  @media (max-width: 640px) {
    display: none;
  }
`;

const User = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.10);
  max-width: 360px;
`;

const UserDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.95);
  box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.12);
`;

const UserMeta = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  min-width: 0;
`;

const UserLabel = styled.div`
  font-size: 11px;
  font-weight: 900;
  color: #ffffff;
`;

const UserValue = styled.div`
  font-size: 12px;
  font-weight: 900;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Primary = styled.button`
  border: 0;
  border-radius: 999px;
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 900;
  font-size: 12px;
  color: rgba(20, 20, 22, 0.96);
  background: rgba(243, 244, 246, 0.94);

  &:hover {
    filter: brightness(0.96);
  }
`;
