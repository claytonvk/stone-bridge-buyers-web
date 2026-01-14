import React, { useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";

/**
 * Admin SMS Campaign Builder (UI-only)
 * - No Twilio integration yet
 * - Stores drafts in local state for now
 * - You can swap to Supabase later easily
 */

const DEFAULT_SAMPLE = {
  first_name: "Clay",
  last_name: "Vander Kolk",
  city: "Haleiwa",
  state: "HI",
  phone: "(808) 555-1234",
};

const MERGE_FIELDS = [
  { key: "first_name", label: "First name" },
  { key: "last_name", label: "Last name" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
];

const AUDIENCES = [
  {
    key: "quote_form_sms_opt_in",
    label: "Quote Form — SMS Opt-In",
    help: "People who checked SMS consent on the quote form.",
  },
  {
    key: "help_agent_sms_opt_in",
    label: "Help Agent — SMS Opt-In",
    help: "People who checked SMS consent on help agent form (if you add it later).",
  },
  {
    key: "all_opt_in",
    label: "All Opt-In",
    help: "All contacts you’ve collected that have SMS consent.",
  },
];

const initialCampaigns = [
  {
    id: "cmp_001",
    name: "New Lead Follow-Up (Draft)",
    type: "one_time",
    audience: "quote_form_sms_opt_in",
    message:
      "Hey {{first_name}} — this is Stone Bridge Buyers. Want a quick cash-offer estimate for {{city}}? Reply YES and we’ll text a few questions.",
    status: "draft",
    schedule: null,
    updated_at: new Date().toISOString(),
  },
];

export default function Sms({ title = "SMS Campaigns" }) {
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [activeId, setActiveId] = useState(initialCampaigns?.[0]?.id || null);

  const active = useMemo(
    () => campaigns.find((c) => c.id === activeId) || null,
    [campaigns, activeId]
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(null);

  const [sample, setSample] = useState(DEFAULT_SAMPLE);

  const openNew = () => {
    const now = new Date().toISOString();
    setDraft({
      id: `cmp_${Math.random().toString(16).slice(2, 8)}`,
      name: "",
      type: "one_time",
      audience: "quote_form_sms_opt_in",
      message: "",
      status: "draft",
      schedule: null,
      updated_at: now,
    });
    setDrawerOpen(true);
  };

  const openEdit = (c) => {
    setDraft({ ...c });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDraft(null);
  };

  const saveDraft = () => {
    if (!draft) return;
    const next = {
      ...draft,
      name: (draft.name || "").trim() || "Untitled campaign",
      updated_at: new Date().toISOString(),
      status: "draft",
    };

    setCampaigns((prev) => {
      const exists = prev.some((x) => x.id === next.id);
      if (exists) return prev.map((x) => (x.id === next.id ? next : x));
      return [next, ...prev];
    });

    setActiveId(next.id);
    setDrawerOpen(false);
    setDraft(null);
  };

  const scheduleCampaign = () => {
    if (!draft) return;
    // UI-only schedule: set a fake schedule time
    const schedule = draft.schedule || new Date(Date.now() + 60 * 60 * 1000).toISOString(); // +1h
    const next = {
      ...draft,
      name: (draft.name || "").trim() || "Untitled campaign",
      schedule,
      updated_at: new Date().toISOString(),
      status: "scheduled",
    };

    setCampaigns((prev) => prev.map((x) => (x.id === next.id ? next : x)));
    setActiveId(next.id);
    setDrawerOpen(false);
    setDraft(null);
  };

  const duplicateCampaign = (c) => {
    const copy = {
      ...c,
      id: `cmp_${Math.random().toString(16).slice(2, 8)}`,
      name: `${c.name} (Copy)`,
      status: "draft",
      schedule: null,
      updated_at: new Date().toISOString(),
    };
    setCampaigns((prev) => [copy, ...prev]);
    setActiveId(copy.id);
  };

  const archiveCampaign = (c) => {
    const ok = window.confirm("Archive this campaign? You can keep it for reference.");
    if (!ok) return;
    setCampaigns((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, status: "archived", updated_at: new Date().toISOString() } : x))
    );
  };

  const deleteCampaign = (c) => {
    const ok = window.confirm("Delete this campaign? This cannot be undone.");
    if (!ok) return;
    setCampaigns((prev) => prev.filter((x) => x.id !== c.id));
    if (activeId === c.id) setActiveId(null);
  };

  return (
    <Page>
      <Top>
        <Left>
          <H1>{title}</H1>
          <Sub>
            Build campaigns now; plug in Twilio later. Keep it consent-only.
          </Sub>
        </Left>

        <Right>
          <Ghost onClick={() => navigate("/admin")}>Back to dashboard</Ghost>
          <Primary onClick={openNew}>New campaign</Primary>
        </Right>
      </Top>

      <Grid>
        <Panel>
          <PanelTop>
            <PanelTitle>Campaigns</PanelTitle>
            <SmallMeta>{campaigns.length} total</SmallMeta>
          </PanelTop>

          <List>
            {campaigns.map((c) => {
              const isActive = c.id === activeId;
              return (
                <Row
                  key={c.id}
                  $active={isActive}
                  onClick={() => setActiveId(c.id)}
                  role="button"
                  tabIndex={0}
                >
                  <RowTop>
                    <RowName>{c.name}</RowName>
                    <Pill $tone={c.status}>{prettyStatus(c.status)}</Pill>
                  </RowTop>

                  <RowMeta>
                    <MetaItem>
                      <strong>Audience:</strong>{" "}
                      <span>{audienceLabel(c.audience)}</span>
                    </MetaItem>
                    <MetaItem>
                      <strong>Type:</strong>{" "}
                      <span>{c.type === "one_time" ? "One-time" : "Drip"}</span>
                    </MetaItem>
                  </RowMeta>

                  <RowBottom>
                    <Tiny>{timeAgo(c.updated_at)}</Tiny>
                    <Tiny>
                      {c.status === "scheduled" && c.schedule
                        ? `Scheduled ${formatShort(c.schedule)}`
                        : " "}
                    </Tiny>
                  </RowBottom>
                </Row>
              );
            })}

            {campaigns.length === 0 && (
              <Empty>
                <strong>No campaigns yet.</strong>
                <div style={{ marginTop: 6, opacity: 0.75 }}>
                  Click “New campaign” to start.
                </div>
              </Empty>
            )}
          </List>
        </Panel>

        <Panel>
          <PanelTop>
            <PanelTitle>Details</PanelTitle>
            <SmallMeta>Preview + actions</SmallMeta>
          </PanelTop>

          {!active ? (
            <Empty>
              <strong>Select a campaign.</strong>
              <div style={{ marginTop: 6, opacity: 0.75 }}>
                Choose one on the left or create a new one.
              </div>
            </Empty>
          ) : (
            <Detail>
              <DetailHeader>
                <DetailTitle>{active.name}</DetailTitle>
                <DetailActions>
                  <Btn onClick={() => openEdit(active)}>Edit</Btn>
                  <Btn onClick={() => duplicateCampaign(active)}>Duplicate</Btn>
                  <DangerGhost onClick={() => archiveCampaign(active)}>Archive</DangerGhost>
                  <Danger onClick={() => deleteCampaign(active)}>Delete</Danger>
                </DetailActions>
              </DetailHeader>

              <Cards>
                <InfoCard>
                  <InfoLabel>Audience</InfoLabel>
                  <InfoValue>{audienceLabel(active.audience)}</InfoValue>
                  <InfoHelp>{audienceHelp(active.audience)}</InfoHelp>
                </InfoCard>

                <InfoCard>
                  <InfoLabel>Status</InfoLabel>
                  <InfoValue>{prettyStatus(active.status)}</InfoValue>
                  <InfoHelp>
                    {active.status === "scheduled"
                      ? `Scheduled for ${formatShort(active.schedule)}`
                      : active.status === "draft"
                      ? "Draft — not sending anything yet."
                      : "Archived — kept for reference."}
                  </InfoHelp>
                </InfoCard>

                <InfoCard>
                  <InfoLabel>Message</InfoLabel>
                  <InfoValue style={{ whiteSpace: "pre-wrap" }}>
                    {active.message || "—"}
                  </InfoValue>
                </InfoCard>
              </Cards>

              <PreviewBlock>
                <PreviewTop>
                  <PreviewTitle>Preview</PreviewTitle>
                  <PreviewMeta>
                    Use merge fields like <code>{"{{first_name}}"}</code>
                  </PreviewMeta>
                </PreviewTop>

                <PreviewGrid>
                  <PreviewPhone>
                    <PhoneTop>
                      <BubbleTitle>Stone Bridge Buyers</BubbleTitle>
                      <BubbleSub>Text message preview</BubbleSub>
                    </PhoneTop>

                    <Bubble>
                      {renderMerged(active.message || "", sample) || (
                        <span style={{ opacity: 0.6 }}>Your message preview will appear here.</span>
                      )}
                    </Bubble>

                    <Compliance>
                      <strong>Compliance:</strong> include STOP/HELP language in your actual send
                      flow, and only message people with explicit consent.
                    </Compliance>
                  </PreviewPhone>

                  <SampleCard>
                    <SampleTitle>Sample recipient</SampleTitle>
                    <SampleGrid>
                      <MiniField>
                        <MiniLabel>First name</MiniLabel>
                        <MiniInput
                          value={sample.first_name}
                          onChange={(e) => setSample((p) => ({ ...p, first_name: e.target.value }))}
                        />
                      </MiniField>
                      <MiniField>
                        <MiniLabel>City</MiniLabel>
                        <MiniInput
                          value={sample.city}
                          onChange={(e) => setSample((p) => ({ ...p, city: e.target.value }))}
                        />
                      </MiniField>
                      <MiniField>
                        <MiniLabel>State</MiniLabel>
                        <MiniInput
                          value={sample.state}
                          onChange={(e) => setSample((p) => ({ ...p, state: e.target.value }))}
                        />
                      </MiniField>
                      <MiniField>
                        <MiniLabel>Phone</MiniLabel>
                        <MiniInput
                          value={sample.phone}
                          onChange={(e) => setSample((p) => ({ ...p, phone: e.target.value }))}
                        />
                      </MiniField>
                    </SampleGrid>
                  </SampleCard>
                </PreviewGrid>
              </PreviewBlock>
            </Detail>
          )}
        </Panel>
      </Grid>

      {/* Drawer */}
      {drawerOpen && (
        <DrawerOverlay onMouseDown={closeDrawer}>
          <Drawer onMouseDown={(e) => e.stopPropagation()}>
            <DrawerTop>
              <DrawerTitle>{draft?.name?.trim() ? "Edit campaign" : "New campaign"}</DrawerTitle>
              <X onClick={closeDrawer} aria-label="Close">✕</X>
            </DrawerTop>

            <DrawerBody>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <FieldInput
                  value={draft?.name ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: New lead follow-up"
                />
              </Field>

              <TwoCol>
                <Field>
                  <FieldLabel>Type</FieldLabel>
                  <Select
                    value={draft?.type ?? "one_time"}
                    onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value }))}
                  >
                    <option value="one_time">One-time broadcast</option>
                    <option value="drip">Drip sequence (placeholder)</option>
                  </Select>
                  <FieldHelp>
                    Drip is UI-only right now; later you can define steps + delays.
                  </FieldHelp>
                </Field>

                <Field>
                  <FieldLabel>Audience</FieldLabel>
                  <Select
                    value={draft?.audience ?? "quote_form_sms_opt_in"}
                    onChange={(e) => setDraft((p) => ({ ...p, audience: e.target.value }))}
                  >
                    {AUDIENCES.map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.label}
                      </option>
                    ))}
                  </Select>
                  <FieldHelp>{audienceHelp(draft?.audience)}</FieldHelp>
                </Field>
              </TwoCol>

              <Composer>
                <ComposerTop>
                  <FieldLabel>Message</FieldLabel>
                  <Counter>
                    {smsInfo(draft?.message || "").chars} chars •{" "}
                    {smsInfo(draft?.message || "").segments} segment
                    {smsInfo(draft?.message || "").segments === 1 ? "" : "s"}
                  </Counter>
                </ComposerTop>

                <TextArea
                  value={draft?.message ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Write your SMS… (use merge fields like {{first_name}})"
                />

                <MergeRow>
                  <MergeLabel>Insert merge field:</MergeLabel>
                  <MergeBtns>
                    {MERGE_FIELDS.map((f) => (
                      <MiniBtn
                        key={f.key}
                        type="button"
                        onClick={() => {
                          const token = `{{${f.key}}}`;
                          setDraft((p) => ({ ...p, message: (p?.message || "") + token }));
                        }}
                      >
                        {f.label}
                      </MiniBtn>
                    ))}
                  </MergeBtns>
                </MergeRow>

                <MiniPreview>
                  <MiniPreviewTitle>Preview</MiniPreviewTitle>
                  <MiniBubble>
                    {renderMerged(draft?.message || "", sample) || (
                      <span style={{ opacity: 0.6 }}>
                        Start typing to preview your message.
                      </span>
                    )}
                  </MiniBubble>

                  <Warn>
                    <strong>Reminder:</strong> only message people who explicitly opted in. Your
                    actual sending flow should include STOP/HELP instructions.
                  </Warn>
                </MiniPreview>
              </Composer>
            </DrawerBody>

            <DrawerBottom>
              <Ghost onClick={closeDrawer}>Cancel</Ghost>
              <Btn onClick={saveDraft}>Save draft</Btn>
              <Primary onClick={scheduleCampaign} disabled={!draft?.message?.trim()}>
                Schedule
              </Primary>
            </DrawerBottom>
          </Drawer>
        </DrawerOverlay>
      )}
    </Page>
  );
}

