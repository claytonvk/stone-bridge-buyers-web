import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const [
        { count: leadsTotal },
        { count: leadsNew },
        { count: leadsInterested },
        { count: leadsFollowUp },
        { count: canText },
        { count: smsSubscribed },
        { count: inboundToday },
        { count: quotes },
        { count: help },
      ] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),

        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),

        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "interested"),

        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "followUp"),

        supabase.from("leads").select("id", { count: "exact", head: true }).eq("can_text", true),

        supabase.from("leads").select("id", { count: "exact", head: true }).eq("sms_subscription", true),

        supabase.from("leads").select("id", { count: "exact", head: true }).gte("last_inbound_at", startOfToday()),

        supabase.from("quote_form_submissions").select("id", { count: "exact", head: true }),

        supabase.from("help_agent_submissions").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        leadsTotal,
        leadsNew,
        leadsInterested,
        leadsFollowUp,
        canText,
        smsSubscribed,
        inboundToday,
        quotes,
        help,
      });

      setLoading(false);
    }

    load();
  }, []);

  const kpis = useMemo(() => {
    const s = stats || {};
    return [
      {
        key: "interested",
        label: "Interested",
        value: s.leadsInterested,
        sub: "Warm leads ready for calls",
        tone: "good",
        onClick: () => navigate("/admin/leads/status/interested"),
      },
      {
        key: "followUp",
        label: "Needs follow-up",
        value: s.leadsFollowUp,
        sub: "People to re-contact today",
        tone: "warn",
        onClick: () => navigate("/admin/leads/status/followUp"),
      },
      {
        key: "new",
        label: "New leads",
        value: s.leadsNew,
        sub: "Fresh imports + form leads",
        tone: "blue",
        onClick: () => navigate("/admin/leads/status/new"),
      },
      {
        key: "inbound",
        label: "Inbound today",
        value: s.inboundToday,
        sub: "Replies to your texts",
        tone: "purple",
        onClick: () => navigate("/admin/leads"),
      },
    ];
  }, [stats, navigate]);

  return (
    <Page>
      <Hero>
        <HeroLeft>
          <H1>Dashboard</H1>
          <Sub>
            Snapshot of pipeline health, SMS readiness, and intake signals.
          </Sub>
        </HeroLeft>

        <HeroRight>
          <Ghost onClick={() => navigate("/admin/leads")}>View leads</Ghost>
          <Primary onClick={() => window.location.reload()}>
            {loading ? "Refreshing…" : "Refresh"}
          </Primary>
        </HeroRight>
      </Hero>

      <KpiGrid>
        {kpis.map((k) => (
          <KpiCard
            key={k.key}
            $tone={k.tone}
            role="button"
            tabIndex={0}
            onClick={k.onClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") k.onClick();
            }}
          >
            <KpiTop>
              <KpiLabel>{k.label}</KpiLabel>
              <Pill $tone={k.tone}>{loading ? "…" : "Live"}</Pill>
            </KpiTop>

            <KpiValue>{loading ? "—" : formatNum(k.value)}</KpiValue>
            <KpiSub>{k.sub}</KpiSub>

            <KpiFooter>
              <SmallLink>Open list</SmallLink>
              <Arrow>→</Arrow>
            </KpiFooter>
          </KpiCard>
        ))}
      </KpiGrid>

      <Grid>
        <Panel>
          <PanelTop>
            <PanelTitle>Lead Pipeline</PanelTitle>
            <PanelMeta>Totals by status</PanelMeta>
          </PanelTop>

          <PanelBody>
            <Row>
              <RowLeft>
                <Dot $tone="slate" />
                <RowLabel>Total leads</RowLabel>
              </RowLeft>
              <RowValue>{loading ? "—" : formatNum(stats?.leadsTotal)}</RowValue>
            </Row>

            <Divider />

            <Row onClick={() => navigate("/admin/leads/status/new")} style={{ cursor: "pointer" }}>
              <RowLeft>
                <Dot $tone="blue" />
                <RowLabel>New</RowLabel>
              </RowLeft>
              <RowValue>{loading ? "—" : formatNum(stats?.leadsNew)}</RowValue>
            </Row>

            <Row
              onClick={() => navigate("/admin/leads/status/followUp")}
              style={{ cursor: "pointer" }}
            >
              <RowLeft>
                <Dot $tone="warn" />
                <RowLabel>Needs follow-up</RowLabel>
              </RowLeft>
              <RowValue>{loading ? "—" : formatNum(stats?.leadsFollowUp)}</RowValue>
            </Row>

            <Row
              onClick={() => navigate("/admin/leads/status/interested")}
              style={{ cursor: "pointer" }}
            >
              <RowLeft>
                <Dot $tone="good" />
                <RowLabel>Interested</RowLabel>
              </RowLeft>
              <RowValue>{loading ? "—" : formatNum(stats?.leadsInterested)}</RowValue>
            </Row>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelTop>
            <PanelTitle>SMS Readiness</PanelTitle>
            <PanelMeta>Who can you text today?</PanelMeta>
          </PanelTop>

          <PanelBody>
            <Row>
              <RowLeft>
                <Dot $tone="warn" />
                <RowLabel>Can text</RowLabel>
              </RowLeft>
              <RowValue>{loading ? "—" : formatNum(stats?.canText)}</RowValue>
            </Row>

            <Row>
              <RowLeft>
                <Dot $tone="good" />
                <RowLabel>SMS subscribed</RowLabel>
              </RowLeft>
              <RowValue>{loading ? "—" : formatNum(stats?.smsSubscribed)}</RowValue>
            </Row>

            <Divider />

            <Row>
              <RowLeft>
                <Dot $tone="purple" />
                <RowLabel>Inbound today</RowLabel>
              </RowLeft>
              <RowValue>{loading ? "—" : formatNum(stats?.inboundToday)}</RowValue>
            </Row>

            <PanelHint>
              Tip: “Can text” means the lead is eligible to receive your first message. Once they reply, you’ll mark SMS
              subscribed true/false based on their response.
            </PanelHint>
          </PanelBody>
        </Panel>

        <Panel $wide>
          <PanelTop>
            <PanelTitle>Forms & Signals</PanelTitle>
            <PanelMeta>Website activity that feeds leads</PanelMeta>
          </PanelTop>

          <PanelBody>
            <Split>
              <MiniCard onClick={() => navigate("/admin/forms")} role="button" tabIndex={0}>
                <MiniTop>
                  <MiniLabel>Quote requests</MiniLabel>
                  <MiniPill>Forms</MiniPill>
                </MiniTop>
                <MiniValue>{loading ? "—" : formatNum(stats?.quotes)}</MiniValue>
                <MiniSub>All-time quote form submissions</MiniSub>
              </MiniCard>

              <MiniCard onClick={() => navigate("/admin/forms")} role="button" tabIndex={0}>
                <MiniTop>
                  <MiniLabel>Help requests</MiniLabel>
                  <MiniPill>Support</MiniPill>
                </MiniTop>
                <MiniValue>{loading ? "—" : formatNum(stats?.help)}</MiniValue>
                <MiniSub>All-time help agent submissions</MiniSub>
              </MiniCard>

              <MiniCard onClick={() => navigate("/admin/leads")} role="button" tabIndex={0}>
                <MiniTop>
                  <MiniLabel>Total leads</MiniLabel>
                  <MiniPill>CRM</MiniPill>
                </MiniTop>
                <MiniValue>{loading ? "—" : formatNum(stats?.leadsTotal)}</MiniValue>
                <MiniSub>Combined CSV + form-created leads</MiniSub>
              </MiniCard>
            </Split>
          </PanelBody>
        </Panel>
      </Grid>
    </Page>
  );
}

