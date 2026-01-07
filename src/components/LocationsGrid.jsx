import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

const STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

function slugifyState(state) {
  return state
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function LocationsStatesGrid({
  brandName = "Stone Bridge Buyers",
  primaryState = "Texas",
  linkBase = "/locations",
  showAllStates = true, // if false, you can pass statesOverride
  statesOverride,
  note,
}) {
  const list = showAllStates ? STATES : statesOverride ?? [primaryState];

  return (
    <Wrap>
      <Card>
        <Header>
          <TitleRow>
            <Pin aria-hidden="true" />
            <Title>Locations We Serve</Title>
          </TitleRow>

          <Note>
            {note ??
              `We buy houses across ${primaryState} (and beyond) and can help homeowners nationwide depending on the property. Choose your state to see details.`}
          </Note>
        </Header>

        <Grid>
          {list.map((state) => {
            const slug = slugifyState(state);
            const to = `${linkBase}/${slug}`;
            const isPrimary = state === primaryState;

            return (
              <Chip
                key={state}
                as={Link}
                to={to}
                $primary={isPrimary}
                aria-label={`View details for ${state}`}
                title={state}
              >
                <ChipInner>
                  <ChipName>{state}</ChipName>
                  {isPrimary && <ChipBadge>Primary</ChipBadge>}
                </ChipInner>
              </Chip>
            );
          })}
        </Grid>

        <Footer>
          <FooterLine>
            Selling a house and not sure where to start? We’ll walk you through
            the options — no pressure, no obligation.
          </FooterLine>

          <FooterBrand>
            <BrandDot aria-hidden="true" />
            <span>{brandName}</span>
          </FooterBrand>
        </Footer>
      </Card>
    </Wrap>
  );
}

/* ---------------- styles ---------------- */

const Wrap = styled.section`
  width: 100%;
  padding: 56px 14px;
  background: #101217;

  @media (max-width: 640px) {
    padding: 44px 14px;
  }
`;

const Card = styled.div`
  max-width: 1100px;
  margin: 0 auto;

  border-radius: 20px;
  overflow: hidden;

  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);

  box-shadow:
    0 22px 70px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
`;

const Header = styled.div`
  padding: 22px 22px 10px;

  @media (max-width: 640px) {
    padding: 18px 16px 10px;
  }
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Pin = styled(MapPin)`
  width: 18px;
  height: 18px;
  color: #7da8c1;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.92);
`;

const Note = styled.p`
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.62);
  max-width: 90ch;
`;

const Grid = styled.div`
  padding: 14px 22px 22px;

  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 1050px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  @media (max-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 14px 16px 18px;
  }

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const Chip = styled.a`
  text-decoration: none;

  border-radius: 999px;
  padding: 10px 12px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  background: rgba(255, 255, 255, 0.92);
  color: rgba(2, 6, 23, 0.82);

  border: 1px solid rgba(2, 6, 23, 0.06);

  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
  transition:
    transform 160ms ease,
    filter 160ms ease,
    box-shadow 160ms ease;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    transform: translateY(-2px);
    filter: brightness(0.99);
    box-shadow: 0 14px 30px rgba(0, 0, 0, 0.22);
  }

  &:active {
    transform: translateY(0px);
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      0 14px 30px rgba(0, 0, 0, 0.22),
      0 0 0 4px rgba(111, 136, 176, 0.22);
  }

  ${(p) =>
    p.$primary
      ? `
        background: linear-gradient(180deg, rgba(111, 136, 176, 0.22), rgba(79, 109, 138, 0.14));
        border-color: rgba(111, 136, 176, 0.28);
        color: rgba(255,255,255,0.92);
      `
      : ""}
`;

const ChipInner = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const ChipName = styled.span`
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.01em;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChipBadge = styled.span`
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  padding: 6px 8px;
  border-radius: 999px;

  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.9);
`;

const Footer = styled.div`
  padding: 16px 22px 20px;

  background: rgba(0, 0, 0, 0.18);
  border-top: 1px solid rgba(255, 255, 255, 0.06);

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 760px) {
    padding: 14px 16px 16px;
    flex-direction: column;
    align-items: flex-start;
  }
`;

const FooterLine = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.58);
  line-height: 1.55;
  max-width: 80ch;
`;

const FooterBrand = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;

  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
`;

const BrandDot = styled.span`
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #7da8c1;
  box-shadow: 0 0 0 4px rgba(111, 136, 176, 0.14);
`;