/* helpers */

function audienceLabel(key) {
  return AUDIENCES.find((a) => a.key === key)?.label || "Unknown audience";
}
function audienceHelp(key) {
  return AUDIENCES.find((a) => a.key === key)?.help || " ";
}
function prettyStatus(s) {
  if (s === "draft") return "Draft";
  if (s === "scheduled") return "Scheduled";
  if (s === "archived") return "Archived";
  return s || "—";
}
function formatShort(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}
function timeAgo(iso) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const d = Date.now() - t;
  const m = Math.floor(d / 60000);
  if (m < 1) return "Updated just now";
  if (m < 60) return `Updated ${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Updated ${h}h ago`;
  const days = Math.floor(h / 24);
  return `Updated ${days}d ago`;
}
function renderMerged(text, sample) {
  if (!text) return "";
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const v = sample?.[key];
    return v !== undefined && v !== null && String(v).trim() !== "" ? String(v) : `{{${key}}}`;
  });
}
function smsInfo(text) {
  const chars = (text || "").length;
  const isUnicode = /[^\u0000-\u007F]/.test(text || "");
  const per = isUnicode ? 70 : 160;
  const segments = Math.max(1, Math.ceil(chars / per));
  return { chars, segments, per };
}

/* styles */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  min-height: calc(100vh - 40px);
  padding: 22px;
  box-sizing: border-box;
  animation: ${fadeIn} 180ms ease-out;