/* helpers */

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function formatNum(n) {
  const v = Number(n || 0);
  return v.toLocaleString();
}

/* styles */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  padding: 22px;
  max-width: 1800px;
  margin: 0 auto;
  animation: ${fadeIn} 180ms ease-out;
`;

const Hero = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-bottom: 14px;
`;

const HeroLeft = styled.div``;

const HeroRight = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const H1 = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 1000;
  color: #2f2f32;
`;

const Sub = styled.div`
  margin-top: 6px;
  max-width: 680px;
  color: rgba(47, 47, 50, 0.64);
  font-weight: 900;
  font-size: 12px;
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 14px 0;

  @media (max-width: 1050px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const KpiCard = styled.div`
  background: rgba(255, 255, 255, 0.92);
  border-radius: 22px;
  padding: 16px;
  border: 1px solid rgba(47, 47, 50, 0.1);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:before {
    content: "";
    position: absolute;
    inset: -60px -80px auto auto;
    width: 160px;
    height: 160px;
    border-radius: 999px;
    background: ${(p) =>
      p.$tone === "good"
        ? "rgba(34,197,94,0.14)"
        : p.$tone === "warn"
        ? "rgba(245,158,11,0.14)"
        : p.$tone === "purple"
        ? "rgba(99,102,241,0.14)"
        : "rgba(125,168,193,0.16)"};
    filter: blur(0px);
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 50px rgba(0, 0, 0, 0.08);
  }

  transition: transform 120ms ease, box-shadow 120ms ease;
`;

const KpiTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
`;

const KpiLabel = styled.div`
  font-weight: 1000;
  color: rgba(47, 47, 50, 0.82);
  font-size: 12px;
`;

const KpiValue = styled.div`
  margin-top: 10px;
  font-size: 42px;
  font-weight: 1100;
  color: #2f2f32;
  letter-spacing: -0.02em;
`;

const KpiSub = styled.div`
  margin-top: 6px;
  font-weight: 900;
  font-size: 12px;
  color: rgba(47, 47, 50, 0.6);
`;

const KpiFooter = styled.div`
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SmallLink = styled.div`
  font-weight: 1000;
  font-size: 12px;
  color: rgba(79, 109, 138, 0.95);
`;

const Arrow = styled.div`
  font-weight: 1100;
  color: rgba(47, 47, 50, 0.5);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 12px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.div`
  background: rgba(243, 244, 246, 0.92);
  border: 1px solid rgba(47, 47, 50, 0.1);
  border-radius: 22px;
  overflow: hidden;
`;

const PanelTop = styled.div`
  padding: 14px;
  border-bottom: 1px solid rgba(47, 47, 50, 0.08);
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
`;

const PanelTitle = styled.div`
  font-weight: 1000;
  color: #2f2f32;
`;

const PanelMeta = styled.div`
  font-weight: 900;
  font-size: 11px;
  color: rgba(47, 47, 50, 0.58);
`;

const PanelBody = styled.div`
  padding: 14px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 16px;

  &:hover {
    background: rgba(255, 255, 255, 0.55);
  }
`;

const RowLeft = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const RowLabel = styled.div`
  font-weight: 1000;
  color: rgba(47, 47, 50, 0.8);
`;

const RowValue = styled.div`
  font-weight: 1100;
  color: #2f2f32;
`;

const Divider = styled.div`
  height: 1px;
  background: rgba(47, 47, 50, 0.08);
  margin: 10px 0;
`;

const Dot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: ${(p) =>
    p.$tone === "good"
      ? "rgba(34,197,94,0.8)"
      : p.$tone === "warn"
      ? "rgba(245,158,11,0.9)"
      : p.$tone === "purple"
      ? "rgba(99,102,241,0.9)"
      : p.$tone === "blue"
      ? "rgba(125,168,193,0.95)"
      : "rgba(100,116,139,0.85)"};
`;

const PanelHint = styled.div`
  margin-top: 12px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(47, 47, 50, 0.08);
  background: rgba(255, 255, 255, 0.7);
  font-weight: 900;
  font-size: 12px;
  color: rgba(47, 47, 50, 0.62);
`;

const Split = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1050px) {
    grid-template-columns: 1fr;
  }
