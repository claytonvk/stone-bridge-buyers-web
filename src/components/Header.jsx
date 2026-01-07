import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

export function Header() {
  return (
    <HeaderWrap>
      <HeaderInner>
        <LeftGroup>
          <LogoButton aria-label="Home">
            <LogoButton as={Link} to="/" aria-label="Home">
              <LogoImage
                src="/images/StoneBridgeBuyersLogoLight.svg"
                alt="Stone Bridge Buyers"
              />
            </LogoButton>
          </LogoButton>
        </LeftGroup>

        <Nav>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </Nav>

        <RightGroup>
          <PrimaryButton to="/contact" >Get a Quote Now</PrimaryButton>
        </RightGroup>
      </HeaderInner>
    </HeaderWrap>
  );
}


const HeaderWrap = styled.header`
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 50;
  background: #101217;
  backdrop-filter: blur(10px);
`;

const HeaderInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 18px 22px;
  display: grid;
  grid-template-columns: auto auto auto;
  gap: 16px;
  align-items: center;

  @media (max-width: 980px) {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "left right"
      "nav nav";
  }
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;

  @media (max-width: 980px) {
    grid-area: left;
  }
`;

const RightGroup = styled.div`
  display: flex;
  justify-content: flex-end;

  @media (max-width: 980px) {
    grid-area: right;
  }
`;

const LogoButton = styled.button`
  max-width: 50px;
  border: 0;
  padding: 0;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const LogoImage = styled.img`
  height: 50px;
  width: auto;
  display: block;
`;

const Nav = styled.nav`
  display: flex;
  justify-content: center;
  gap: 28px;

  @media (max-width: 980px) {
    grid-area: nav;
    justify-content: flex-start;
    padding-top: 6px;
    gap: 18px;
    overflow-x: auto;
  }
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: white;
  font-size: 14px;
  font-weight: 500;
  opacity: 0.75;
  white-space: nowrap;

  &:hover {
    opacity: 1;
  }
`;

const PrimaryButton = styled(Link)`
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border-radius: 999px;
  background: #7da8c1;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
`;