`;

const Top = styled.div`
  max-width: 1800px;
  margin: 0 auto 18px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-end;
`;

const Left = styled.div``;

const Right = styled.div`
  display: flex;
  gap: 10px;
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
  max-width: 1800px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 14px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.div`
  background: rgba(243, 244, 246, 0.92);
  border: 1px solid rgba(47, 47, 50, 0.10);
  border-radius: 22px;
  overflow: hidden;
`;

const PanelTop = styled.div`
  padding: 14px;
  border-bottom: 1px solid rgba(47, 47, 50, 0.08);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
`;

const PanelTitle = styled.div`
  font-weight: 900;
  color: #2f2f32;
`;

const SmallMeta = styled.div`
  font-weight: 900;
  font-size: 11px;
  color: rgba(47, 47, 50, 0.62);
`;

const List = styled.div`
  padding: 10px;
  display: grid;
  gap: 10px;
`;

const Row = styled.div`
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(47, 47, 50, 0.10);
  background: ${(p) => (p.$active ? "rgba(125, 168, 193, 0.18)" : "rgba(255,255,255,0.85)")};
  cursor: pointer;

  &:hover {
    background: ${(p) => (p.$active ? "rgba(125, 168, 193, 0.22)" : "rgba(255,255,255,0.92)")};
  }
`;

const RowTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
`;

const RowName = styled.div`
  font-weight: 900;
  color: #2f2f32;
  font-size: 13px;
`;

const Pill = styled.div`
  font-weight: 900;
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 999px;

  background: ${(p) =>
    p.$tone === "scheduled"
      ? "rgba(34, 197, 94, 0.14)"
      : p.$tone === "archived"
      ? "rgba(107, 114, 128, 0.12)"
      : "rgba(125, 168, 193, 0.16)"};

  color: ${(p) =>
    p.$tone === "scheduled"
      ? "rgba(20, 83, 45, 0.92)"
      : p.$tone === "archived"
      ? "rgba(55, 65, 81, 0.92)"
      : "rgba(30, 64, 175, 0.92)"};
`;

const RowMeta = styled.div`
  margin-top: 8px;
  display: grid;
  gap: 6px;
`;

const MetaItem = styled.div`
  font-size: 12px;
  font-weight: 800;
  color: rgba(47, 47, 50, 0.78);

  strong {
    font-weight: 900;
  }
`;

const RowBottom = styled.div`
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
`;

const Tiny = styled.div`
  font-size: 11px;
  font-weight: 900;
  color: rgba(47, 47, 50, 0.55);
`;

const Detail = styled.div`
  padding: 14px;
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
`;

const DetailTitle = styled.div`
  font-weight: 900;
  color: #2f2f32;
  font-size: 16px;
