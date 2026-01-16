import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { supabase } from "../../lib/supabaseClient";

/**
 * SMS Automations (v2)
 *
 * Source of truth lives in DB:
 * - sms_flows
 * - sms_flow_steps
 * - lead_flow_enrollments
 * - sms_outbox
 * - lead_notes
 *
 * Twilio:
 * - inbound webhook -> Edge Function twilio-inbound (writes lead_notes, updates consent/status, advances flow)
 * - outbound worker -> Edge Function sms-worker on cron (sends sms_outbox, writes lead_notes, advances flow)
 */

const COMPLIANCE_FOOTER = "\n\nReply STOP to unsubscribe or HELP for help.";

const MERGE_FIELDS = [
  { key: "first_name", label: "First name" },
  { key: "last_name", label: "Last name" },
  { key: "street_address", label: "Street address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
];

const STATUSES = [
  "new",
  "contacted",
  "engaged",
  "interested",
  "do_not_contact",
];

const DEFAULT_SAMPLE = {
  first_name: "Joe",
  last_name: "Smith",
  street_address: "123 Main St",
  city: "Houston",
  state: "TX",
};

export default function Sms() {
  const [flows, setFlows] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loadingList, setLoadingList] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(null);

  const [sample, setSample] = useState(DEFAULT_SAMPLE);

  const [activeSteps, setActiveSteps] = useState([]);

  // enrollment UI
  const [enrollStatus, setEnrollStatus] = useState("new");
  const [enrollLimit, setEnrollLimit] = useState(200);
  const [enrolling, setEnrolling] = useState(false);

  // inbox UI
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  const active = useMemo(
    () => flows.find((f) => f.id === activeId) || null,
    [flows, activeId]
  );

  async function reloadFlows(selectId = null) {
    setLoadingList(true);
    const { data, error } = await supabase
      .from("sms_flows")
      .select("id, name, status, kind, created_at, updated_at, description")
      .order("updated_at", { ascending: false });

    setLoadingList(false);
    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setFlows(data || []);
    if (selectId) setActiveId(selectId);
    else setActiveId((data?.[0]?.id) || null);
  }

  async function fetchSteps(flowId) {
    const { data, error } = await supabase
      .from("sms_flow_steps")
      .select("id, step_order, delay_minutes, body, set_status")
      .eq("flow_id", flowId)
      .order("step_order", { ascending: true });

    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  }

  async function loadInbox() {
    setLoadingNotes(true);

    // show recent inbound notes across leads
    const { data, error } = await supabase
      .from("lead_notes")
      .select(`
        id,
        lead_id,
        type,
        body,
        created_at,
        leads:lead_id ( id, first_name, last_name, raw_phone, phone_e164, status )
      `)
      .in("type", ["sms_inbound"])
      .order("created_at", { ascending: false })
      .limit(50);

    setLoadingNotes(false);

    if (error) {
      console.error(error);
      return;
    }
    setNotes(data || []);
  }

  useEffect(() => {
    reloadFlows();
    loadInbox();
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!activeId) {
        setActiveSteps([]);
        return;
      }
      const steps = await fetchSteps(activeId);
      if (!alive) return;
      setActiveSteps(steps || []);
    })();
    return () => {
      alive = false;
    };
  }, [activeId]);

  function openNewFlow() {
    setDraft({
      id: null,
      name: "",
      description: "",
      status: "draft", // draft|active|paused
      kind: "transactional", // transactional|marketing
      steps: [{ id: null, step_order: 0, delay_minutes: 0, body: "", set_status: null }],
    });
    setDrawerOpen(true);
  }

  async function openEditFlow(flow) {
    const steps = await fetchSteps(flow.id);
    setDraft({
      id: flow.id,
      name: flow.name || "",
      description: flow.description || "",
      status: flow.status || "draft",
      kind: flow.kind || "transactional",
      steps:
        steps.length > 0
          ? steps.map((s) => ({
              id: s.id,
              step_order: s.step_order ?? 0,
              delay_minutes: Number(s.delay_minutes ?? 0),
              body: s.body ?? "",
              set_status: s.set_status ?? null,
            }))
          : [{ id: null, step_order: 0, delay_minutes: 0, body: "", set_status: null }],
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setDraft(null);
  }

  function normalizeSteps(steps) {
    return (steps || []).map((s, idx) => ({
      ...s,
      step_order: idx,
      delay_minutes: Math.max(0, Math.floor(Number(s.delay_minutes ?? 0))),
      body: s.body ?? "",
      set_status: s.set_status || null,
    }));
  }

  async function saveFlow({ keepDrawerOpen = false } = {}) {
    if (!draft) return null;

    const name = (draft.name || "").trim() || "Untitled flow";
    const payload = {
      ...(draft.id ? { id: draft.id } : {}),
      name,
      description: (draft.description || "").trim() || null,
      status: draft.status || "draft",
      kind: draft.kind || "transactional",
      updated_at: new Date().toISOString(),
    };

    const { data: flow, error: flowErr } = await supabase
      .from("sms_flows")
      .upsert(payload)
      .select("id")
      .single();

    if (flowErr) throw new Error(flowErr.message);

    const flowId = flow.id;

    const existing = await fetchSteps(flowId);
    const existingIds = new Set(existing.map((s) => s.id));

    const steps = normalizeSteps(draft.steps);

    // upsert steps
    for (const s of steps) {
      let body = s.body || "";
      if (body && !body.includes("STOP to unsubscribe")) body += COMPLIANCE_FOOTER;

      const stepPayload = {
        ...(s.id ? { id: s.id } : {}),
        flow_id: flowId,
        step_order: s.step_order,
        delay_minutes: s.delay_minutes,
        body,
        set_status: s.set_status,
      };

      const { error } = await supabase.from("sms_flow_steps").upsert(stepPayload);
      if (error) throw new Error(`Step ${s.step_order + 1}: ${error.message}`);
    }

    // delete removed
    const keptIds = new Set(steps.map((s) => s.id).filter(Boolean));
    const toDelete = [...existingIds].filter((id) => id && !keptIds.has(id));
    if (toDelete.length) {
      const { error } = await supabase.from("sms_flow_steps").delete().in("id", toDelete);
      if (error) throw new Error(`Delete removed steps: ${error.message}`);
    }

    await reloadFlows(flowId);
    setDraft((p) => (p ? { ...p, id: flowId, steps } : p));

    if (!keepDrawerOpen) closeDrawer();
    return flowId;
  }

  function addStep() {
    setDraft((p) => {
      if (!p) return p;
      const next = normalizeSteps([
        ...(p.steps || []),
        { id: null, step_order: (p.steps || []).length, delay_minutes: 60, body: "", set_status: null },
      ]);
      return { ...p, steps: next };
    });
  }

  function removeStep(idx) {
    setDraft((p) => {
      if (!p) return p;
      const next = (p.steps || []).filter((_, i) => i !== idx);
      const normalized = normalizeSteps(next.length ? next : [{ id: null, step_order: 0, delay_minutes: 0, body: "", set_status: null }]);
      return { ...p, steps: normalized };
    });
  }

  function moveStep(idx, dir) {
    setDraft((p) => {
      if (!p) return p;
      const arr = [...(p.steps || [])];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return p;
      const tmp = arr[idx];
      arr[idx] = arr[j];
      arr[j] = tmp;
      return { ...p, steps: normalizeSteps(arr) };
    });
  }

  async function enrollByStatus() {
    if (!active?.id) return;

    setEnrolling(true);
    try {
      // RPC is cleanest; if you don’t have it yet, I’ll give you SQL next.
      const { data, error } = await supabase.rpc("enroll_leads_into_flow", {
        p_flow_id: active.id,
        p_status: enrollStatus,
        p_limit: enrollLimit,
      });

      if (error) throw error;

      alert(
        `Enrolled ${data?.enrolled ?? 0} lead(s) into "${active.name}".\nOutbox queued: ${data?.outbox_added ?? 0}`
      );
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setEnrolling(false);
    }
  }

  return (
    <Page>
      <Top>
        <Left>
          <H1>SMS</H1>
          <Sub>Manage Twilio-driven SMS automation flows (DB is the source of truth).</Sub>
        </Left>
        <Right>
          <Primary onClick={openNewFlow}>New flow</Primary>
          <Btn onClick={() => { reloadFlows(activeId); loadInbox(); }}>
            Refresh
          </Btn>
        </Right>
      </Top>

      <Grid>
        {/* LEFT: flows list */}
        <Panel>
          <PanelTop>
            <PanelTitle>Flows</PanelTitle>
            <SmallMeta>{loadingList ? "Loading…" : `${flows.length} total`}</SmallMeta>
          </PanelTop>

          <List>
            {flows.map((f) => (
              <Row key={f.id} $active={f.id === activeId} onClick={() => setActiveId(f.id)}>
                <RowTop>
                  <RowName>{f.name}</RowName>
                  <Pill $tone={f.status}>{prettyFlowStatus(f.status)}</Pill>
                </RowTop>
                <RowMeta>
                  <MetaItem>
                    <strong>Kind:</strong> <span>{f.kind}</span>
                  </MetaItem>
                  <MetaItem>
                    <strong>Updated:</strong> <span>{timeAgo(f.updated_at)}</span>
                  </MetaItem>
                </RowMeta>
              </Row>
            ))}

            {!loadingList && flows.length === 0 && (
              <Empty>
                <strong>No flows yet.</strong>
                <div style={{ marginTop: 6, opacity: 0.75 }}>Click “New flow” to build your automation.</div>
              </Empty>
            )}
          </List>
        </Panel>

        {/* RIGHT: details */}
        <Panel>
          <PanelTop>
            <PanelTitle>Flow details</PanelTitle>
            <SmallMeta>Builder + enroll + preview</SmallMeta>
          </PanelTop>

          {!active ? (
            <Empty>
              <strong>Select a flow.</strong>
              <div style={{ marginTop: 6, opacity: 0.75 }}>Choose one on the left or create a new one.</div>
            </Empty>
          ) : (
            <Detail>
              <DetailHeader>
                <DetailTitle>{active.name}</DetailTitle>
                <DetailActions>
                  <Btn onClick={() => openEditFlow(active)}>Edit</Btn>
                </DetailActions>
              </DetailHeader>

              <Cards>
                <InfoCard>
                  <InfoLabel>Kind</InfoLabel>
                  <InfoValue style={{ textTransform: "capitalize" }}>{active.kind}</InfoValue>
                  <InfoHelp>
                    {active.kind === "marketing"
                      ? "Requires SMS subscription + marketing consent (enforced by worker/enroll)."
                      : "Requires SMS subscription OR can_text true for first outreach (your rule)."}
                  </InfoHelp>
                </InfoCard>

                <InfoCard>
                  <InfoLabel>Status</InfoLabel>
                  <InfoValue>{prettyFlowStatus(active.status)}</InfoValue>
                  <InfoHelp>Active flows can auto-enroll + send steps.</InfoHelp>
                </InfoCard>

                <InfoCard>
                  <InfoLabel>Enrollment</InfoLabel>
                  <InfoValue>By bucket</InfoValue>
                  <InfoHelp>Enroll leads from a lead status bucket into this flow.</InfoHelp>
                </InfoCard>
              </Cards>

              {/* ENROLL */}
              <Section>
                <SectionTop>
                  <SectionTitle>Enroll leads</SectionTitle>
                </SectionTop>

                <TwoCol>
                  <Field>
                    <FieldLabel>Lead status bucket</FieldLabel>
                    <Select
                      value={enrollStatus}
                      onChange={(e) => setEnrollStatus(e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replaceAll("_", " ")}
                        </option>
                      ))}
                    </Select>
                    <FieldHelp>Enroll leads currently in this status.</FieldHelp>
                  </Field>

                  <Field>
                    <FieldLabel>Limit</FieldLabel>
                    <FieldInput
                      type="number"
                      min="1"
                      value={enrollLimit}
                      onChange={(e) => setEnrollLimit(Number(e.target.value || 0))}
                    />
                    <FieldHelp>Safety limit for bulk enroll.</FieldHelp>
                  </Field>
                </TwoCol>

                <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                  <Primary onClick={enrollByStatus} disabled={enrolling}>
                    {enrolling ? "Enrolling…" : "Enroll into flow"}
                  </Primary>
                </div>
              </Section>

              {/* PREVIEW */}
              <Section>
                <SectionTop>
                  <SectionTitle>Preview steps</SectionTitle>
                  <SmallMeta>{activeSteps?.length ? `${activeSteps.length} step(s)` : "No steps"}</SmallMeta>
                </SectionTop>

                <SampleCard>
                  <SampleTitle>Sample lead</SampleTitle>
                  <SampleGrid>
                    {Object.entries(sample).map(([k, v]) => (
                      <MiniField key={k}>
                        <MiniLabel>{k.replaceAll("_", " ")}</MiniLabel>
                        <MiniInput
                          value={v}
                          onChange={(e) => setSample((p) => ({ ...p, [k]: e.target.value }))}
                        />
                      </MiniField>
                    ))}
                  </SampleGrid>
                </SampleCard>

                <PreviewPhone style={{ marginTop: 12 }}>
                  {(!activeSteps || activeSteps.length === 0) ? (
                    <div style={{ opacity: 0.7, fontWeight: 900 }}>
                      No steps yet. Click Edit and add Step 1.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                      {activeSteps.map((s) => (
                        <div key={s.id || s.step_order}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ fontWeight: 900, color: "#2f2f32" }}>
                              Step {s.step_order + 1}
                            </div>
                            <div style={{ fontWeight: 900, color: "rgba(47,47,50,0.62)", fontSize: 12 }}>
                              Delay: {s.delay_minutes} min
                              {s.set_status ? ` • Sets status: ${s.set_status}` : ""}
                            </div>
                          </div>
                          <Bubble>
                            {renderMerged(s.body || "", sample) || (
                              <span style={{ opacity: 0.6 }}>Empty message</span>
                            )}
                          </Bubble>
                        </div>
                      ))}
                    </div>
                  )}
                </PreviewPhone>
              </Section>

              {/* INBOX */}
              <Section>
                <SectionTop>
                  <SectionTitle>Recent inbound (Twilio)</SectionTitle>
                  <SmallMeta>{loadingNotes ? "Loading…" : `${notes.length} messages`}</SmallMeta>
                </SectionTop>

                <Inbox>
                  {notes.map((n) => {
                    const lead = n.leads || {};
                    const name =
                      [lead.first_name, lead.last_name].filter(Boolean).join(" ") ||
                      lead.raw_phone ||
                      lead.phone_e164 ||
                      "Lead";
                    return (
                      <InboxRow key={n.id}>
                        <InboxTop>
                          <div style={{ fontWeight: 900 }}>{name}</div>
                          <div style={{ fontWeight: 900, opacity: 0.6, fontSize: 12 }}>
                            {formatShort(n.created_at)} • {lead.status || "—"}
                          </div>
                        </InboxTop>
                        <InboxBody>{n.body}</InboxBody>
                        <InboxMeta>
                          <span>Lead ID: {n.lead_id}</span>
                        </InboxMeta>
                      </InboxRow>
                    );
                  })}

                  {!loadingNotes && notes.length === 0 && (
                    <div style={{ padding: 12, fontWeight: 900, opacity: 0.7 }}>
                      No inbound messages yet.
                    </div>
                  )}
                </Inbox>
              </Section>
            </Detail>
          )}
        </Panel>
      </Grid>

      {/* DRAWER */}
      {drawerOpen && (
        <DrawerOverlay onMouseDown={closeDrawer}>
          <Drawer onMouseDown={(e) => e.stopPropagation()}>
            <DrawerTop>
              <DrawerTitle>{draft?.id ? "Edit flow" : "New flow"}</DrawerTitle>
              <X onClick={closeDrawer}>✕</X>
            </DrawerTop>

            <DrawerBody>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <FieldInput
                  value={draft?.name ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                />
              </Field>

              <Field>
                <FieldLabel>Description</FieldLabel>
                <FieldInput
                  value={draft?.description ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                />
              </Field>

              <TwoCol>
                <Field>
                  <FieldLabel>Kind</FieldLabel>
                  <Select
                    value={draft?.kind ?? "transactional"}
                    onChange={(e) => setDraft((p) => ({ ...p, kind: e.target.value }))}
                  >
                    <option value="transactional">Transactional</option>
                    <option value="marketing">Marketing</option>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    value={draft?.status ?? "draft"}
                    onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </Select>
                </Field>
              </TwoCol>

              <Composer>
                <ComposerTop>
                  <FieldLabel>Steps</FieldLabel>
                  <SmallBtn type="button" onClick={addStep}>+ Add step</SmallBtn>
                </ComposerTop>

                {(draft?.steps || []).map((s, idx) => (
                  <StepCard key={s.id || `new_${idx}`}>
                    <StepTop>
                      <StepTitle>Step {idx + 1}</StepTitle>
                      <StepActions>
                        <MiniIconBtn type="button" onClick={() => moveStep(idx, -1)} disabled={idx === 0}>↑</MiniIconBtn>
                        <MiniIconBtn type="button" onClick={() => moveStep(idx, 1)} disabled={idx === (draft.steps.length - 1)}>↓</MiniIconBtn>
                        <MiniDangerBtn type="button" onClick={() => removeStep(idx)}>Remove</MiniDangerBtn>
                      </StepActions>
                    </StepTop>

                    <StepGrid>
                      <TwoCol>
                        <MiniField>
                          <MiniLabel>Delay minutes</MiniLabel>
                          <MiniInput
                            type="number"
                            min="0"
                            value={s.delay_minutes ?? 0}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDraft((p) => {
                                const next = [...(p.steps || [])];
                                next[idx] = { ...next[idx], delay_minutes: v === "" ? 0 : Number(v) };
                                return { ...p, steps: next };
                              });
                            }}
                          />
                          <MiniHint>0 = immediately on enrollment</MiniHint>
                        </MiniField>

                        <MiniField>
                          <MiniLabel>Set lead status (optional)</MiniLabel>
                          <Select
                            value={s.set_status ?? ""}
                            onChange={(e) => {
                              const v = e.target.value || null;
                              setDraft((p) => {
                                const next = [...(p.steps || [])];
                                next[idx] = { ...next[idx], set_status: v };
                                return { ...p, steps: next };
                              });
                            }}
                          >
                            <option value="">(no change)</option>
                            {STATUSES.map((st) => (
                              <option key={st} value={st}>{st.replaceAll("_", " ")}</option>
                            ))}
                          </Select>
                        </MiniField>
                      </TwoCol>

                      <MiniField style={{ gridColumn: "1 / -1" }}>
                        <MiniLabel>Message</MiniLabel>
                        <TextArea
                          value={s.body ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDraft((p) => {
                              const next = [...(p.steps || [])];
                              next[idx] = { ...next[idx], body: v };
                              return { ...p, steps: next };
                            });
                          }}
                          placeholder="Write message… (use merge fields like {{first_name}})"
                        />

                        <MergeRow>
                          <MergeLabel>Insert merge:</MergeLabel>
                          <MergeBtns>
                            {MERGE_FIELDS.map((f) => (
                              <MiniBtn
                                key={f.key}
                                type="button"
                                onClick={() => {
                                  const token = `{{${f.key}}}`;
                                  setDraft((p) => {
                                    const next = [...(p.steps || [])];
                                    next[idx] = { ...next[idx], body: (next[idx].body || "") + token };
                                    return { ...p, steps: next };
                                  });
                                }}
                              >
                                {f.label}
                              </MiniBtn>
                            ))}
                          </MergeBtns>
                        </MergeRow>

                        <Counter>
                          {smsInfo((s.body || "") + COMPLIANCE_FOOTER).chars} chars •{" "}
                          {smsInfo((s.body || "") + COMPLIANCE_FOOTER).segments} segment
                          {smsInfo((s.body || "") + COMPLIANCE_FOOTER).segments === 1 ? "" : "s"}
                        </Counter>

                        <MiniPreview>
                          <MiniPreviewTitle>Preview</MiniPreviewTitle>
                          <MiniBubble>
                            {renderMerged(s.body || "", sample) || (
                              <span style={{ opacity: 0.6 }}>Start typing…</span>
                            )}
                          </MiniBubble>
                        </MiniPreview>
                      </MiniField>
                    </StepGrid>
                  </StepCard>
                ))}
              </Composer>
            </DrawerBody>

            <DrawerBottom>
              <Ghost onClick={closeDrawer}>Cancel</Ghost>
              <Btn
                onClick={async () => {
                  try {
                    await saveFlow({ keepDrawerOpen: false });
                  } catch (e) {
                    alert(String(e?.message || e));
                  }
                }}
              >
                Save
              </Btn>
              <Primary
                onClick={async () => {
                  try {
                    await saveFlow({ keepDrawerOpen: true });
                    alert("Saved. Flow is ready.");
                  } catch (e) {
                    alert(String(e?.message || e));
                  }
                }}
              >
                Save (keep open)
              </Primary>
            </DrawerBottom>
          </Drawer>
        </DrawerOverlay>
      )}
    </Page>
  );
}

