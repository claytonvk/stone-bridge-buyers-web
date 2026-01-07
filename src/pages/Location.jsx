import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import styled from "styled-components";
import {
  BadgeCheck,
  Clock,
  Hammer,
  ShieldCheck,
  Sparkles,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { usePageMeta } from "../hooks/usePageMeta";

function titleCaseFromSlug(slug = "") {
  return String(slug || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function safeSlug(slug = "") {
  return String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

function toJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

const BRAND_DEFAULT = "Stone Bridge Buyers";

// Keep Texas special. Everything else uses the nationwide template.
// You can optionally add a few states with extra detail later.
const STATE_CONFIG = {
  texas: {
    primary: true,
    closeRange: "7–21 days",
    metros: ["Dallas–Fort Worth", "Houston", "Austin", "San Antonio"],
    note:
      "Texas is our home base. We buy directly across the state and can often move quickly when you’re ready.",
  },
};

function getStateConfig(stateSlug, stateName) {
  const cfg = STATE_CONFIG[stateSlug];
  if (cfg) return cfg;

  return {
    primary: false,
    closeRange: "10–30 days",
    metros: [],
    note:
      `We buy houses nationwide. In ${stateName}, we may purchase directly or ` +
      `coordinate with a vetted local partner to keep the process simple and fast.`,
  };
}

export default function Location({
  brandName = "Stone Bridge Buyers",
  baseUrl = "https://YOUR_DOMAIN.com", // TODO: change
  onPrimaryCtaClick,
}) {

  const { state } = useParams();
  console.log(useParams())
  const stateSlug = safeSlug(state || "texas");
  const stateName = titleCaseFromSlug(stateSlug);

  const cfg = getStateConfig(stateSlug, stateName);

  const placeLine = cfg.primary
    ? `Serving homeowners across ${stateName}.`
    : `Nationwide home buyers • Including ${stateName}.`;

  const title = cfg.primary
    ? `Sell Your House Fast in ${stateName} | Cash Home Buyers`
    : `Sell Your House Fast in ${stateName} | Nationwide Cash Buyers`;

  const description = cfg.primary
    ? `${brandName} buys houses as-is across ${stateName}. No repairs, no fees, and a clear closing timeline. Get a cash offer today.`
    : `${brandName} buys houses as-is nationwide, including ${stateName}. No repairs, no showings, and no obligation. Request a cash offer today.`;

  const canonical = `${baseUrl}/locations/${stateSlug}`;

  usePageMeta({
    title,
    description,
    canonical,
  });

  const faq = useMemo(() => {
    const faqs = [
      {
        q: `Do you buy houses as-is in ${stateName}?`,
        a: cfg.primary
          ? `Yes. We buy homes in ${stateName} as-is — even if the property needs repairs, has tenants, or you're working through a tight timeline.`
          : `Potentially. We can sometimes buy homes in ${stateName} depending on the property and situation. Send the address and we’ll confirm quickly.`,
      },
      {
        q: "Do I need to clean, repair, or stage the home?",
        a: "No. We buy as-is. Leave behind what you don’t want and skip the repairs and showings.",
      },
      {
        q: "How fast can you close?",
        a: `Most closings happen in about ${cfg.closeRange}, depending on title and your timeline. We can also schedule for later if you need more time.`,
      },
      {
        q: "Is there any obligation after I request an offer?",
        a: "No. You can review the offer and choose what’s best for you. Zero pressure.",
      },
    ];

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.a,
        },
      })),
    };
  }, [cfg.primary, cfg.closeRange, stateName]);

  const reasons = [
    {
      Icon: Hammer,
      title: "Sell as-is",
      desc: "No repairs, no cleanup, no showings. Keep it simple.",
    },
    {
      Icon: ShieldCheck,
      title: "No pressure",
      desc: "You’re in control. Review the offer and decide.",
    },
    {
      Icon: Clock,
      title: "Clear timeline",
      desc: `Typical closings in ${cfg.closeRange}. Fast when you need it.`,
    },
    {
      Icon: BadgeCheck,
      title: "Straightforward process",
      desc: "We explain everything clearly and handle the steps.",
    },
  ];

  return (
    <Page>
      {/* FAQ JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(faq) }} />

      <Top>
        <BackRow>
          <BackLink to="/about">
            <ArrowLeft aria-hidden="true" />
            All locations
          </BackLink>
        </BackRow>

        <HeroCard>
          <HeroLeft>
            <Eyebrow>
              <MapPinIcon aria-hidden="true" />
              {placeLine}
            </Eyebrow>

            <H1>
              Cash home buyers in <Accent>{stateName}</Accent>
            </H1>

            <Lead>
              {cfg.primary ? (
                <>
                  Get a fair cash offer without agents, repairs, or drawn-out timelines. We buy
                  houses in {stateName} and keep the process clear from day one.
                </>
              ) : (
                <>
                  We buy houses nationwide — including {stateName}. Depending on the property,
                  we may purchase directly or coordinate with a vetted local partner so you
                  get a clear offer and a clean closing path.
                </>
              )}
            </Lead>

            {cfg.metros?.length > 0 && (
              <MetroLine>
                Popular areas:{" "}
                <strong>{cfg.metros.slice(0, 4).join(" • ")}</strong>
              </MetroLine>
            )}

            <CtaRow>
              <PrimaryCta type="button" onClick={onPrimaryCtaClick}>
                Get my cash offer
                <ArrowRightIcon aria-hidden="true" />
              </PrimaryCta>

              <SecondaryLink as={Link} to="/#how-it-works">
                See how it works
              </SecondaryLink>
            </CtaRow>

            <SmallPrint>{cfg.note}</SmallPrint>
          </HeroLeft>

          <HeroRight>
            <ReasonGrid>
              {reasons.map(({ Icon, title: t, desc }) => (
                <Reason key={t}>
                  <ReasonIcon aria-hidden="true">
                    <Icon />
                  </ReasonIcon>
                  <ReasonTitle>{t}</ReasonTitle>
                  <ReasonDesc>{desc}</ReasonDesc>
                </Reason>
              ))}
            </ReasonGrid>
          </HeroRight>
        </HeroCard>
      </Top>

      <Body>
        <Section>
          <H2>What selling looks like in {stateName}</H2>
          <P>
            Most homeowners don’t want to list, stage, negotiate repairs, and
            wait on financing — especially when life is already complicated.
            Selling to a cash buyer can remove those friction points and give
            you a clear path forward.
          </P>
          <P>
            We focus on clarity: you share the address, we ask a few simple
            questions, and we present a straightforward offer. If it helps you,
            great. If not, no hard feelings.
          </P>
        </Section>

        <Divider />

        <Section>
          <H2>Frequently asked questions</H2>
          <FaqGrid>
            <FaqItem>
              <FaqQ>Do you charge fees or commissions?</FaqQ>
              <FaqA>No commissions. No hidden fees. We’ll explain the numbers clearly.</FaqA>
            </FaqItem>

            <FaqItem>
              <FaqQ>Will you still buy if the house needs work?</FaqQ>
              <FaqA>Yes — many homes we buy need repairs. We purchase as-is.</FaqA>
            </FaqItem>

            <FaqItem>
              <FaqQ>Do I have to accept the offer?</FaqQ>
              <FaqA>No. You can review it and decide what’s best for you.</FaqA>
            </FaqItem>

            <FaqItem>
              <FaqQ>How do I start?</FaqQ>
              <FaqA>Enter your address in the form above and we’ll take it from there.</FaqA>
            </FaqItem>
          </FaqGrid>
        </Section>
      </Body>
    </Page>
  );
}

/* ---------------- styles ---------------- */

const Page = styled.main`
  width: 100%;
  background: #101217;
  padding: 40px 14px 76px;
`;

const Top = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const BackRow = styled.div`
  margin-bottom: 12px;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;

  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 900;

  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;

  &:hover {
    color: rgba(255, 255, 255, 0.88);
  }
`;

const ArrowLeft = styled.span`
  width: 10px;
  height: 10px;
  display: inline-block;
  border-left: 2px solid rgba(255, 255, 255, 0.6);
  border-bottom: 2px solid rgba(255, 255, 255, 0.6);
  transform: rotate(45deg);
`;

const HeroCard = styled.section`
  border-radius: 22px;
  overflow: hidden;

  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0.03)
  );
  border: 1px solid rgba(255, 255, 255, 0.08);

  box-shadow:
    0 22px 70px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);

  display: grid;
  grid-template-columns: 1.2fr 0.8fr;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const HeroLeft = styled.div`
  padding: 26px 26px 22px;

  @media (max-width: 640px) {
    padding: 20px 16px 18px;
  }
`;

const HeroRight = styled.div`
  padding: 26px 26px 22px;
  background: rgba(0, 0, 0, 0.18);
  border-left: 1px solid rgba(255, 255, 255, 0.06);

  @media (max-width: 900px) {
    border-left: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  @media (max-width: 640px) {
    padding: 18px 16px 18px;
  }
`;

const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;

  color: rgba(148, 163, 184, 0.85);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const MapPinIcon = styled(MapPin)`
  width: 16px;
  height: 16px;
  color: #6f88b0;
`;

const H1 = styled.h1`
  margin: 12px 0 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 38px;
  line-height: 1.08;
  letter-spacing: -0.03em;

  @media (max-width: 520px) {
    font-size: 30px;
  }
`;

const Accent = styled.span`
  color: #6f88b0;
`;

const Lead = styled.p`
  margin: 12px 0 0;
  max-width: 70ch;

  color: rgba(226, 232, 240, 0.74);
  font-size: 15px;
  line-height: 1.7;
`;

const MetroLine = styled.div`
  margin-top: 12px;
  font-size: 13px;
  color: rgba(226, 232, 240, 0.7);

  strong {
    color: rgba(226, 232, 240, 0.92);
    font-weight: 800;
  }
`;

const CtaRow = styled.div`
  margin-top: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
`;

const PrimaryCta = styled.button`
  border: 0;
  cursor: pointer;

  display: inline-flex;
  align-items: center;
  gap: 12px;

  padding: 12px 16px;
  border-radius: 16px;

  font-weight: 900;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  color: white;
  background: linear-gradient(180deg, #6f88b0, #4f6d8a);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);

  &:hover {
    filter: brightness(1.06);
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      0 16px 40px rgba(0, 0, 0, 0.45),
      0 0 0 4px rgba(111, 136, 176, 0.26);
  }
`;

const ArrowRightIcon = styled(ArrowRight)`
  width: 16px;
  height: 16px;
  stroke-width: 2.2;
`;

const SecondaryLink = styled.a`
  font-weight: 900;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;

  &:hover {
    color: rgba(255, 255, 255, 0.9);
  }
`;

const SmallPrint = styled.div`
  margin-top: 14px;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(148, 163, 184, 0.7);
`;

const ReasonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
`;

const Reason = styled.div`
  border-radius: 16px;
  padding: 14px 14px;

  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

const ReasonIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 12px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #6f88b0;
  background: rgba(111, 136, 176, 0.14);
  border: 1px solid rgba(111, 136, 176, 0.22);

  svg {
    width: 18px;
    height: 18px;
    stroke-width: 2.1;
  }
`;

const ReasonTitle = styled.div`
  margin-top: 10px;
  font-weight: 900;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.92);
`;

const ReasonDesc = styled.div`
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(226, 232, 240, 0.68);
`;

const Body = styled.div`
  max-width: 1100px;
  margin: 20px auto 0;
`;

const Section = styled.section`
  margin-top: 18px;
  padding: 18px 18px;

  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);

  @media (max-width: 640px) {
    padding: 16px 14px;
  }
`;

const H2 = styled.h2`
  margin: 0;
  font-size: 18px;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.9);
`;

const P = styled.p`
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.75;
  color: rgba(226, 232, 240, 0.72);
`;

const Divider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 18px 0;
`;

const FaqGrid = styled.div`
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const FaqItem = styled.div`
  border-radius: 16px;
  padding: 14px 14px;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

const FaqQ = styled.div`
  font-weight: 900;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
`;

const FaqA = styled.div`
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(226, 232, 240, 0.72);
`;