`;

const DetailActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Cards = styled.div`
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const InfoCard = styled.div`
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(47, 47, 50, 0.10);
  border-radius: 18px;
  padding: 12px;
`;

const InfoLabel = styled.div`
  font-weight: 900;
  font-size: 11px;
  color: rgba(47, 47, 50, 0.60);
`;

const InfoValue = styled.div`
  margin-top: 6px;
  font-weight: 900;
  color: #2f2f32;
  font-size: 13px;
`;

const InfoHelp = styled.div`
  margin-top: 6px;
  font-weight: 800;
  font-size: 12px;
  color: rgba(47, 47, 50, 0.62);
`;

const PreviewBlock = styled.div`
  margin-top: 12px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(47, 47, 50, 0.10);
  border-radius: 18px;
  padding: 12px;
`;

const PreviewTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  align-items: baseline;
`;

const PreviewTitle = styled.div`
  font-weight: 900;
  color: #2f2f32;
`;

const PreviewMeta = styled.div`
  font-weight: 900;
  font-size: 11px;
  color: rgba(47, 47, 50, 0.62);

  code {
    font-weight: 900;
    padding: 2px 6px;
    border-radius: 10px;
    background: rgba(47, 47, 50, 0.06);
  }
`;

const PreviewGrid = styled.div`
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 10px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const PreviewPhone = styled.div`
  border-radius: 18px;
  border: 1px solid rgba(47, 47, 50, 0.10);
  background: rgba(243, 244, 246, 0.55);
  padding: 12px;
`;

const PhoneTop = styled.div`
  margin-bottom: 8px;
`;

const BubbleTitle = styled.div`
  font-weight: 900;
  color: #2f2f32;
`;

const BubbleSub = styled.div`
  font-weight: 800;
  font-size: 12px;
  color: rgba(47, 47, 50, 0.62);
`;

const Bubble = styled.div`
  margin-top: 10px;
  display: inline-block;
  max-width: 560px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(125, 168, 193, 0.18);
  border: 1px solid rgba(125, 168, 193, 0.28);
  font-weight: 900;
  color: #2f2f32;
  white-space: pre-wrap;
`;

const Compliance = styled.div`
  margin-top: 10px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(47, 47, 50, 0.70);

  strong {
    font-weight: 900;
  }
`;

const SampleCard = styled.div`
  border-radius: 18px;
  border: 1px solid rgba(47, 47, 50, 0.10);
  background: rgba(243, 244, 246, 0.55);
  padding: 12px;
`;

const SampleTitle = styled.div`
  font-weight: 900;
  color: #2f2f32;
`;

const SampleGrid = styled.div`
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const MiniField = styled.div``;

const MiniLabel = styled.div`
  font-size: 11px;
  font-weight: 900;
  color: rgba(47, 47, 50, 0.62);
  margin-bottom: 6px;
`;

const MiniInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(47, 47, 50, 0.14);
  background: rgba(255, 255, 255, 0.92);
  font-weight: 800;
  color: #2f2f32;

  &:focus {
    outline: none;
    border-color: #7da8c1;
  }
`;

const Empty = styled.div`
  padding: 18px;
  text-align: center;
  color: rgba(47, 47, 50, 0.78);

  strong {
    color: #2f2f32;
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
    cursor: not-allowed;
    opacity: 0.65;
  }
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
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const Ghost = styled.button`
  border: 1px solid rgba(47, 47, 50, 0.14);
  cursor: pointer;
  padding: 12px 14px;
  border-radius: 18px;
  font-weight: 900;
  color: #2f2f32;
  background: rgba(255, 255, 255, 0.92);
