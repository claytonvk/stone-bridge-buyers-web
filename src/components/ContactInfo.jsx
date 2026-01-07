import React from "react";
import styled from "styled-components";

export function ContactInfo() {
  return (
    <InfoCard>
      <Row>
        <Stack>
          <IconWrap aria-hidden>
            <MapPinIcon />
          </IconWrap>
          <Title>Address</Title>
          <Value>
            <Link
              href="https://www.google.com/maps/search/?api=1&query=68-670+Farrington+HWY,+Waialua,+HI"
              target="_blank"
              rel="noopener noreferrer"
            >
               68-670 Farrington HWY, Waialua, HI
            </Link>
          </Value>
        </Stack>

        <Stack>
          <IconWrap aria-hidden>
            <PhoneIcon />
          </IconWrap>
          <Title>Phone</Title>
          <Value>
            <Link href="tel:8088290609">(808) 829-0609</Link>
          </Value>
        </Stack>

        <Stack>
          <IconWrap aria-hidden>
            <MailIcon />
          </IconWrap>
          <Title>Email</Title>
          <Value>
            <Link href="mailto:cartern@atlasequipmenthi.com">
              cartern@atlasequipmenthi.com
            </Link>
          </Value>
        </Stack>
      </Row>
    </InfoCard>
  );
}

const InfoCard = styled.section`
  margin-top: 26px;
  border-radius: 30px;
  padding: 5vw;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const Stack = styled.div`
  border-radius: 22px;
  padding: 22px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const IconWrap = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.06);
  display: grid;
  place-items: center;
  margin-bottom: 12px;

  svg {
    width: 22px;
    height: 22px;
    stroke: #2f2f32;
  }
`;

const Title = styled.div`
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.5);
`;

const Value = styled.div`
  margin-top: 8px;
  font-size: 16px;
  color: #111214;
`;

const Link = styled.a`
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);

  &:hover {
    border-bottom-color: rgba(0, 0, 0, 0.45);
  }
`;

function MapPinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.09 5.18 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.63 2.6a2 2 0 0 1-.45 2.11L9 10a16 16 0 0 0 5 5l.57-.18a2 2 0 0 1 2.11.45c.83.3 1.7.51 2.6.63A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );
}