`;

const MiniCard = styled.div`
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(47, 47, 50, 0.1);
  border-radius: 22px;
  padding: 14px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.95);
  }
`;

const MiniTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
`;

const MiniLabel = styled.div`
  font-weight: 1000;
  color: rgba(47, 47, 50, 0.72);
  font-size: 12px;
`;

const MiniPill = styled.div`
  font-weight: 1000;
  font-size: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(47, 47, 50, 0.08);
  color: rgba(47, 47, 50, 0.75);
`;

const MiniValue = styled.div`
  margin-top: 10px;
  font-size: 34px;
  font-weight: 1100;
  color: #2f2f32;
`;

const MiniSub = styled.div`
  margin-top: 6px;
  font-weight: 900;
  font-size: 12px;
  color: rgba(47, 47, 50, 0.6);
`;

const Primary = styled.button`
  border: 0;
  cursor: pointer;
  padding: 12px 14px;
  border-radius: 18px;
  font-weight: 1000;
  color: #ffffff;
  background: linear-gradient(180deg, #7da8c1, #4f6d8a);

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

const Ghost = styled.button`
  border: 1px solid rgba(47, 47, 50, 0.14);
  cursor: pointer;
  padding: 12px 14px;
  border-radius: 18px;
  font-weight: 1000;
  color: #2f2f32;
  background: rgba(255, 255, 255, 0.92);
`;

const Pill = styled.div`
  font-weight: 1000;
  font-size: 10px;
  padding: 6px 10px;
  border-radius: 999px;

  background: ${(p) =>
    p.$tone === "good"
      ? "rgba(34,197,94,0.14)"
      : p.$tone === "warn"
      ? "rgba(245,158,11,0.14)"
      : p.$tone === "purple"
      ? "rgba(99,102,241,0.14)"
      : "rgba(125,168,193,0.16)"};

  color: ${(p) =>
    p.$tone === "good"
      ? "rgba(20,83,45,0.92)"
      : p.$tone === "warn"
      ? "rgba(124,45,18,0.92)"
      : p.$tone === "purple"
      ? "rgba(49,46,129,0.92)"
      : "rgba(30,64,175,0.92)"};
`;
