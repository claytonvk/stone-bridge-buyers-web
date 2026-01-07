import React from "react";
import styled from "styled-components";
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  Home,
  Hammer,
  Users,
  FileWarning,
  DollarSign,
} from "lucide-react";

/**
 * AnyConditionSection
 * Dark reassurance section — “we buy houses in any condition”
 */
export function AnyConditionSection({
  onCtaClick,
  ctaLabel = "Get my cash offer",
}) {
  const reduceMotion = useReducedMotion();

  const items = [
    { label: "Inherited property", Icon: Home },
    { label: "Needs repairs or updates", Icon: Hammer },
    { label: "Tenant or occupancy issues", Icon: Users },
    { label: "Foreclosure or time pressure", Icon: FileWarning },
    { label: "Back taxes or financial stress", Icon: DollarSign },
    { label: "Divorce or life changes", Icon: CheckCircle2 },
  ];

  return (
    <Wrap>
      <Inner>
        <Content
          as={motion.div}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.25 }}
        >
          <TextCol>
            <Eyebrow>Any condition</Eyebrow>

            <Title>We buy houses in real-life situations</Title>

            <Copy>
              Life doesn’t always line up with selling a house the “traditional”
              way. If your property isn’t perfect — or your situation is
              complicated — that’s okay. We buy homes throughout Texas (and beyond) exactly
              as they are, without judgment, repairs, or pressure.
            </Copy>

            <Grid>
              {items.map(({ label, Icon }) => (
                <Item key={label}>
                  <IconWrap aria-hidden="true">
                    <Icon />
                  </IconWrap>
                  <ItemText>{label}</ItemText>
                </Item>
              ))}
            </Grid>

            <CtaRow>
              <Cta
                type="button"
                onClick={onCtaClick}
                whileHover={reduceMotion ? {} : { y: -2 }}
                whileTap={reduceMotion ? {} : { scale: 0.99 }}
              >
                {ctaLabel}
              </Cta>

              <CtaNote>
                No repairs • No fees • You choose the timeline
              </CtaNote>
            </CtaRow>
          </TextCol>
        </Content>
      </Inner>
    </Wrap>
  );
}

const Wrap = styled.section`
  width: 100%;
  background: #101217;
  padding: 72px 16px;

  @media (max-width: 640px) {
    padding: 56px 16px;
  }
`;

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const Content = styled.div`
  display: flex;
  justify-content: center;
`;

const TextCol = styled.div`
  max-width: 720px;
`;

const Eyebrow = styled.div`
  color: rgba(148, 163, 184, 0.8);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const Title = styled.h2`
  margin: 12px 0 0;
  font-size: 36px;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: rgba(255, 255, 255, 0.95);

  @media (max-width: 520px) {
    font-size: 28px;
  }
`;

const Copy = styled.p`
  margin-top: 14px;
  max-width: 64ch;

  font-size: 15px;
  line-height: 1.65;
  color: rgba(226, 232, 240, 0.75);
`;

const Grid = styled.div`
  margin-top: 28px;

  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 22px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconWrap = styled.div`
  width: 26px;
  height: 26px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #7da8c1;

  svg {
    width: 22px;
    height: 22px;
    stroke-width: 1.8;
  }
`;

const ItemText = styled.div`
  font-size: 14px;
  color: rgba(226, 232, 240, 0.9);
`;

const CtaRow = styled.div`
  margin-top: 34px;

  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Cta = styled(motion.button)`
  align-self: flex-start;

  border: 0;
  cursor: pointer;

  padding: 14px 22px;
  border-radius: 16px;

  font-weight: 900;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  color: white;
  background: linear-gradient(180deg, #7da8c1, #4f6d8a);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);

  &:focus-visible {
    outline: none;
    box-shadow:
      0 16px 40px rgba(0, 0, 0, 0.45),
      0 0 0 4px rgba(111, 136, 176, 0.28);
  }
`;

const CtaNote = styled.div`
  font-size: 12px;
  color: rgba(148, 163, 184, 0.65);
`;
