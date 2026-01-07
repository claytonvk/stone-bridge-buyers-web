import React from "react";
import styled from "styled-components";

export function BrandsWeSell({
  heading = "Brands We Sell",
  brands = [
    { name: "Rippa", logoSrc: "/images/brands/RippaLogo.svg", href: "https://www.rippa.com/" },
    { name: "TPM", logoSrc: "/images/brands/TPMLogo.svg", href: "https://www.tpmindustrial.com/" },
  ],
}) {
  return (
    <Section aria-label={heading}>
      <Inner>
        <Top>
          <Title>{heading}</Title>
          <PillRow>
            <Pill>Authorized Dealer</Pill>
            <Pill>Free Delivery</Pill>
            <Pill>Flexible Payment Options</Pill>
          </PillRow>
        </Top>

        <Grid>
          {brands.map((b) => (
            <BrandCard
              key={b.name}
              href={b.href}
              target={b.href?.startsWith("http") ? "_blank" : undefined}
              rel={b.href?.startsWith("http") ? "noreferrer" : undefined}
              aria-label={`${b.name} brand`}
            >
              <LogoWrap>
                {b.logoSrc ? (
                  <LogoImg src={b.logoSrc} alt={`${b.name} logo`} loading="lazy" />
                ) : (
                  <LogoText>{b.name}</LogoText>
                )}
              </LogoWrap>

              <Meta>
                <BrandName>{b.name}</BrandName>
                <Sub>View inventory & support</Sub>
              </Meta>

              <Arrow aria-hidden="true">↗</Arrow>
            </BrandCard>
          ))}
        </Grid>

        <BottomNote>
          Looking for something specific? <BottomLink href="/contact">Contact us</BottomLink>{" "}
          and we’ll help you source it.
        </BottomNote>
      </Inner>
    </Section>
  );
}

const Section = styled.section`
  width: 100%;
  background: linear-gradient(180deg, #ffffff 0%, #f6f7f9 100%);
  padding: 70px 0;
`;

const Inner = styled.div`
  max-width: 980px;
  margin: 0 auto;
  padding: 0 22px;
`;

const Top = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 22px;
  letter-spacing: -0.02em;
  color: #111214;
`;

const PillRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const Pill = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.8);
  padding: 8px 10px;
  border-radius: 999px;
`;

const Grid = styled.div`
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const BrandCard = styled.a`
  position: relative;
  display: grid;
  grid-template-columns: 120px 1fr auto;
  align-items: center;
  gap: 14px;

  padding: 18px 18px;
  border-radius: 22px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);

  text-decoration: none;

  transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 26px 78px rgba(0, 0, 0, 0.12);
    border-color: rgba(0, 0, 0, 0.14);
  }

  &:active {
    transform: translateY(0px);
  }

  &:focus-visible {
    outline: 3px solid rgba(17, 18, 20, 0.25);
    outline-offset: 4px;
  }
`;

const LogoWrap = styled.div`
  width: 120px;
  height: 74px;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const LogoImg = styled.img`
  max-height: 70%;
  max-width: 70%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
`;

const LogoText = styled.div`
  font-weight: 800;
  font-size: 18px;
  letter-spacing: -0.02em;
  color: #111214;
`;

const Meta = styled.div`
  min-width: 0;
`;

const BrandName = styled.div`
  font-weight: 800;
  font-size: 16px;
  letter-spacing: -0.01em;
  color: #111214;
`;

const Sub = styled.div`
  margin-top: 4px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
`;

const Arrow = styled.div`
  font-size: 18px;
  color: rgba(0, 0, 0, 0.55);
  padding: 0 2px;
`;

const BottomNote = styled.div`
  margin-top: 14px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
`;

const BottomLink = styled.a`
  color: #111214;
  font-weight: 700;
  text-decoration: none;
  border-bottom: 1px solid rgba(17, 18, 20, 0.25);

  &:hover {
    border-bottom-color: rgba(17, 18, 20, 0.5);
  }
`;
