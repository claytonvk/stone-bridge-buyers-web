import React from "react";
import styled from "styled-components";
import HelpCornerAgent from "../components/HelpCornerAgent";
import { OfferFormSection } from "../components/OfferFormSection";

export default function Contact() {
  return (
    <Page>
      <Shell>
        <Title>Contact Us</Title>
        <SubTitle>
          Reach out anytime. We service customers across all Hawaiian islands.
        </SubTitle>
        <OfferFormSection />
      </Shell>
      <HelpCornerAgent />
    </Page>
  );
}

const Page = styled.main`
  width: 100%;
  background: #101217;
`;

const Shell = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 44px 22px 80px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 44px;
  letter-spacing: -0.03em;
  color: white;

  @media (max-width: 700px) {
    font-size: 34px;
  }
`;

const SubTitle = styled.p`
  margin: 12px 0 0;
  font-size: 16px;
  line-height: 1.6;
  color: white;
`;
