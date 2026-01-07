import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export function CompareSection({
  brandName = "Stone Bridge Buyers",
  regionLabel = "Texas",
  title = "A cleaner way to sell (without the circus)",
  subtitle = `See how selling to ${brandName} compares to listing the traditional way.`,
  ctaLabel = "Get my offer",
  onCtaClick,
  leftTitle,
  rightTitle,
  leftItems,
  rightItems,
}) {
  const reduceMotion = useReducedMotion();
  const [mobileTab, setMobileTab] = useState("ours"); // ours | traditional

  const ours = useMemo(
    () =>
      leftItems ?? [
        "No agent commissions or listing fees",
        "Sell as-is — no repairs, no cleanup, no prep",
        "Offer in writing — you choose yes, no, or counter",
        "Pick your close date (fast or flexible)",
        "Local communication and a straightforward process",
      ],
    [leftItems]
  );

  const traditional = useMemo(
    () =>
      rightItems ?? [
        "Pay commissions + closing fees (often 5–6%+)",
        "Repairs, staging, cleaning, and constant prep",
        "Showings, open houses, and schedule disruption",
        "Offers can fall apart (financing/appraisals)",
        "Uncertain timeline — weeks to months",
      ],
    [rightItems]
  );

  const L = leftTitle ?? `${brandName} • ${regionLabel}`;
  const R = rightTitle ?? "Traditional Listing";

  const container = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: reduceMotion
        ? { duration: 0.01 }
        : { duration: 0.5, ease: "easeOut", staggerChildren: 0.06 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  return (
    <Wrap>
      <Inner>
        <Top
          as={motion.div}
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          <Header variants={item}>
            <Eyebrow>Comparison</Eyebrow>
            <H2>{title}</H2>
            <Sub>{subtitle}</Sub>
          </Header>

          <Actions variants={item}>
            <Cta
              type="button"
              onClick={onCtaClick}
              whileHover={reduceMotion ? {} : { y: -2 }}
              whileTap={reduceMotion ? {} : { scale: 0.99 }}
            >
              {ctaLabel} <Arrow aria-hidden="true" />
            </Cta>
            <Hint>Not sure yet? No pressure — we’ll send options.</Hint>
          </Actions>
        </Top>

        {/* Mobile tabs */}
        <MobileTabs>
          <TabButton
            type="button"
            $active={mobileTab === "ours"}
            onClick={() => setMobileTab("ours")}
          >
            {brandName}
          </TabButton>
          <TabButton
            type="button"
            $active={mobileTab === "traditional"}
            onClick={() => setMobileTab("traditional")}
          >
            Traditional
          </TabButton>
        </MobileTabs>

        <Cards
          as={motion.div}
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          <Card
            as={motion.div}
            variants={item}
            $variant="ours"
            $mobileHidden={mobileTab !== "ours"}
            whileHover={reduceMotion ? {} : { y: -4 }}
          >
            <CardGlow aria-hidden="true" $variant="ours" />
            <CardTop>
              <CardTitle>{L}</CardTitle>
              <Badge>Recommended</Badge>
            </CardTop>

            <List>
              {ours.map((t) => (
                <Row key={t}>
                  <IconGood aria-hidden="true" />
                  <Text>{t}</Text>
                </Row>
              ))}
            </List>
          </Card>

          <Card
            as={motion.div}
            variants={item}
            $variant="traditional"
            $mobileHidden={mobileTab !== "traditional"}
            whileHover={reduceMotion ? {} : { y: -4 }}
          >
            <CardGlow aria-hidden="true" $variant="traditional" />
            <CardTop>
              <CardTitle>{R}</CardTitle>
              <BadgeMuted>Common pain points</BadgeMuted>
            </CardTop>

            <List>
              {traditional.map((t) => (
                <Row key={t}>
                  <IconBad aria-hidden="true" />
                  <Text>{t}</Text>
                </Row>
              ))}
            </List>
          </Card>
        </Cards>

        <Foot>
          <FootNote>
            We’re not agents. We buy directly, so the goal is clarity: a fair
            offer, a clean close, and you stay in control.
          </FootNote>
        </Foot>
      </Inner>
    </Wrap>
  );
}

/* ---------------- styles ---------------- */

const Wrap = styled.section`
  width: 100%;
  background: #f4f6f9; /* light background requested */
  padding: 56px 12px;

  @media (min-width: 860px) {
    padding: 76px 18px;
  }
`;

const Inner = styled.div`
  max-width: 1180px;
  margin: 0 auto;
`;

const Top = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: end;
  margin-bottom: 18px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    align-items: start;
  }
`;

const Header = styled(motion.div)`
  min-width: 0;
`;

const Eyebrow = styled.div`
  color: rgba(2, 6, 23, 0.6);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const H2 = styled.h2`
  margin: 10px 0 0;
  color: rgba(2, 6, 23, 0.92);
  font-size: 34px;
  line-height: 1.08;
  letter-spacing: -0.03em;

  @media (max-width: 520px) {
    font-size: 26px;
  }
`;

