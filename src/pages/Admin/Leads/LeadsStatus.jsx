// src/pages/Admin/Leads/LeadsStatus.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Link, useParams, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient.js";
import EditLeadModal from "./EditLeadModal.jsx";

const VALID = new Set(["new", "contacted", "followUp", "interested", "do_not_contact"]);
const STATUSES = ["new", "contacted", "followUp", "interested", "do_not_contact"];

export default function LeadsStatus() {
  const { status } = useParams();
  const normalized = (status || "").trim();
  const navigate = useNavigate();

  if (!VALID.has(normalized)) return <Navigate to="/admin/leads" replace />;

  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
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
      .eq("status", normalized)
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
  }, [normalized]);

  return (
    <Wrap>
      <Top>
        <Left>
          <H1>{labelForStatus(normalized)} leads</H1>
          <Sub>Bucket view • click a row to edit.</Sub>
        </Left>

        <Right>
          <Search value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email, address…" />
          <Btn onClick={async () => { await load(); await loadCounts(); }}>
            {loading ? "Loading…" : "Refresh"}
          </Btn>
        </Right>
      </Top>

      <Buckets>
        <MobileBucketRow>
          <BucketLabel>Status</BucketLabel>
          <BucketSelect
            value={normalized}
            onChange={(e) => {
              const next = e.target.value;
              navigate(next === "all" ? "/admin/leads" : `/admin/leads/status/${next}`);
            }}
            aria-label="Filter leads by status"
          >
            <option value="all">All ({countsAll(counts)})</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {labelForStatus(s)} ({counts?.[s] ?? 0})
              </option>
            ))}
          </BucketSelect>
        </MobileBucketRow>

        <DesktopBuckets>
          <BucketLink to="/admin/leads" $active={false}>
            All <Count>{countsAll(counts)}</Count>
          </BucketLink>

          {STATUSES.map((s) => (
            <BucketLink key={s} to={`/admin/leads/status/${s}`} $active={s === normalized}>
              {labelForStatus(s)} <Count>{counts?.[s] ?? "—"}</Count>
            </BucketLink>
          ))}
        </DesktopBuckets>
      </Buckets>

      <Card>
        <MetaRow>
          <Meta>{loading ? "Loading…" : `${rows.length} result${rows.length === 1 ? "" : "s"}`}</Meta>
        </MetaRow>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Lead</Th>
                <Th>Contact</Th>
                <Th>Address</Th>
                <Th>Consents</Th>
                <Th>Activity</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </tr>
            </thead>

            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  <Td colSpan={7} style={{ opacity: 0.7, fontWeight: 900 }}>
                    No leads found in this bucket.
                  </Td>
                </tr>
              )}

              {rows.map((r) => {
                const name = [r.first_name, r.last_name].filter(Boolean).join(" ") || "—";
                const phone = r.raw_phone || r.phone_e164 || "—";
                const addr = formatAddr(r);

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
                      {typeof r.sms_subscription === "boolean" ? (
                        <Pill $tone={r.sms_subscription ? "good" : "bad"}>
                          SMS: {r.sms_subscription ? "Yes" : "No"}
                        </Pill>
                      ) : r.can_text ? (
                        <Pill $tone="warn">Can text</Pill>
                      ) : null}

                      {typeof r.consent_marketing === "boolean" && (
                        <Pill $tone={r.consent_marketing ? "good" : "bad"}>
                          Mktg: {r.consent_marketing ? "Yes" : "No"}
                        </Pill>
                      )}
                    </Td>

                    <Td>
                      <Small>Last contacted: {fmt(r.last_contacted_at)}</Small>
                      <Small>Last inbound: {fmt(r.last_inbound_at)}</Small>
                    </Td>

                    <Td>
                      <Small>{fmt(r.created_at)}</Small>
                    </Td>

                    <Td onClick={(e) => e.stopPropagation()}>
                      <Btn
                        onClick={() => setEditLead(r)}
                        style={{
                          background: "rgba(255,255,255,0.92)",
                          border: "1px solid rgba(47,47,50,0.14)",
                        }}
                      >
                        Edit
                      </Btn>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      </Card>

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

function countsAll(counts) {
  return Object.values(counts || {}).reduce((a, b) => a + (Number(b) || 0), 0);
}

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

  @media (max-width: 700px) {
    gap: 0;
  }
`;

const MobileBucketRow = styled.div`
  display: none;
  align-items: center;
  gap: 10px;
  width: 100%;

  @media (max-width: 700px) {
    display: flex;
  }
`;

const DesktopBuckets = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  @media (max-width: 700px) {
    display: none;
  }
`;

const BucketLabel = styled.div`
  font-weight: 1000;
  font-size: 12px;
  color: rgba(47, 47, 50, 0.7);
`;

const BucketSelect = styled.select`
  flex: 1;
  min-width: 220px;

  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid rgba(47, 47, 50, 0.14);
  background: rgba(255, 255, 255, 0.96);
  font-weight: 1000;
  color: #2f2f32;

  &:focus {
    outline: none;
    border-color: #7da8c1;
  }
`;

const BucketLink = styled(Link)`
  border: 1px solid rgba(47, 47, 50, 0.12);
  background: ${(p) => (p.$active ? "rgba(125,168,193,0.18)" : "rgba(255,255,255,0.9)")};
  cursor: pointer;
  padding: 10px 12px;
  border-radius: 999px;
  font-weight: 900;
  color: ${(p) => (p.$active ? "rgba(47,47,50,0.95)" : "#2f2f32")};
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;

  &:hover {
    background: ${(p) => (p.$active ? "rgba(125,168,193,0.22)" : "rgba(47,47,50,0.06)")};
  }
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
