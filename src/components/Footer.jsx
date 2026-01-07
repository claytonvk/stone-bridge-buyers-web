import React from "react";
import styled from "styled-components";

export function Footer({
  brand = "Stone Bridge Buyers · All Rights Reserved",
  addressLine1 = "66-942 Kamakahala St,",
  addressLine2 = "Haleʻiwa HI",
  addressHref = "https://www.google.com/maps?q=66-942+Kamakahala+St,+Haleiwa+HI",
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
          <RightCol>
            <Label>Contact</Label>
            <Row>
              <Icon viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M21 16.4v3a2 2 0 0 1-2.2 2c-8.9-.7-16-7.8-16.8-16.7A2 2 0 0 1 4 2.5h3a2 2 0 0 1 2 1.7c.2 1.2.5 2.4.9 3.5a2 2 0 0 1-.5 2.1L8.1 11c1.7 3 4.2 5.4 7.2 7.1l1.1-1.3a2 2 0 0 1 2.1-.5c1.1.4 2.3.7 3.5.9a2 2 0 0 1 1.7 2.2Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </Icon>
              <PhoneLink href={emailHref}>{email}</PhoneLink>
            </Row>
          </RightCol>
        </Right>
      </Inner>
    </Wrap>
  );
}

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

const AddressLink = styled.a`
  text-decoration: none;
  display: flex;
  flex-direction: column;
  color: #f3f4f6;
  gap: 2px;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`;

const Line = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #f3f4f6;
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