`;

const Danger = styled.button`
  border: 0;
  cursor: pointer;
  padding: 12px 14px;
  border-radius: 18px;
  font-weight: 900;
  background: rgba(239, 68, 68, 0.12);
  color: rgba(127, 29, 29, 0.92);
`;

const DangerGhost = styled.button`
  border: 1px solid rgba(239, 68, 68, 0.20);
  cursor: pointer;
  padding: 12px 14px;
  border-radius: 18px;
  font-weight: 900;
  background: rgba(255, 255, 255, 0.92);
  color: rgba(127, 29, 29, 0.92);
`;

/* Drawer */

const DrawerOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  justify-content: flex-end;
  z-index: 60;
`;

const Drawer = styled.div`
  width: min(720px, 100%);
  height: 100%;
  background: #ffffff;
  border-left: 1px solid rgba(47, 47, 50, 0.10);
  padding: 14px;
  display: flex;
  flex-direction: column;
`;

const DrawerTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(47, 47, 50, 0.08);
`;

const DrawerTitle = styled.div`
  font-weight: 900;
  color: #2f2f32;
  font-size: 16px;
`;

const X = styled.button`
  border: 0;
  background: rgba(47, 47, 50, 0.06);
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 14px;
  font-weight: 900;
`;

const DrawerBody = styled.div`
  padding: 12px 2px;
  overflow: auto;
  display: grid;
  gap: 12px;
`;

const DrawerBottom = styled.div`
  padding-top: 12px;
  border-top: 1px solid rgba(47, 47, 50, 0.08);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
`;

const Field = styled.div``;

const FieldLabel = styled.div`
  font-size: 12px;
  font-weight: 900;
  color: rgba(47, 47, 50, 0.72);
  margin-bottom: 6px;
`;

const FieldHelp = styled.div`
  margin-top: 6px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(47, 47, 50, 0.62);
`;

const FieldInput = styled.input`
  width: 100%;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid rgba(47, 47, 50, 0.14);
  background: rgba(255, 255, 255, 0.96);
  font-weight: 800;
  color: #2f2f32;

  &:focus {
    outline: none;
    border-color: #7da8c1;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid rgba(47, 47, 50, 0.14);
  background: rgba(255, 255, 255, 0.96);
  font-weight: 900;
  color: #2f2f32;

  &:focus {
    outline: none;
    border-color: #7da8c1;
  }
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Composer = styled.div`
  margin-top: 2px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(47, 47, 50, 0.10);
  background: rgba(243, 244, 246, 0.55);
`;

const ComposerTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
`;

const Counter = styled.div`
  font-weight: 900;
  font-size: 11px;
  color: rgba(47, 47, 50, 0.62);
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  margin-top: 8px;
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

const MergeRow = styled.div`
  margin-top: 10px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
`;

const MergeLabel = styled.div`
  font-weight: 900;
  font-size: 12px;
  color: rgba(47, 47, 50, 0.72);
`;

const MergeBtns = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const MiniBtn = styled.button`
  border: 1px solid rgba(47, 47, 50, 0.14);
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.92);
  color: #2f2f32;

  &:hover {
    background: rgba(255, 255, 255, 1);
  }
`;

const MiniPreview = styled.div`
  margin-top: 12px;
`;

const MiniPreviewTitle = styled.div`
  font-weight: 900;
  color: #2f2f32;
  font-size: 12px;
`;

const MiniBubble = styled.div`
  margin-top: 8px;
  display: inline-block;
  max-width: 520px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(125, 168, 193, 0.18);
  border: 1px solid rgba(125, 168, 193, 0.28);
  font-weight: 900;
  color: #2f2f32;
  white-space: pre-wrap;
`;

const Warn = styled.div`
  margin-top: 10px;
  border-radius: 16px;
  padding: 10px 12px;
  border: 1px solid rgba(239, 68, 68, 0.22);
  background: rgba(239, 68, 68, 0.10);
  color: rgba(127, 29, 29, 0.92);
  font-weight: 800;
  font-size: 12px;

  strong {
    font-weight: 900;
  }
`;
