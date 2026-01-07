import React from "react";
import styled from "styled-components";
import { motion, useReducedMotion } from "framer-motion";
import { Home, ShieldCheck, DollarSign, ClipboardCheck } from "lucide-react";

export function TrustStrip() {
  const reduceMotion = useReducedMotion();

  const items = [
    { title: "Buy As-Is", Icon: Home },
    { title: "Local & Reliable", Icon: ShieldCheck },
    { title: "No Closing Costs", Icon: DollarSign },
    { title: "No Obligation", Icon: ClipboardCheck },
  ];

  const container = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: reduceMotion
        ? { duration: 0.01 }
        : { duration: 0.45, ease: "easeOut", staggerChildren: 0.06 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  return (
    <Wrap>
      <Inner
        as={motion.div}
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
      >
        {items.map(({ title, Icon }) => (
          <Item
            key={title}
            as={motion.div}
            variants={item}
            whileHover={reduceMotion ? {} : { y: -3 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <IconWrap aria-hidden="true">
              <IconStyled as={Icon} />
            </IconWrap>

            <Label>{title}</Label>
          </Item>
        ))}
      </Inner>
    </Wrap>
  );
}

/* ---------------- styles ---------------- */

const Wrap = styled.section`
  width: 100%;
  background: #f4f6f9; /* light slate */
  padding: 28px 16px;

  border-top: 1px solid rgba(0, 0, 0, 0.04);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
`;

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;

  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 820px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const Item = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
`;

const IconWrap = styled.div`
  width: 42px;
  height: 42px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #4f6d8a;
`;

const IconStyled = styled.div`
  width: 28px;
  height: 28px;

  svg {
    width: 28px;
    height: 28px;
  }
`;

const Label = styled.div`
  font-size: 14px;
  font-weight: 650;
  color: #101217;
  letter-spacing: 0.01em;
`;