/* helpers */

function prettyFlowStatus(s) {
  if (s === "draft") return "Draft";
  if (s === "active") return "Active";
  if (s === "paused") return "Paused";
  return s || "—";
}

function formatShort(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function timeAgo(iso) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const d = Date.now() - t;
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function renderMerged(text, sample) {
  if (!text) return "";
  return (text || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
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
    p.$tone === "active"
      ? "rgba(34, 197, 94, 0.14)"
      : p.$tone === "paused"
      ? "rgba(245, 158, 11, 0.14)"
      : "rgba(125, 168, 193, 0.16)"};

  color: ${(p) =>
    p.$tone === "active"
      ? "rgba(20, 83, 45, 0.92)"
      : p.$tone === "paused"
      ? "rgba(124, 45, 18, 0.92)"
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

  strong { font-weight: 900; }
`;

const Empty = styled.div`
  padding: 18px;
  text-align: center;
  color: rgba(47, 47, 50, 0.78);

  strong { color: #2f2f32; }
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

const Section = styled.div`
  margin-top: 12px;
  background: rgba(255,255,255,0.88);
  border: 1px solid rgba(47,47,50,0.10);
  border-radius: 18px;
  padding: 12px;
`;

const SectionTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  align-items: baseline;
`;

const SectionTitle = styled.div`
  font-weight: 900;
  color: #2f2f32;
`;

const Primary = styled.button`
  border: 0;
  cursor: pointer;
  padding: 12px 14px;
  border-radius: 18px;
  font-weight: 900;
  color: #ffffff;
  background: linear-gradient(180deg, #7da8c1, #4f6d8a);

  &:disabled { cursor: not-allowed; opacity: 0.65; }
`;

const Btn = styled.button`
  border: 0;
  cursor: pointer;
  padding: 12px 14px;
  border-radius: 18px;
  font-weight: 900;
  color: #2f2f32;
  background: rgba(47, 47, 50, 0.08);

  &:disabled { cursor: not-allowed; opacity: 0.6; }
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

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 720px) { grid-template-columns: 1fr; }
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

  &:focus { outline: none; border-color: #7da8c1; }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid rgba(47, 47, 50, 0.14);
  background: rgba(255, 255, 255, 0.96);
  font-weight: 900;
  color: #2f2f32;
  text-transform: capitalize;

  &:focus { outline: none; border-color: #7da8c1; }
`;

const DrawerOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  justify-content: flex-end;
  z-index: 60;
`;

const Drawer = styled.div`
  width: min(860px, 100%);
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
  align-items: center;
`;

const SmallBtn = styled.button`
  border: 1px solid rgba(47, 47, 50, 0.14);
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.92);
  color: #2f2f32;
`;

const StepCard = styled.div`
  margin-top: 10px;
  border-radius: 18px;
  border: 1px solid rgba(47, 47, 50, 0.10);
  background: rgba(255, 255, 255, 0.92);
  padding: 12px;
`;

const StepTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
`;

const StepTitle = styled.div`
  font-weight: 900;
  color: #2f2f32;
`;

const StepActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const MiniIconBtn = styled.button`
  border: 1px solid rgba(47, 47, 50, 0.14);
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 12px;
  font-weight: 900;
  background: rgba(255, 255, 255, 0.92);
  color: #2f2f32;

  &:disabled { cursor: not-allowed; opacity: 0.6; }
`;

const MiniDangerBtn = styled.button`
  border: 1px solid rgba(239, 68, 68, 0.22);
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 12px;
  font-weight: 900;
  background: rgba(239, 68, 68, 0.10);
  color: rgba(127, 29, 29, 0.92);
`;

const StepGrid = styled.div`
  margin-top: 10px;
  display: grid;
  gap: 10px;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(47, 47, 50, 0.14);
  background: rgba(255, 255, 255, 0.92);
  font-weight: 800;
  color: #2f2f32;
  resize: vertical;

  &:focus { outline: none; border-color: #7da8c1; }
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
`;

const Counter = styled.div`
  margin-top: 8px;
  font-weight: 900;
  font-size: 11px;
  color: rgba(47, 47, 50, 0.62);
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

const PreviewPhone = styled.div`
  border-radius: 18px;
  border: 1px solid rgba(47, 47, 50, 0.10);
  background: rgba(243, 244, 246, 0.55);
  padding: 12px;
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

const SampleCard = styled.div`
  margin-top: 12px;
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

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const MiniField = styled.div``;

const MiniLabel = styled.div`
  font-size: 11px;
  font-weight: 900;
  color: rgba(47, 47, 50, 0.62);
  margin-bottom: 6px;
`;

const MiniHint = styled.div`
  margin-top: 6px;
  font-size: 11px;
  font-weight: 900;
  color: rgba(47, 47, 50, 0.55);
`;

const MiniInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(47, 47, 50, 0.14);
  background: rgba(255, 255, 255, 0.92);
  font-weight: 800;
  color: #2f2f32;

  &:focus { outline: none; border-color: #7da8c1; }
`;

const Inbox = styled.div`
  margin-top: 10px;
  display: grid;
  gap: 10px;
`;

const InboxRow = styled.div`
  border-radius: 16px;
  border: 1px solid rgba(47,47,50,0.10);
  background: rgba(255,255,255,0.92);
  padding: 12px;
`;

const InboxTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
`;

const InboxBody = styled.div`
  margin-top: 8px;
  white-space: pre-wrap;
  font-weight: 900;
  color: #2f2f32;
`;

const InboxMeta = styled.div`
  margin-top: 8px;
  font-size: 11px;
  font-weight: 900;
  color: rgba(47,47,50,0.62);
`;
