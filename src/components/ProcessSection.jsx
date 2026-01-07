import React from "react";
import styled from "styled-components";
import { motion, useReducedMotion } from "framer-motion";

export function ProcessSection({
  title = "A simple way to sell in Texas and beyond",
  subtitle = "Four steps. Clear timelines. No agents, no fees, no pressure.",
  ctaLabel = "Get my offer",
  onCtaClick,
  steps = [
    {
      step: "01",
      title: "Tell us about the home",
      body: "Share the address and a few details. If it’s easier, just send the address and we’ll ask the rest.",
      meta: "Takes ~60 seconds",
    },
    {
      step: "02",
      title: "Quick call (optional)",
      body: "We’ll confirm the basics and your timeline. No sales pitch — just the info we need to be accurate.",
      meta: "5–10 minutes",
    },
    {
      step: "03",
      title: "Get a real cash offer",
      body: "We evaluate the property and send a written offer. You can accept, counter, or walk away — totally fine.",
      meta: "Same day to 24 hours",
    },
    {
      step: "04",
      title: "Pick your close date",
      body: "Close on your schedule. We’ll handle the paperwork and cover normal closing costs on our side.",
      meta: "As fast as 7–14 days*",
    },
  ],
  finePrint = "*Timeline depends on title/closing company availability and property specifics.",
}) {
  const reduceMotion = useReducedMotion();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: reduceMotion
        ? { duration: 0.01 }
        : { staggerChildren: 0.08, delayChildren: 0.06 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
  };

  return (
    <Wrap>
      <Inner>
        <TopRow
          as={motion.div}
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          <Header variants={item}>
            <Eyebrow>Process</Eyebrow>
            <H2>{title}</H2>
            <Sub>{subtitle}</Sub>
          </Header>

          <CtaWrap variants={item}>
            <CtaButton
              type="button"
              onClick={onCtaClick}
              whileHover={reduceMotion ? {} : { y: -2, scale: 1.01 }}
              whileTap={reduceMotion ? {} : { scale: 0.99 }}
            >
              {ctaLabel}
              <Arrow aria-hidden="true">→</Arrow>
            </CtaButton>
            <CtaHint>We respond fast. Privacy respected.</CtaHint>
          </CtaWrap>
        </TopRow>

        <Cards
          as={motion.div}
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          {steps.map((s) => (
            <Card
              key={s.step}
              as={motion.div}
              variants={item}
              whileHover={
                reduceMotion
                  ? {}
                  : {
                      y: -6,
                      transition: { duration: 0.18, ease: "easeOut" },
                    }
              }
            >
              <CardGlow aria-hidden="true" />
              <CardTop>
                <StepPill>
                  <StepLabel>Step</StepLabel>
                  <StepNum>{s.step}</StepNum>
                </StepPill>

                <Meta>{s.meta}</Meta>
              </CardTop>

              <CardTitle>{s.title}</CardTitle>
              <CardBody>{s.body}</CardBody>

              <CardLine />
              <CardFoot>
                <Tiny>
                  <span>
                    Texas
                  </span>
                  <span>
                    •
                  </span>
                  <span>
                    Local communication
                  </span>
                  <span>
                    •
                  </span>
                  <span>
                    No obligation
                  </span>
                </Tiny>
              </CardFoot>
            </Card>
          ))}
        </Cards>

        <FinePrint>{finePrint}</FinePrint>
      </Inner>
    </Wrap>
  );
}

/* ---------------- styles ---------------- */

const Wrap = styled.section`
  width: 100%;
  background: #101217;
  padding: 56px 12px;

  @media (min-width: 860px) {
    padding: 76px 18px;
  }
`;

const Inner = styled.div`
  max-width: 1180px;
  margin: 0 auto;
`;

const TopRow = styled.div`
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
  color: rgba(255, 255, 255, 0.55);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const H2 = styled.h2`
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.92);
  font-size: 34px;
  line-height: 1.08;
  letter-spacing: -0.03em;

  @media (max-width: 520px) {
    font-size: 26px;
  }
`;

const Sub = styled.p`
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.62);
  font-size: 14px;
  line-height: 1.6;
  max-width: 62ch;
`;

const CtaWrap = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;

  @media (max-width: 860px) {
    align-items: flex-start;
  }
`;

const CtaButton = styled(motion.button)`
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
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.35);

  display: inline-flex;
  align-items: center;
  gap: 10px;

  &:focus-visible {
    outline: 0;
    box-shadow:
      0 14px 34px rgba(0, 0, 0, 0.35),
      0 0 0 4px rgba(111, 136, 176, 0.22);
  }
`;

const Arrow = styled.span`
  font-size: 16px;
  line-height: 1;
  transform: translateY(-1px);
`;

const CtaHint = styled.div`
  color: rgba(255, 255, 255, 0.46);
  font-size: 12px;
`;

const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(motion.div)`
  position: relative;
  overflow: hidden;
  display: flex;
  max-width: 300px;
  margin: 0 auto;
  flex-direction: column;

  border-radius: 18px;
  padding: 16px 16px 14px;

  background: rgba(20, 22, 27, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  box-shadow:
    0 18px 45px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);

  transform: translateZ(0);

  &:focus-within {
    border-color: rgba(111, 136, 176, 0.28);
  }
`;

const CardGlow = styled.div`
  position: absolute;
  inset: -1px;
  background:
    radial-gradient(
      600px 260px at 18% 12%,
      rgba(111, 136, 176, 0.18),
      rgba(111, 136, 176, 0) 55%
    ),
    radial-gradient(
      520px 240px at 92% 78%,
      rgba(111, 136, 176, 0.12),
      rgba(111, 136, 176, 0) 60%
    );
  pointer-events: none;
  opacity: 0.9;
`;

const CardTop = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const StepPill = styled.div`
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const StepLabel = styled.span`
  color: rgba(255, 255, 255, 0.58);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const StepNum = styled.span`
  color: rgba(255, 255, 255, 0.92);
  font-weight: 900;
  letter-spacing: -0.02em;
`;

const Meta = styled.div`
  color: rgba(255, 255, 255, 0.48);
  font-size: 12px;
  white-space: nowrap;
`;

const CardTitle = styled.h3`
  position: relative;
  margin: 14px 0 0;
  color: rgba(255, 255, 255, 0.92);
  font-size: 16px;
  letter-spacing: -0.01em;
`;

const CardBody = styled.p`
  position: relative;
  flex: 1;
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.64);
  font-size: 13px;
  line-height: 1.65;
`;

const CardLine = styled.div`
  position: relative;
  height: 1px;
  margin: 14px 0 10px;
  background: rgba(255, 255, 255, 0.08);
`;

const CardFoot = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const Tiny = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  color: rgba(255, 255, 255, 0.44);
  font-size: 11px;
`;

const FinePrint = styled.div`
  margin-top: 14px;
  color: rgba(255, 255, 255, 0.38);
  font-size: 12px;
  line-height: 1.5;
`;
