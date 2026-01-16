import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, invokeEdgeWithSecret } from "../../../lib/supabaseClient";

export default function LeadDetail() {
  const nav = useNavigate();
  const { id } = useParams();

  const [lead, setLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);

    const { data: l, error: le } = await supabase
      .from("leads")
      .select(`
        id,
        created_at,
        first_name,
        last_name,
        email,
        raw_phone,
        phone_e164,
        street_address,
        unit,
        city,
        state,
        zipcode,
        can_text,
        sms_subscription,
        consent_marketing,
        opted_out_at,
        status,
        status_updated_at,
        last_contacted_at,
        last_inbound_at,
        source
      `)
      .eq("id", id)
      .single();

    if (le) {
      console.error(le);
      alert(le.message);
      setLoading(false);
      return;
    }

    const { data: n, error: ne } = await supabase
      .from("lead_notes")
      .select("id, type, body, meta, created_at")
      .eq("lead_id", id)
      .order("created_at", { ascending: true });

    if (ne) {
      console.error(ne);
      alert(ne.message);
      setLoading(false);
      return;
    }

    setLead(l);
    setNotes(n || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const name = useMemo(() => {
    if (!lead) return "—";
    return [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "—";
  }, [lead]);

  const phone = useMemo(() => {
    if (!lead) return "—";
    return lead.phone_e164 || lead.raw_phone || "—";
  }, [lead]);

  const canSend = useMemo(() => {
    if (!lead) return false;
    if (lead.opted_out_at || lead.status === "do_not_contact") return false;
    if (lead.can_text !== true) return false;
    if (lead.sms_subscription === false) return false; // allow NULL or TRUE
    return true;
  }, [lead]);

  async function sendManual() {
    if (!msg.trim()) return;

    setSending(true);
    try {
      const res = await invokeEdgeWithSecret("send-manual-sms", {
        lead_id: lead.id,
        body: msg.trim(),
      });

      setMsg("");
      await load();
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Wrap>
      <Top>
        <Left>
          <H1>Lead</H1>
          <Sub>Conversation + manual SMS</Sub>
        </Left>
        <Right>
          <Btn onClick={() => nav(-1)}>Back</Btn>
          <Btn onClick={load}>{loading ? "Loading…" : "Refresh"}</Btn>
        </Right>
      </Top>

      {loading || !lead ? (
        <Card style={{ padding: 18, fontWeight: 900, opacity: 0.8 }}>
          Loading…
        </Card>
      ) : (
        <Grid>
          <Side>
            <Card>
              <TitleRow>
                <Title>{name}</Title>
                <StatusPill $tone={toneForStatus(lead.status)}>
                  {labelForStatus(lead.status)}
                </StatusPill>
              </TitleRow>

              <Meta>
                <div><b>Phone:</b> {phone}</div>
                <div><b>Email:</b> {lead.email || "—"}</div>
                <div><b>Source:</b> {lead.source || "—"}</div>
                <div><b>Created:</b> {fmt(lead.created_at)}</div>
              </Meta>

              <Pills>
                {lead.can_text === true && <Pill $tone="good">Can text</Pill>}
                {lead.can_text === false && <Pill $tone="bad">Cannot text</Pill>}

                {lead.sms_subscription === true && <Pill $tone="good">SMS subscribed</Pill>}
                {lead.sms_subscription === false && <Pill $tone="bad">SMS unsubscribed</Pill>}

                {lead.consent_marketing === true && <Pill $tone="good">Marketing consent</Pill>}
                {lead.consent_marketing === false && <Pill $tone="warn">No marketing consent</Pill>}

                {lead.opted_out_at && <Pill $tone="bad">Opted out</Pill>}
              </Pills>

              <Meta style={{ marginTop: 10 }}>
                <div><b>Status updated:</b> {fmt(lead.status_updated_at)}</div>
                <div><b>Last inbound:</b> {fmt(lead.last_inbound_at)}</div>
                <div><b>Last contacted:</b> {fmt(lead.last_contacted_at)}</div>
              </Meta>
            </Card>

            <Card>
              <SectionTitle>Manual SMS</SectionTitle>

              {!canSend ? (
                <WarnBox>
                  You can’t send right now (opted out, do_not_contact, can_text=false, or sms_subscription=false).
                </WarnBox>
              ) : (
                <>
                  <TextArea
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    placeholder="Type a message…"
                  />
                  <Row>
                    <SmallMeta>
                      {smsInfo(msg).chars} chars • {smsInfo(msg).segments} segment{smsInfo(msg).segments === 1 ? "" : "s"}
                    </SmallMeta>
                    <Primary onClick={sendManual} disabled={sending || !msg.trim()}>
                      {sending ? "Sending…" : "Send"}
                    </Primary>
                  </Row>
                </>
              )}
            </Card>
          </Side>

          <Main>
            <Card style={{ padding: 0 }}>
              <ThreadTop>
                <SectionTitle style={{ margin: 0 }}>Thread</SectionTitle>
                <SmallMeta>{notes.length} messages</SmallMeta>
              </ThreadTop>

              <Thread>
                {notes.length === 0 ? (
                  <Empty>Nothing yet.</Empty>
                ) : (
                  notes.map((n) => {
                    const inbound = n.type === "sms_inbound";
                    const outbound = n.type === "sms_outbound";

                    return (
                      <BubbleRow key={n.id} $side={inbound ? "left" : outbound ? "right" : "center"}>
                        <Bubble $tone={inbound ? "in" : outbound ? "out" : "note"}>
                          <BubbleMeta>
                            <b>{labelForNoteType(n.type)}</b>
                            <span>{fmt(n.created_at)}</span>
                          </BubbleMeta>
                          <BubbleBody>{n.body}</BubbleBody>

                          {n.meta?.twilio_sid && (
                            <BubbleMeta style={{ marginTop: 8, opacity: 0.7 }}>
                              SID: {n.meta.twilio_sid}
                            </BubbleMeta>
                          )}
                        </Bubble>
                      </BubbleRow>
                    );
                  })
                )}
              </Thread>
            </Card>
          </Main>
        </Grid>
      )}
    </Wrap>
  );
}

/* helpers */

function fmt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function smsInfo(text) {
  const chars = (text || "").length;
  const isUnicode = /[^\u0000-\u007F]/.test(text || "");
  const per = isUnicode ? 70 : 160;
  const segments = Math.max(1, Math.ceil(chars / per));
  return { chars, segments };
}

function labelForStatus(s) {
  const map = {
    new: "New",
    contacted: "Contacted",
    engaged: "Engaged",
    interested: "Interested",
    do_not_contact: "Do not contact",
  };
  return map[s] || (s ? s.replaceAll("_", " ") : "—");
}

function toneForStatus(s) {
  if (s === "interested" || s === "engaged") return "good";
  if (s === "contacted") return "warn";
  if (s === "do_not_contact") return "bad";
  return "warn";
}

function labelForNoteType(t) {
  if (t === "sms_inbound") return "Inbound";
  if (t === "sms_outbound") return "Outbound";
  return "Note";
}

/* styles */

const Wrap = styled.div`
  max-width: 1800px;
  margin: 0 auto;
  padding: 22px;
`;

const Top = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

const Left = styled.div``;
const Right = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const H1 = styled.h1`
  margin: 0;
  font-size: 26px;
  font-weight: 900;
  color: #2f2f32;
`;

const Sub = styled.div`
  margin-top: 6px;
  color: rgba(47, 47, 50, 0.68);
  font-weight: 800;
  font-size: 12px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 14px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Side = styled.div`
  display: grid;
  gap: 12px;
`;

const Main = styled.div``;

const Card = styled.div`
  background: rgba(243, 244, 246, 0.92);
  border: 1px solid rgba(47, 47, 50, 0.1);
  border-radius: 22px;
  overflow: hidden;
  padding: 14px;
`;

const Btn = styled.button`
  border: 0;
  cursor: pointer;
  padding: 12px 14px;
  border-radius: 18px;
  font-weight: 900;
  color: #2f2f32;
  background: rgba(47, 47, 50, 0.08);

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Primary = styled.button`
  border: 0;
  cursor: pointer;
  padding: 12px 14px;
  border-radius: 18px;
  font-weight: 900;
  color: #ffffff;
  background: linear-gradient(180deg, #7da8c1, #4f6d8a);

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
`;

const Title = styled.div`
  font-weight: 1000;
  font-size: 16px;
  color: #2f2f32;
`;

const Meta = styled.div`
  margin-top: 10px;
  display: grid;
  gap: 6px;
  font-weight: 800;
  font-size: 12px;
  color: rgba(47, 47, 50, 0.78);

  b {
    font-weight: 900;
  }
`;

const Pills = styled.div`
  margin-top: 10px;
`;

const Pill = styled.span`
  display: inline-block;
  margin-right: 8px;
  margin-bottom: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 11px;

  background: ${(p) =>
    p.$tone === "good"
      ? "rgba(34, 197, 94, 0.14)"
      : p.$tone === "warn"
      ? "rgba(245, 158, 11, 0.14)"
      : "rgba(239, 68, 68, 0.12)"};

  color: ${(p) =>
    p.$tone === "good"
      ? "rgba(20, 83, 45, 0.92)"
      : p.$tone === "warn"
      ? "rgba(124, 45, 18, 0.92)"
      : "rgba(127, 29, 29, 0.92)"};
`;

const StatusPill = styled.span`
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 11px;

  background: ${(p) =>
    p.$tone === "good"
      ? "rgba(34, 197, 94, 0.14)"
      : p.$tone === "warn"
      ? "rgba(245, 158, 11, 0.14)"
      : "rgba(239, 68, 68, 0.12)"};

  color: ${(p) =>
    p.$tone === "good"
      ? "rgba(20, 83, 45, 0.92)"
      : p.$tone === "warn"
      ? "rgba(124, 45, 18, 0.92)"
      : "rgba(127, 29, 29, 0.92)"};
`;

const SectionTitle = styled.div`
  font-weight: 1000;
  color: #2f2f32;
  font-size: 13px;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 110px;
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(47, 47, 50, 0.14);
  background: rgba(255, 255, 255, 0.92);
  font-weight: 800;
  color: #2f2f32;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #7da8c1;
  }
`;

const Row = styled.div`
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
`;

const SmallMeta = styled.div`
  font-weight: 900;
  font-size: 11px;
  color: rgba(47, 47, 50, 0.62);
`;

const WarnBox = styled.div`
  margin-top: 10px;
  border-radius: 16px;
  padding: 10px 12px;
  border: 1px solid rgba(239, 68, 68, 0.22);
  background: rgba(239, 68, 68, 0.10);
  color: rgba(127, 29, 29, 0.92);
  font-weight: 900;
  font-size: 12px;
`;

const ThreadTop = styled.div`
  padding: 14px;
  border-bottom: 1px solid rgba(47, 47, 50, 0.08);
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
`;

const Thread = styled.div`
  padding: 14px;
  display: grid;
  gap: 10px;
  background: rgba(255, 255, 255, 0.6);
`;

const Empty = styled.div`
  padding: 18px;
  text-align: center;
  font-weight: 900;
  opacity: 0.7;
`;

const BubbleRow = styled.div`
  display: flex;
  justify-content: ${(p) =>
    p.$side === "left" ? "flex-start" : p.$side === "right" ? "flex-end" : "center"};
`;

const Bubble = styled.div`
  width: min(720px, 100%);
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba(47, 47, 50, 0.10);
  background: ${(p) =>
    p.$tone === "in"
      ? "rgba(125, 168, 193, 0.18)"
      : p.$tone === "out"
      ? "rgba(34, 197, 94, 0.14)"
      : "rgba(243, 244, 246, 0.9)"};
`;

const BubbleMeta = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-weight: 900;
  font-size: 11px;
  color: rgba(47, 47, 50, 0.62);

  b {
    color: rgba(47, 47, 50, 0.78);
  }
`;

const BubbleBody = styled.div`
  margin-top: 8px;
  font-weight: 900;
  color: #2f2f32;
  white-space: pre-wrap;
`;