const Sub = styled.p`
  margin: 10px 0 0;
  color: rgba(2, 6, 23, 0.62);
  font-size: 14px;
  line-height: 1.6;
  max-width: 62ch;
`;

const Actions = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;

  @media (max-width: 860px) {
    align-items: flex-start;
  }
`;

const Cta = styled(motion.button)`
  border: 0;
  cursor: pointer;

  padding: 12px 16px;
  border-radius: 14px;

  font-weight: 900;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  color: rgba(255, 255, 255, 0.95);
  background: linear-gradient(180deg, #7da8c1, #4f6d8a);
  box-shadow: 0 12px 26px rgba(2, 6, 23, 0.18);

  display: inline-flex;
  align-items: center;
  gap: 10px;

  &:focus-visible {
    outline: 0;
    box-shadow:
      0 12px 26px rgba(2, 6, 23, 0.18),
      0 0 0 4px rgba(111, 136, 176, 0.22);
  }
`;

const Arrow = styled(ArrowRight)`
  width: 16px;
  height: 16px;
`;

const Hint = styled.div`
  color: rgba(2, 6, 23, 0.52);
  font-size: 12px;
`;

/* Mobile tabs */
const MobileTabs = styled.div`
  display: none;
  margin: 12px 0 14px;

  @media (max-width: 980px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
`;

const TabButton = styled.button`
  border: 1px solid rgba(2, 6, 23, 0.08);
  background: ${(p) => (p.$active ? "rgba(79, 109, 138, 0.10)" : "rgba(255,255,255,0.7)")};
  cursor: pointer;

  padding: 12px 12px;
  border-radius: 14px;

  font-weight: 800;
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(2, 6, 23, 0.82);

  box-shadow: ${(p) => (p.$active ? "0 10px 20px rgba(2, 6, 23, 0.08)" : "none")};

  &:hover {
    background: rgba(79, 109, 138, 0.12);
  }
`;

const Cards = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(motion.div)`
  position: relative;
  overflow: hidden;

  border-radius: 18px;
  padding: 18px 18px 16px;

  /* light glass card feel (still matches your vibe) */
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(2, 6, 23, 0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  box-shadow:
    0 18px 40px rgba(2, 6, 23, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.65);

  ${(p) =>
    p.$variant === "ours"
      ? `border-color: rgba(111, 136, 176, 0.22);`
      : `border-color: rgba(2, 6, 23, 0.10);`}

  @media (max-width: 980px) {
    display: ${(p) => (p.$mobileHidden ? "none" : "block")};
  }
`;

const CardGlow = styled.div`
  position: absolute;
  inset: -1px;
  pointer-events: none;
  opacity: 0.9;

  background: ${(p) =>
    p.$variant === "ours"
      ? `
        radial-gradient(680px 260px at 18% 12%, rgba(111, 136, 176, 0.22), rgba(111, 136, 176, 0) 55%),
        radial-gradient(520px 240px at 92% 78%, rgba(111, 136, 176, 0.14), rgba(111, 136, 176, 0) 60%)
      `
      : `
        radial-gradient(680px 260px at 18% 12%, rgba(2, 6, 23, 0.10), rgba(2, 6, 23, 0) 55%),
        radial-gradient(520px 240px at 92% 78%, rgba(2, 6, 23, 0.06), rgba(2, 6, 23, 0) 60%)
      `};
`;

const CardTop = styled.div`
  position: relative;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
`;

const CardTitle = styled.h3`
  margin: 0;
  color: rgba(2, 6, 23, 0.92);
  font-size: 18px;
  letter-spacing: -0.01em;

  @media (max-width: 520px) {
    font-size: 16px;
  }
`;

const Badge = styled.div`
  white-space: nowrap;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 900;

  color: rgba(79, 109, 138, 0.95);
  background: rgba(79, 109, 138, 0.12);
  border: 1px solid rgba(79, 109, 138, 0.18);

  padding: 8px 10px;
  border-radius: 999px;
`;

const BadgeMuted = styled(Badge)`
  color: rgba(2, 6, 23, 0.68);
  background: rgba(2, 6, 23, 0.06);
  border-color: rgba(2, 6, 23, 0.10);
`;

const List = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 22px 1fr;
  gap: 10px;
  align-items: start;

  padding: 12px 2px;
  border-top: 1px solid rgba(2, 6, 23, 0.08);

  &:first-child {
    border-top: 0;
  }
`;

const Text = styled.div`
  color: rgba(2, 6, 23, 0.70);
  font-size: 13px;
  line-height: 1.55;
`;

const IconGood = styled(CheckCircle2)`
  width: 20px;
  height: 20px;
  color: #4f6d8a;
`;

const IconBad = styled(XCircle)`
  width: 20px;
  height: 20px;
  color: rgba(2, 6, 23, 0.45);
`;

const Foot = styled.div`
  margin-top: 14px;
`;

const FootNote = styled.div`
  color: rgba(2, 6, 23, 0.56);
  font-size: 12px;
  line-height: 1.6;
  max-width: 86ch;
`;
