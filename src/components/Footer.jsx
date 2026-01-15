import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

export function Footer({
  brand = "Stone Bridge Buyers · All Rights Reserved",
  email = "cartern@stonebridgebuyers.com",
  emailHref = "mailto:cartern@stonebridgebuyers.com",
  className,
}) {
  return (
    <Wrap className={className}>
      <Inner>
        <Left>
          <Brand>{brand}</Brand>
        </Left>

        <Right>
          {/* CONTACT */}
          <RightCol>
            <Label>Contact</Label>
            <Row>
              <Icon viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M5.5 4h13A2.5 2.5 0 0 1 21 6.5v11A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-11A2.5 2.5 0 0 1 5.5 4Zm14.3 3.1-7.8 4.9-7.8-4.9"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Icon>
              <PhoneLink href={emailHref}>{email}</PhoneLink>
            </Row>
          </RightCol>

          {/* LEGAL */}
          <RightCol>
            <Label>Legal</Label>
            <Row>
              <LegalLink to="/legal/privacy">
                Privacy & Terms
              </LegalLink>
            </Row>
          </RightCol>
        </Right>
      </Inner>
    </Wrap>
  );
}

/* ---------------- styles ---------------- */

const Wrap = styled.footer`
  width: 100%;
  background: #101217;
  padding: 22px;
  box-sizing: border-box;
  margin-top: 1px;
`;

const Inner = styled.div`
  max-width: 1200px;
  margin: 0 auto;

  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 32px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    gap: 18px;
  }
`;

const Left = styled.div``;

const Brand = styled.div`
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: #f3f4f6;
`;

const Right = styled.div`
  display: flex;
  gap: 48px;
  justify-self: end;

  @media (max-width: 860px) {
    justify-self: center;
    gap: 32px;
  }

  @media (max-width: 520px) {
    flex-direction: column;
    align-items: center;
    gap: 14px;
    text-align: center;
  }
`;

const RightCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #f3f4f6;
`;

const Row = styled.div`
  display: inline-flex;
  align-items: flex-start;
  gap: 10px;
`;

const Icon = styled.svg`
  width: 16px;
  height: 16px;
  margin-top: 2px;
  color: #f3f4f6;
  flex-shrink: 0;
`;

const PhoneLink = styled.a`
  font-size: 12px;
  font-weight: 600;
  color: #f3f4f6;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`;

const LegalLink = styled(Link)`
  font-size: 12px;
  font-weight: 600;
  color: #f3f4f6;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`;
