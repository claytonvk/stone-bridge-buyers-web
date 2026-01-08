import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { ShieldCheck, FileText, Cookie, Info } from "lucide-react";

/**
 * One "Legal" page with tabs.
 * Add more sections by pushing to the `SECTIONS` array.
 */

export default function Legal({
  brandName = "Stone Bridge Buyers",
  supportEmail = "cartern@stonebridgebuyers.com",
  updatedLabel = "Last updated: January 2026",
}) {
  const SECTIONS = useMemo(
    () => [
      {
        key: "privacy",
        label: "Privacy",
        Icon: ShieldCheck,
        content: <PrivacyContent brandName={brandName} supportEmail={supportEmail} />,
      },
      {
        key: "terms",
        label: "Terms",
        Icon: FileText,
        content: <TermsContent brandName={brandName} supportEmail={supportEmail} />,
      },
      // Optional starter section (keep or delete)
      // {
      //   key: "cookies",
      //   label: "Cookies",
      //   Icon: Cookie,
      //   content: <CookiesContent brandName={brandName} />,
      // },
      // Optional starter section (keep or delete)
      // {
      //   key: "disclosures",
      //   label: "Disclosures",
      //   Icon: Info,
      //   content: <DisclosuresContent brandName={brandName} />,
      // },
    ],
    [brandName, supportEmail]
  );

  const [active, setActive] = useState("privacy");
  const activeSection = SECTIONS.find((s) => s.key === active) || SECTIONS[0];

  return (
    <Page>
      <Shell>
        <Header>
          <Title>Legal</Title>
          <Updated>{updatedLabel}</Updated>
          <Lead>
            View our policies and terms. We are committed to transparency and open communication. If you have any questions, please contact us.
          </Lead>
        </Header>

        <TabsRow role="tablist" aria-label="Legal sections">
          {SECTIONS.map(({ key, label, Icon }) => {
            const isActive = key === active;
            return (
              <TabButton
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${key}`}
                id={`tab-${key}`}
                $active={isActive}
                onClick={() => setActive(key)}
              >
                <TabIcon aria-hidden="true">
                  <Icon />
                </TabIcon>
                <span>{label}</span>
              </TabButton>
            );
          })}
        </TabsRow>

        <Card
          role="tabpanel"
          id={`panel-${activeSection.key}`}
          aria-labelledby={`tab-${activeSection.key}`}
        >
          {activeSection.content}
        </Card>
      </Shell>
    </Page>
  );
}

/* ---------------- section content ---------------- */

function PrivacyContent({ brandName, supportEmail }) {
  return (
    <>
      <SectionHeader>
        <H2>Privacy Policy</H2>
        <SubTitle>How we collect, use, and protect your information.</SubTitle>
      </SectionHeader>

      <Block>
        <P>
          {brandName} respects your privacy. This Privacy Policy explains how we collect, use,
          and protect information when you visit our website or submit information through our
          forms.
        </P>
      </Block>

      <Block>
        <H3>Information we collect</H3>
        <P>When you use our website, we may collect:</P>
        <Ul>
          <Li>Your name, email address, and phone number</Li>
          <Li>Property address and basic property details</Li>
        </Ul>
      </Block>

      <Block>
        <H3>How we use your information</H3>
        <P>We use your information to:</P>
        <Ul>
          <Li>Evaluate your property and provide a potential offer</Li>
          <Li>Contact you regarding your inquiry</Li>
          <Li>Improve our website and services</Li>
          <Li>Comply with legal or regulatory requirements</Li>
        </Ul>
      </Block>

      <Block>
        <H3>Information sharing</H3>
        <P>
          We do not sell your personal information. We may share information with trusted
          service providers only as needed to operate our business or communicate with you.
        </P>
      </Block>

      <Block>
        <H3>Security</H3>
        <P>
          We take very strong measures to protect your information. We use industry-standard security practices to safeguard data and limit access to authorized personnel only.
        </P>
      </Block>

      <Block>
        <H3>Your choices</H3>
        <P>
          You may request access, correction, or deletion of your personal information by
          contacting us.
        </P>
      </Block>

      <ContactBox>
        <ContactTitle>Questions?</ContactTitle>
        <ContactText>
          Email us at <strong>{supportEmail}</strong>
        </ContactText>
      </ContactBox>
    </>
  );
}

function TermsContent({ brandName, supportEmail }) {
  return (
    <>
      <SectionHeader>
        <H2>Terms & Conditions</H2>
        <SubTitle>Rules for using this website and submitting information.</SubTitle>
      </SectionHeader>

      <Block>
        <P>
          By accessing or using this website, you agree to these Terms & Conditions. If you do
          not agree, please do not use the site.
        </P>
      </Block>

      <Block>
        <H3>Use of website</H3>
        <P>
          This website is provided for informational purposes. Submitting information does not
          create a contractual obligation or guarantee an offer.
        </P>
      </Block>

      <Block>
        <H3>No legal or financial advice</H3>
        <P>
          {brandName} does not provide legal, tax, or financial advice. You should consult
          qualified professionals before making decisions related to selling your property.
        </P>
      </Block>

      <Block>
        <H3>Accuracy</H3>
        <P>
          While we strive to keep information accurate and up to date, we make no guarantees
          regarding completeness or accuracy.
        </P>
      </Block>

      <Block>
        <H3>Limitation of liability</H3>
        <P>
          {brandName} is not liable for damages arising from your use of this website or
          reliance on its content.
        </P>
      </Block>

      <Block>
        <H3>Third-party services</H3>
        <P>
          This site may use third-party services (such as form handling or analytics). We are
          not responsible for their content or practices.
        </P>
      </Block>

      <Block>
        <H3>Governing law</H3>
        <P>
          These Terms are governed by the laws of the United States and the State of Texas,
          without regard to conflict of law principles.
        </P>
      </Block>

      <ContactBox>
        <ContactTitle>Questions?</ContactTitle>
        <ContactText>
          Email us at <strong>{supportEmail}</strong>
        </ContactText>
      </ContactBox>
    </>
  );
}

/** Optional starter: keep/delete */
// function CookiesContent({ brandName }) {
//   return (
//     <>
//       <SectionHeader>
//         <H2>Cookies</H2>
//         <SubTitle>Short, plain-language summary.</SubTitle>
//       </SectionHeader>

//       <Block>
//         <P>
//           {brandName} may use cookies and similar technologies to keep the site working
//           smoothly and to understand how visitors interact with pages.
//         </P>
//         <P>
//           You can control cookies through your browser settings. Disabling cookies may affect
//           certain site features.
//         </P>
//       </Block>
//     </>
//   );
// }

/* ---------------- styles (matches your vibe) ---------------- */

const Page = styled.main`
  min-height: 100vh;
  background: #101217;
  display: flex;
  justify-content: center;
  padding: clamp(20px, 4vw, 60px);
`;

const Shell = styled.div`
  width: 100%;
  max-width: 980px;
`;

const Header = styled.header`
  margin-bottom: 18px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(34px, 4vw, 46px);
  letter-spacing: -0.04em;
  color: rgba(255, 255, 255, 0.95);
`;

const Updated = styled.div`
  margin-top: 8px;
  font-size: 13px;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.45);
`;

const Lead = styled.p`
  margin-top: 12px;
  max-width: 70ch;
  font-size: 14px;
  line-height: 1.7;
  color: rgba(226, 232, 240, 0.72);
`;

const TabsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;

  @media (max-width: 820px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const TabButton = styled.button`
  border: 0;
  cursor: pointer;
  width: 100%;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  padding: 12px 12px;
  border-radius: 16px;

  font-weight: 900;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  color: ${(p) => (p.$active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.65)")};

  background: ${(p) =>
    p.$active
      ? "linear-gradient(180deg, rgba(125,168,193,0.35), rgba(79,109,138,0.22))"
      : "rgba(255,255,255,0.04)"};

  border: 1px solid
    ${(p) => (p.$active ? "rgba(125,168,193,0.32)" : "rgba(255,255,255,0.08)")};

  box-shadow: ${(p) =>
    p.$active
      ? "0 18px 44px rgba(0,0,0,0.45)"
      : "0 10px 22px rgba(0,0,0,0.25)"};

  &:hover {
    filter: brightness(1.06);
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      0 18px 44px rgba(0,0,0,0.45),
      0 0 0 4px rgba(125, 168, 193, 0.18);
  }
`;

const TabIcon = styled.span`
  width: 30px;
  height: 30px;
  border-radius: 12px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);

  svg {
    width: 16px;
    height: 16px;
    color: #7da8c1;
  }
`;

const Card = styled.section`
  width: 100%;
  background: #101217;
  border-radius: 22px;
  padding: clamp(22px, 3.2vw, 42px);

  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 22px 70px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
`;

const SectionHeader = styled.div`
  margin-bottom: 16px;
`;

const H2 = styled.h2`
  margin: 0;
  font-size: 22px;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.92);
`;

const SubTitle = styled.div`
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: rgba(226, 232, 240, 0.66);
`;

const Block = styled.div`
  margin-top: 18px;
`;

const H3 = styled.h3`
  margin: 0 0 10px;
  font-size: 16px;
  letter-spacing: -0.01em;
  color: rgba(255, 255, 255, 0.9);
`;

const P = styled.p`
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.75;
  color: rgba(226, 232, 240, 0.72);
`;

const Ul = styled.ul`
  margin: 10px 0 0;
  padding-left: 18px;
`;

const Li = styled.li`
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: rgba(226, 232, 240, 0.72);
`;

const ContactBox = styled.div`
  margin-top: 26px;
  border-radius: 18px;
  padding: 14px 14px;

  background: rgba(125, 168, 193, 0.12);
  border: 1px solid rgba(125, 168, 193, 0.22);
`;

const ContactTitle = styled.div`
  font-weight: 900;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.92);
`;

const ContactText = styled.div`
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: rgba(226, 232, 240, 0.72);
`;
