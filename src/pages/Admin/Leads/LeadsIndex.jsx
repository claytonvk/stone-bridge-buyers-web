// src/pages/Admin/Leads/LeadsIndex.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { supabase } from "../../../lib/supabaseClient.js";
import EditLeadModal from "./EditLeadModal.jsx";
import NewLeadModal from "./NewLeadModal.jsx";

const STATUSES = ["new", "contacted", "followUp", "interested", "do_not_contact"];

export default function LeadsIndex() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editLead, setEditLead] = useState(null);

  async function load() {
    setLoading(true);

    let query = supabase
      .from("leads")
      .select(
        `
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
      `
      )
      .order("created_at", { ascending: false });

    const search = q.trim();
    if (search) {
      query = query.or(
        [
          `first_name.ilike.%${search}%`,
          `last_name.ilike.%${search}%`,
          `email.ilike.%${search}%`,
          `raw_phone.ilike.%${search}%`,
          `phone_e164.ilike.%${search}%`,
          `street_address.ilike.%${search}%`,
          `city.ilike.%${search}%`,
          `state.ilike.%${search}%`,
          `zipcode.ilike.%${search}%`,
        ].join(",")
      );
    }

    const { data, error } = await query;
    setLoading(false);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }
    setRows(data || []);
  }

  async function deleteLead(lead) {
    const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "this lead";
    const phone = lead.raw_phone || lead.phone_e164 || "";

    const ok = window.confirm(`Delete ${name}${phone ? ` (${phone})` : ""}?\n\nThis cannot be undone.`);
    if (!ok) return;

    const { error } = await supabase.from("leads").delete().eq("id", lead.id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    // Optimistic UI update
    setRows((prev) => prev.filter((x) => x.id !== lead.id));
    await loadCounts();
  }

  async function loadCounts() {
    const results = await Promise.all(
      STATUSES.map(async (s) => {
        const { count, error } = await supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("status", s);

        if (error) return [s, 0];
        return [s, count || 0];
      })
    );

    setCounts(Object.fromEntries(results));
  }

  useEffect(() => {
    load();
    loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = rows.length;

  return (
    <Wrap>
      <Top>
        <Left>
          <H1>Leads</H1>
          <Sub>All leads (CSV + web forms). Phone is unique; addresses can repeat.</Sub>
        </Left>

        <Right>
          <Search value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email, address…" />
          <Btn onClick={() => setShowImport(true)}>Import CSV</Btn>
          <Btn onClick={() => setShowNew(true)}>+ New lead</Btn>
          <Btn onClick={async () => { await load(); await loadCounts(); }}>
            {loading ? "Loading…" : "Refresh"}
          </Btn>
        </Right>
      </Top>

      <Buckets>
        <BucketLink to="/admin/leads" $active>
          All <Count>{countsAll(counts)}</Count>
        </BucketLink>

        {STATUSES.map((s) => (
          <BucketLink key={s} to={`/admin/leads/status/${s}`}>
            {labelForStatus(s)} <Count>{counts?.[s] ?? "—"}</Count>
          </BucketLink>
        ))}
      </Buckets>

      <Card>
        <MetaRow>
          <Meta>{loading ? "Loading…" : `${total} result${total === 1 ? "" : "s"}`}</Meta>
        </MetaRow>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Lead</Th>
                <Th>Contact</Th>
                <Th>Address</Th>
                <Th>Status</Th>
                <Th>Consents</Th>
                <Th>Activity</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </tr>
            </thead>

            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  {/* ✅ you now have an Actions column, so colSpan is 8 */}
                  <Td colSpan={8} style={{ opacity: 0.7, fontWeight: 900 }}>
                    No leads found.
                  </Td>
                </tr>
              )}

              {rows.map((r) => {
                const name = [r.first_name, r.last_name].filter(Boolean).join(" ") || "—";
                const phone = r.raw_phone || r.phone_e164 || "—";
                const addr = formatAddr(r);
                const optedOut = !!r.opted_out_at || r.status === "do_not_contact";

                return (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/admin/leads/${r.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <Td>
                      <Strong>{name}</Strong>
                      <Small>{r.id}</Small>
                      <Small>Source: {r.source || "—"}</Small>
                    </Td>

                    <Td>
                      <div>{r.email || "—"}</div>
                      <Small>{phone}</Small>
                    </Td>

                    <Td>
                      <div>{addr || "—"}</div>
                      <Small>
                        {r.city || "—"}, {r.state || "—"} {r.zipcode || ""}
                      </Small>
                    </Td>

                    <Td>
                      <Pill $tone={optedOut ? "bad" : toneForStatus(r.status)}>
                        {labelForStatus(r.status)}
                      </Pill>
                      <Small>Updated {fmt(r.status_updated_at)}</Small>
                    </Td>

                    <Td>
                      {/* SMS pill: show only if true/false, else show "Can text" when can_text is true */}
                      {typeof r.sms_subscription === "boolean" ? (
                        <Pill $tone={r.sms_subscription ? "good" : "bad"}>
                          SMS: {r.sms_subscription ? "Yes" : "No"}
                        </Pill>
                      ) : r.can_text ? (
                        <Pill $tone="warn">Can text</Pill>
                      ) : null}

                      {/* Marketing pill only if true/false */}
                      {typeof r.consent_marketing === "boolean" && (
                        <Pill $tone={r.consent_marketing ? "good" : "bad"}>
                          Mktg: {r.consent_marketing ? "Yes" : "No"}
                        </Pill>
                      )}

                      {r.opted_out_at && <Small>Opted out {fmt(r.opted_out_at)}</Small>}
                    </Td>

                    <Td>
                      <Small>Last contacted: {fmt(r.last_contacted_at)}</Small>
                      <Small>Last inbound: {fmt(r.last_inbound_at)}</Small>
                    </Td>

                    <Td>
                      <Small>{fmt(r.created_at)}</Small>
                    </Td>

                    <Td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Btn
                          onClick={() => setEditLead(r)}
                          style={{ padding: "10px 12px", borderRadius: 14 }}
                        >
                          Edit
                        </Btn>

                        <DangerBtn
                          onClick={() => deleteLead(r)}
                          style={{ padding: "10px 12px", borderRadius: 14 }}
                          title="Delete lead"
                        >
                          Delete
                        </DangerBtn>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      </Card>

      {showNew && (
        <NewLeadModal
          onClose={() => setShowNew(false)}
          onSaved={async () => {
            setShowNew(false);
            await load();
            await loadCounts();
          }}
        />
      )}

      {showImport && (
        <ImportCsvModal
          onClose={() => setShowImport(false)}
          onDone={async () => {
            setShowImport(false);
            await load();
            await loadCounts();
          }}
        />
      )}

      {editLead && (
        <EditLeadModal
          leadId={editLead.id}
          onClose={() => setEditLead(null)}
          onSaved={async () => {
            setEditLead(null);
            await load();
            await loadCounts();
          }}
        />
      )}
    </Wrap>
  );
}

/* ------------------ Import CSV Modal ------------------ */

function ImportCsvModal({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState(null);

  function parseFile(f) {
    setSummary(null);
    setFile(f);
  }

  async function upload() {
    if (!file) return;

    setBusy(true);
    setSummary(null);

    const text = await file.text();
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    if (parsed.errors?.length) {
      setBusy(false);
      alert(parsed.errors[0].message);
      return;
    }

    const rows = (parsed.data || []).map((r) => ({
      phone: r.phone ?? r.Phone ?? r.PHONE ?? r["Phone Number"] ?? r["phone_number"],
      email: r.email ?? r.Email,
      first_name: r.first_name ?? r["first name"] ?? r.FirstName ?? r.First,
      last_name: r.last_name ?? r["last name"] ?? r.LastName ?? r.Last,
      street_address: r.street_address ?? r.address ?? r.Address ?? r["street address"],
      unit: r.unit ?? r.Unit,
      city: r.city ?? r.City,
      state: r.state ?? r.State,
      zipcode: r.zipcode ?? r.Zip ?? r.ZIP ?? r["zip code"],
      raw_address: r.raw_address ?? r.RawAddress,
      source: "csv_import",
      source_ref: file.name,
      status: "new",
      // ✅ defaults you want
      sms_subscription: null,
      consent_marketing: null,
      can_text: true,
    }));

    const chunkSize = 500;
    let inserted = 0;
    let updated = 0;
    let skipped_invalid = 0;
    const invalid = [];

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);

      const { data, error } = await supabase.functions.invoke("upsert-leads", {
        body: { leads: chunk },
      });

      if (error) {
        console.error(error);
        setBusy(false);
        alert(error.message);
        return;
      }
      if (data?.error) {
        setBusy(false);
        alert(data.error);
        return;
      }

      inserted += data.inserted || 0;
      updated += data.updated || 0;
      skipped_invalid += data.skipped_invalid || 0;
      if (Array.isArray(data.invalid)) invalid.push(...data.invalid.map((x) => ({ ...x, rowOffset: i })));
    }

    setBusy(false);
    setSummary({ total: rows.length, inserted, updated, skipped_invalid, invalid: invalid.slice(0, 50) });
  }

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <ModalTop>
          <ModalTitle>Import leads CSV</ModalTitle>
          <X onClick={onClose}>×</X>
        </ModalTop>

        <Hint>
          CSV should have a <b>phone</b> column. Other columns are optional (email, first_name, last_name, street_address, unit, city, state, zipcode).
        </Hint>

        <Field>
          <Label>Choose CSV file</Label>
          <Input type="file" accept=".csv,text/csv" onChange={(e) => parseFile(e.target.files?.[0] ?? null)} />
        </Field>

        <ModalBottom>
          <Btn onClick={onClose} style={{ background: "rgba(47,47,50,0.06)" }}>
            Cancel
          </Btn>
          <Btn onClick={upload} disabled={!file || busy}>
            {busy ? "Importing…" : "Upload"}
          </Btn>
        </ModalBottom>

        {summary && (
          <Summary>
            <div>
              <b>Total rows:</b> {summary.total}
            </div>
            <div>
              <b>Inserted:</b> {summary.inserted}
            </div>
            <div>
              <b>Updated:</b> {summary.updated}
            </div>
            <div>
              <b>Invalid phones:</b> {summary.skipped_invalid}
            </div>
            {!!summary.invalid?.length && (
              <>
                <div style={{ marginTop: 10, fontWeight: 900 }}>Sample invalid rows (first 50):</div>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, opacity: 0.85 }}>
                  {JSON.stringify(summary.invalid, null, 2)}
                </pre>
              </>
            )}
            <Btn onClick={onDone} style={{ marginTop: 10 }}>
              Done
            </Btn>
          </Summary>
        )}
      </ModalCard>
    </ModalBackdrop>
  );
}

/* ------------------ Helpers ------------------ */

function fmt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function formatAddr(r) {
  const parts = [r.street_address, r.unit && `#${r.unit}`].filter(Boolean);
  return parts.join(" ");
}

function labelForStatus(s) {
  const map = {
    new: "New",
    contacted: "Contacted",
    followUp: "Follow-Up",
    interested: "Interested",
    do_not_contact: "Do not contact",
  };
  return map[s] || (s ? s.replaceAll("_", " ") : "—");
}

function toneForStatus(s) {
  if (s === "interested" || s === "followUp") return "good";
  if (s === "contacted") return "warn";
  if (s === "do_not_contact") return "bad";
  return "warn";
}

function countsAll(counts) {
  return Object.values(counts || {}).reduce((a, b) => a + (Number(b) || 0), 0);
}

/* ------------------ Styles ------------------ */

const Wrap = styled.div`
  max-width: 1800px;
  margin: 0 auto;
`;

const Top = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 8px;
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

const Buckets = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 10px 0 14px;
`;

const BucketLink = styled(Link)`
  border: 1px solid rgba(47, 47, 50, 0.12);
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  padding: 10px 12px;
  border-radius: 999px;
  font-weight: 900;
  color: #2f2f32;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
`;

const Count = styled.span`
  display: inline-grid;
  place-items: center;
  min-width: 26px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 1000;
  background: rgba(47, 47, 50, 0.08);
`;

const Card = styled.div`
  background: rgba(243, 244, 246, 0.92);
  border: 1px solid rgba(47, 47, 50, 0.1);
  border-radius: 22px;
  overflow: hidden;
`;

const MetaRow = styled.div`
  padding: 12px 14px;
  border-bottom: 1px solid rgba(47, 47, 50, 0.08);
`;

const Meta = styled.div`
  font-weight: 900;
  font-size: 12px;
  color: rgba(47, 47, 50, 0.62);
`;

const Search = styled.input`
  width: min(380px, 72vw);
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

const DangerBtn = styled.button`
  border: 1px solid rgba(239, 68, 68, 0.25);
  cursor: pointer;
  padding: 12px 14px;
  border-radius: 18px;
  font-weight: 900;
  color: rgba(127, 29, 29, 0.95);
  background: rgba(239, 68, 68, 0.10);

  &:hover {
    background: rgba(239, 68, 68, 0.14);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;


const TableWrap = styled.div`
  overflow: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 1200px;

  thead th {
    position: sticky;
    top: 0;
    background: rgba(243, 244, 246, 0.98);
    z-index: 1;
  }

  tbody tr:hover td {
    background: rgba(255, 255, 255, 0.6);
  }
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 14px;
  font-size: 12px;
  font-weight: 900;
  color: rgba(47, 47, 50, 0.72);
  border-bottom: 1px solid rgba(47, 47, 50, 0.08);
`;

const Td = styled.td`
  padding: 12px 14px;
  vertical-align: top;
  border-bottom: 1px solid rgba(47, 47, 50, 0.06);
  background: rgba(255, 255, 255, 0.35);
`;

const Strong = styled.div`
  font-weight: 900;
  color: #2f2f32;
`;

const Small = styled.div`
  margin-top: 4px;
  font-weight: 900;
  font-size: 11px;
  color: rgba(47, 47, 50, 0.58);
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

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.55);
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 50;
`;

const ModalCard = styled.div`
  width: min(860px, 96vw);
  background: rgba(255, 255, 255, 0.98);
  border-radius: 22px;
  border: 1px solid rgba(47, 47, 50, 0.12);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.18);
  padding: 14px;
`;

const ModalTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const ModalTitle = styled.div`
  font-weight: 1000;
  font-size: 16px;
  color: #2f2f32;
`;

const X = styled.button`
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 26px;
  line-height: 1;
  font-weight: 900;
  color: rgba(47, 47, 50, 0.7);
`;

const Hint = styled.div`
  margin-top: 6px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(47, 47, 50, 0.7);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div``;

const Label = styled.div`
  font-weight: 900;
  font-size: 12px;
  margin-bottom: 6px;
  color: rgba(47, 47, 50, 0.7);
`;

const Input = styled.input`
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

  &:disabled {
    opacity: 0.7;
  }
`;

const ModalBottom = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
`;

const Summary = styled.div`
  margin-top: 12px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(243, 244, 246, 0.9);
  border: 1px solid rgba(47, 47, 50, 0.08);
  font-weight: 900;
  color: rgba(47, 47, 50, 0.8);
`;
