import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

/**
 * SMS Campaigns Admin
 * - Campaigns stored in sms_campaigns
 * - Steps stored in sms_campaign_messages (step_order + offset_minutes + body)
 * - Activate schedules an initial start time and enqueues ALL steps for eligible recipients
 * - Enroll New Leads: enrolls newly eligible leads and enqueues all steps for them
 */

const KINDS = [
  { key: "transactional", label: "Transactional (requires SMS subscription)" },
  { key: "marketing", label: "Marketing (requires SMS + marketing consent)" },
];

// For now you only support quote_form_submissions as a source.
// Keep “audience” UI if you want, but it maps to the same table today.
const AUDIENCES = [
  {
    key: "quote_form_submissions",
    label: "Quote Form Submissions",
    help: "Leads captured on your quote form.",
    target_table: "quote_form_submissions",
  },
];

const DEFAULT_SAMPLE = {
  first_name: "Joe",
  last_name: "Smith",
  city: "Houston",
  state: "Tx",
  phone: "(713) 555-1234",
};

const MERGE_FIELDS = [
  { key: "first_name", label: "First name" },
  { key: "last_name", label: "Last name" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
];

function toDatetimeLocalValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromDatetimeLocalToIso(v) {
  if (!v) return null;
  // "YYYY-MM-DDTHH:mm" -> Date -> ISO
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function Sms({ title = "SMS Campaigns" }) {
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loadingList, setLoadingList] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(null);

  const [sample, setSample] = useState(DEFAULT_SAMPLE);

  const [activeSteps, setActiveSteps] = useState([]);

  const active = useMemo(
    () => campaigns.find((c) => c.id === activeId) || null,
    [campaigns, activeId]
  );

  async function reloadCampaigns(selectId = null) {
    setLoadingList(true);
    const { data, error } = await supabase
      .from("sms_campaigns")
      .select("id, name, status, kind, target_table, timezone, started_at, updated_at, created_at, description")
      .order("updated_at", { ascending: false });

    setLoadingList(false);
    if (error) {
      console.error(error);
      return;
    }

    setCampaigns(data || []);
    if (selectId) setActiveId(selectId);
    else setActiveId((data?.[0]?.id) || null);
  }

  async function fetchSteps(campaignId) {
    const { data, error } = await supabase
      .from("sms_campaign_messages")
      .select("id, step_order, offset_minutes, body")
      .eq("campaign_id", campaignId)
      .order("step_order", { ascending: true });

    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      await reloadCampaigns();
      if (!alive) return;
    })();
    return () => {
      alive = false;
    };
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

  function openNew() {
    setDraft({
      id: null,
      name: "",
      description: "",
      status: "draft",
      kind: "transactional",
      target_table: "quote_form_submissions",
      timezone: "America/Chicago",
      started_at: null, // set on activate
      schedule_local: "", // datetime-local UI input
      steps: [
        // default step 0
        { id: null, step_order: 0, offset_days: 0, offset_hours: 0, body: "" },
      ],
    });
    setDrawerOpen(true);
  }

  async function openEdit(c) {
    const steps = await fetchSteps(c.id);
    setDraft({
      id: c.id,
      name: c.name || "",
      description: c.description || "",
      status: c.status || "draft",
      kind: c.kind || "transactional",
      target_table: c.target_table || "quote_form_submissions",
      timezone: c.timezone || "America/Chicago",
      started_at: c.started_at || null,
      schedule_local: toDatetimeLocalValue(c.started_at),
      steps:
        steps.length > 0
          ? steps.map((s) => {
              const mins = Number(s.offset_minutes ?? 0);
              const days = Math.floor(mins / (60 * 24));
              const hours = Math.floor((mins - days * 60 * 24) / 60);
              return {
                id: s.id,
                step_order: s.step_order ?? 0,
                offset_days: days,
                offset_hours: hours,
                body: s.body ?? "",
              };
            })
          : [{ id: null, step_order: 0, offset_minutes: 0, body: "" }],
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setDraft(null);
  }

  function normalizeSteps(steps) {
    // UI stores offset_days/offset_hours, DB stores offset_minutes
    const normalized = (steps || []).map((s, idx) => {
      const days = Number.isFinite(Number(s.offset_days)) ? Number(s.offset_days) : 0;
      const hours = Number.isFinite(Number(s.offset_hours)) ? Number(s.offset_hours) : 0;

      const clampedDays = Math.max(0, Math.floor(days));
      const clampedHours = Math.max(0, Math.floor(hours));

      const offset_minutes = clampedDays * 24 * 60 + clampedHours * 60;

      return {
        ...s,
        step_order: idx,
        offset_days: clampedDays,
        offset_hours: clampedHours,
        offset_minutes,
        body: s.body ?? "",
      };
    });

    return normalized;
  }

  async function saveCampaign({ keepDrawerOpen = false } = {}) {
    if (!draft) return null;

    const name = (draft.name || "").trim() || "Untitled campaign";
    const kind = draft.kind || "transactional";
    const target_table = draft.target_table || "quote_form_submissions";

    const campaignPayload = {
      ...(draft.id ? { id: draft.id } : {}),
      name,
      description: (draft.description || "").trim() || null,
      status: "draft",
      kind,
      target_table,
      timezone: draft.timezone || "America/Chicago",
    };

    // Upsert campaign
    const { data: camp, error: campErr } = await supabase
      .from("sms_campaigns")
      .upsert(campaignPayload)
      .select("id")
      .single();

    if (campErr) {
      throw new Error(`Failed to save campaign: ${campErr.message}`);
    }

    const campaignId = camp.id;

    // Load existing steps (to delete removed ones)
    const existing = await fetchSteps(campaignId);
    const existingIds = new Set(existing.map((s) => s.id));

    const steps = normalizeSteps(draft.steps);

    // Upsert steps
    for (const s of steps) {
      const payload = {
        ...(s.id ? { id: s.id } : {}),
        campaign_id: campaignId,
        step_order: s.step_order,
        offset_minutes: s.offset_minutes,
        body: s.body || "",
        requires_marketing_consent: kind === "marketing",
      };

      const { error } = await supabase.from("sms_campaign_messages").upsert(payload);
      if (error) {
        throw new Error(`Failed to save step ${s.step_order}: ${error.message}`);
      }
    }

    // Delete steps removed from UI
    const keptIds = new Set(steps.map((s) => s.id).filter(Boolean));
    const toDelete = [...existingIds].filter((id) => id && !keptIds.has(id));
    if (toDelete.length > 0) {
      const { error } = await supabase
        .from("sms_campaign_messages")
        .delete()
        .in("id", toDelete);

      if (error) {
        throw new Error(`Failed to delete removed steps: ${error.message}`);
      }
    }

    await reloadCampaigns(campaignId);

    setDraft((p) => (p ? { ...p, id: campaignId, steps } : p));

    if (!keepDrawerOpen) closeDrawer();
    return campaignId;
  }

  async function activateCampaign() {
    if (!draft) return;

    // Save first (keeps drawer open so you can see status)
    const campaignId = await saveCampaign({ keepDrawerOpen: true });

    const scheduleIso =
      fromDatetimeLocalToIso(draft.schedule_local) || new Date().toISOString();

    const { data, error } = await supabase.rpc("activate_sms_campaign", {
      p_campaign_id: campaignId,
      p_schedule_at: scheduleIso,
    });

    if (error) throw new Error(`Activate failed: ${error.message}`);

    // Refresh list + keep drawer open with updated started_at
    await reloadCampaigns(campaignId);
    setDraft((p) =>
      p
        ? {
            ...p,
            status: "active",
            started_at: scheduleIso,
          }
        : p
    );

    alert(
      `Activated.\nRecipients added: ${data?.recipients_added ?? 0}\nOutbox added: ${data?.outbox_added ?? 0}\nStart: ${new Date(
        scheduleIso
      ).toLocaleString()}`
    );
  }

  async function enrollNewLeads() {
    if (!active?.id) return;
    const { data, error } = await supabase.rpc("enroll_new_leads", {
      p_campaign_id: active.id,
    });
    if (error) throw new Error(`Enroll failed: ${error.message}`);

    alert(
      `Enrolled.\nRecipients added: ${data?.recipients_added ?? 0}\nOutbox added: ${data?.outbox_added ?? 0}`
    );
  }

  function addStep() {
    setDraft((p) => {
      if (!p) return p;
      const nextSteps = normalizeSteps([
        ...(p.steps || []),
        { id: null, step_order: (p.steps || []).length, offset_days: 0, offset_hours: 1, body: "" },
      ]);
      return { ...p, steps: nextSteps };
    });
  }

  function removeStep(idx) {
    setDraft((p) => {
      if (!p) return p;
      const next = (p.steps || []).filter((_, i) => i !== idx);
      const normalized = normalizeSteps(next.length ? next : [{ id: null, step_order: 0, offset_minutes: 0, body: "" }]);
      return { ...p, steps: normalized };
    });
  }

  function moveStep(idx, dir) {
    setDraft((p) => {
      if (!p) return p;
      const arr = [...(p.steps || [])];
      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= arr.length) return p;
      const tmp = arr[idx];
      arr[idx] = arr[nextIdx];
      arr[nextIdx] = tmp;
      return { ...p, steps: normalizeSteps(arr) };
    });
  }

  return (
    <Page>
      <Top>
        <Left>
          <H1>{title}</H1>
          <Sub>Build multi-step drip campaigns. Consent-gated. Scheduled start time.</Sub>
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
            <SmallMeta>{loadingList ? "Loading…" : `${campaigns.length} total`}</SmallMeta>
          </PanelTop>

          <List>
            {campaigns.map((c) => {
              const isActive = c.id === activeId;
              return (
                <Row key={c.id} $active={isActive} onClick={() => setActiveId(c.id)} role="button" tabIndex={0}>
                  <RowTop>
                    <RowName>{c.name}</RowName>
                    <Pill $tone={c.status}>{prettyStatus(c.status)}</Pill>
                  </RowTop>

                  <RowMeta>
                    <MetaItem>
                      <strong>Kind:</strong> <span>{c.kind}</span>
                    </MetaItem>
                    <MetaItem>
                      <strong>Source:</strong> <span>{c.target_table}</span>
                    </MetaItem>
                  </RowMeta>

                  <RowBottom>
                    <Tiny>{timeAgo(c.updated_at)}</Tiny>
                    <Tiny>{c.started_at ? `Start ${formatShort(c.started_at)}` : " "}</Tiny>
                  </RowBottom>
                </Row>
              );
            })}

            {!loadingList && campaigns.length === 0 && (
              <Empty>
                <strong>No campaigns yet.</strong>
                <div style={{ marginTop: 6, opacity: 0.75 }}>Click “New campaign” to start.</div>
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
              <div style={{ marginTop: 6, opacity: 0.75 }}>Choose one on the left or create a new one.</div>
            </Empty>
          ) : (
            <Detail>
              <DetailHeader>
                <DetailTitle>{active.name}</DetailTitle>
                <DetailActions>
                  <Btn onClick={() => openEdit(active)}>Edit</Btn>
                  <Btn onClick={enrollNewLeads}>Enroll new leads</Btn>
                </DetailActions>
              </DetailHeader>

              <Cards>
                <InfoCard>
                  <InfoLabel>Kind</InfoLabel>
                  <InfoValue>{active.kind}</InfoValue>
                  <InfoHelp>
                    {active.kind === "marketing"
                      ? "Requires SMS subscription + marketing consent."
                      : "Requires SMS subscription."}
                  </InfoHelp>
                </InfoCard>

                <InfoCard>
                  <InfoLabel>Status</InfoLabel>
                  <InfoValue>{prettyStatus(active.status)}</InfoValue>
                  <InfoHelp>
                    {active.started_at ? `Start time: ${formatShort(active.started_at)}` : "Not scheduled yet."}
                  </InfoHelp>
                </InfoCard>

                <InfoCard>
                  <InfoLabel>Source</InfoLabel>
                  <InfoValue>{active.target_table}</InfoValue>
                  <InfoHelp>Current supported source: quote_form_submissions.</InfoHelp>
                </InfoCard>
              </Cards>

              <PreviewBlock>
                <PreviewTop>
                  <PreviewTitle>Preview</PreviewTitle>
                </PreviewTop>

                {/* Sample recipient FIRST (controls every preview below) */}
                <div style={{ marginTop: 12 }}>
                  <SampleCard style={{ background: "rgba(243, 244, 246, 0.55)" }}>
                    <SampleTitle>Sample recipient</SampleTitle>
                    <SampleGrid>
                      <MiniField>
                        <MiniLabel>First name</MiniLabel>
                        <MiniInput
                          value={sample.first_name}
                          onChange={(e) =>
                            setSample((p) => ({ ...p, first_name: e.target.value }))
                          }
                        />
                      </MiniField>
                      <MiniField>
                        <MiniLabel>Last name</MiniLabel>
                        <MiniInput
                          value={sample.last_name}
                          onChange={(e) =>
                            setSample((p) => ({ ...p, last_name: e.target.value }))
                          }
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
                          onChange={(e) =>
                            setSample((p) => ({ ...p, state: e.target.value }))
                          }
                        />
                      </MiniField>
                      <MiniField style={{ gridColumn: "1 / -1" }}>
                        <MiniLabel>Phone</MiniLabel>
                        <MiniInput
                          value={sample.phone}
                          onChange={(e) =>
                            setSample((p) => ({ ...p, phone: e.target.value }))
                          }
                        />
                      </MiniField>
                    </SampleGrid>
                  </SampleCard>
                </div>

                {/* ALL steps preview */}
                <PreviewGrid style={{ marginTop: 12 }}>
                  <PreviewPhone style={{ gridColumn: "1 / -1" }}>
                    <PhoneTop>
                      <BubbleTitle>Stone Bridge Buyers</BubbleTitle>
                      <BubbleSub>All steps preview (in order)</BubbleSub>
                    </PhoneTop>

                    {(!activeSteps || activeSteps.length === 0) ? (
                      <div style={{ opacity: 0.7, fontWeight: 900 }}>
                        No steps found for this campaign. Edit the campaign and add at least Step 0.
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: 10 }}>
                        {activeSteps.map((s) => (
                          <div key={s.id || s.step_order} style={{ display: "grid", gap: 6 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                              <div style={{ fontWeight: 900, color: "#2f2f32" }}>
                                Step {s.step_order + 1}
                              </div>
                              <div style={{ fontWeight: 900, color: "rgba(47,47,50,0.62)", fontSize: 12 }}>
                                {(() => {
                                  const mins = Number(s.offset_minutes || 0);
                                  const days = Math.floor(mins / (60 * 24));
                                  const hours = Math.floor((mins - days * 60 * 24) / 60);
                                  return (
                                    <>
                                      Offset: {days}d {hours}h
                                    </>
                                  );
                                })()}
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

                    <Compliance>
                      <strong>Compliance:</strong> in production, include STOP/HELP handling and only message explicit opt-ins.
                      Opt-outs should immediately stop future steps.
                    </Compliance>
                  </PreviewPhone>
                </PreviewGrid>
              </PreviewBlock>
            </Detail>
          )}
        </Panel>
      </Grid>

      {drawerOpen && (
        <DrawerOverlay onMouseDown={closeDrawer}>
          <Drawer onMouseDown={(e) => e.stopPropagation()}>
            <DrawerTop>
              <DrawerTitle>{draft?.id ? "Edit campaign" : "New campaign"}</DrawerTitle>
              <X onClick={closeDrawer} aria-label="Close">
                ✕
              </X>
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

              <Field>
                <FieldLabel>Description (optional)</FieldLabel>
                <FieldInput
                  value={draft?.description ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Internal notes"
                />
              </Field>

              <TwoCol>
                <Field>
                  <FieldLabel>Kind</FieldLabel>
                  <Select
                    value={draft?.kind ?? "transactional"}
                    onChange={(e) => setDraft((p) => ({ ...p, kind: e.target.value }))}
                  >
                    {KINDS.map((k) => (
                      <option key={k.key} value={k.key}>
                        {k.label}
                      </option>
                    ))}
                  </Select>
                  <FieldHelp>
                    {draft?.kind === "marketing"
                      ? "Only recipients with SMS subscription + marketing consent will be enrolled."
                      : "Only recipients with SMS subscription will be enrolled."}
                  </FieldHelp>
                </Field>

                <Field>
                  <FieldLabel>Source</FieldLabel>
                  <Select
                    value={draft?.target_table ?? "quote_form_submissions"}
                    onChange={(e) => setDraft((p) => ({ ...p, target_table: e.target.value }))}
                  >
                    {AUDIENCES.map((a) => (
                      <option key={a.key} value={a.target_table}>
                        {a.label}
                      </option>
                    ))}
                  </Select>
                  <FieldHelp>{AUDIENCES.find((a) => a.target_table === draft?.target_table)?.help || ""}</FieldHelp>
                </Field>
              </TwoCol>

              <Field>
                <FieldLabel>Start time (when Step 0 begins)</FieldLabel>
                <FieldInput
                  type="datetime-local"
                  value={draft?.schedule_local ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, schedule_local: e.target.value }))}
                />
                <FieldHelp>
                  Leave blank to start immediately on activation. Messages schedule from enrollment/start + offsets.
                </FieldHelp>
              </Field>

              <Composer>
                <ComposerTop>
                  <FieldLabel>Steps (drip sequence)</FieldLabel>
                  <RightInline>
                    <SmallBtn type="button" onClick={addStep}>
                      + Add step
                    </SmallBtn>
                  </RightInline>
                </ComposerTop>

                {(draft?.steps || []).map((s, idx) => (
                  <StepCard key={s.id || `new_${idx}`}>
                    <StepTop>
                      <StepTitle>Step {idx + 1}</StepTitle>
                      <StepActions>
                        <MiniIconBtn type="button" onClick={() => moveStep(idx, -1)} disabled={idx === 0} title="Move up">
                          ↑
                        </MiniIconBtn>
                        <MiniIconBtn type="button" onClick={() => moveStep(idx, 1)} disabled={idx === (draft.steps.length - 1)} title="Move down">
                          ↓
                        </MiniIconBtn>
                        <MiniDangerBtn type="button" onClick={() => removeStep(idx)} title="Remove step">
                          Remove
                        </MiniDangerBtn>
                      </StepActions>
                    </StepTop>

                    <StepGrid>
                      <MiniField>
                        <MiniLabel>Offset</MiniLabel>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <MiniLabel style={{ marginBottom: 6 }}>Days</MiniLabel>
                            <MiniInput
                              type="number"
                              min="0"
                              value={s.offset_days ?? 0}
                              onChange={(e) => {
                                const v = e.target.value;
                                setDraft((p) => {
                                  const next = [...(p.steps || [])];
                                  next[idx] = { ...next[idx], offset_days: v === "" ? 0 : Number(v) };
                                  return { ...p, steps: next };
                                });
                              }}
                            />
                          </div>

                          <div>
                            <MiniLabel style={{ marginBottom: 6 }}>Hours</MiniLabel>
                            <MiniInput
                              type="number"
                              min="0"
                              value={s.offset_hours ?? 0}
                              onChange={(e) => {
                                const v = e.target.value;
                                setDraft((p) => {
                                  const next = [...(p.steps || [])];
                                  next[idx] = { ...next[idx], offset_hours: v === "" ? 0 : Number(v) };
                                  return { ...p, steps: next };
                                });
                              }}
                            />
                          </div>
                        </div>

                        <MiniHint>0d 0h = immediately at start/enroll</MiniHint>
                      </MiniField>

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
                          placeholder={`Write SMS for step ${idx + 1}… (use merge fields like {{first_name}})`}
                        />
                        <Counter>
                          {smsInfo(s.body || "").chars} chars • {smsInfo(s.body || "").segments} segment
                          {smsInfo(s.body || "").segments === 1 ? "" : "s"}
                        </Counter>
                      </MiniField>

                      <MergeRow>
                        <MergeLabel>Insert merge field:</MergeLabel>
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

                      <MiniPreview>
                        <MiniPreviewTitle>Preview</MiniPreviewTitle>
                        <MiniBubble>
                          {renderMerged(s.body || "", sample) || (
                            <span style={{ opacity: 0.6 }}>Start typing to preview your message.</span>
                          )}
                        </MiniBubble>

                        <Warn>
                          <strong>Reminder:</strong> consent is enforced (SMS subscription required; marketing requires marketing consent).
                        </Warn>
                      </MiniPreview>
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
                    await saveCampaign({ keepDrawerOpen: false });
                  } catch (e) {
                    alert(String(e?.message || e));
                  }
                }}
              >
                Save draft
              </Btn>
              <Primary
                onClick={async () => {
                  try {
                    await activateCampaign();
                  } catch (e) {
                    alert(String(e?.message || e));
                  }
                }}
                disabled={!draft?.steps?.[0]?.body?.trim()}
                title="Activate + enqueue outbox"
              >
                Activate
              </Primary>
            </DrawerBottom>
          </Drawer>
        </DrawerOverlay>
      )}
    </Page>
  );
}

/* helpers */

function prettyStatus(s) {
  if (s === "draft") return "Draft";
  if (s === "active") return "Active";
  if (s === "paused") return "Paused";
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
    p.$tone === "active"
      ? "rgba(34, 197, 94, 0.14)"
      : p.$tone === "archived"
      ? "rgba(107, 114, 128, 0.12)"
      : "rgba(125, 168, 193, 0.16)"};

  color: ${(p) =>
    p.$tone === "active"
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

const DrawerOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  justify-content: flex-end;
  z-index: 60;
`;

const Drawer = styled.div`
  width: min(840px, 100%);
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
  align-items: center;
`;

const RightInline = styled.div`
  display: flex;
  gap: 8px;
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

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
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

const Counter = styled.div`
  margin-top: 8px;
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
