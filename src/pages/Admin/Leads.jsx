import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { supabase } from "../../lib/supabaseClient";

export default function Leads() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);

    // Note: if you end up with multiple campaigns per lead,
    // this will show duplicate leads (one per campaign).
    // We can aggregate later if you want.
    let query = supabase
      .from("leads")
      .select(
        `
        lead_id,
        lead_created_at,
        first_name,
        last_name,
        email,
        raw_phone,
        phone_e164,
        recipient_id,
        recipient_status,
        sms_subscription,
        consent_marketing,
        enrollment_status,
        enrolled_at,
        campaign_id,
        campaign_name,
        campaign_kind,
        campaign_status
      `
      )
      .order("lead_created_at", { ascending: false });

    const search = q.trim();
    if (search) {
      // basic search across a few fields (PostgREST OR filter)
      query = query.or(
        [
          `first_name.ilike.%${search}%`,
          `last_name.ilike.%${search}%`,
          `email.ilike.%${search}%`,
          `raw_phone.ilike.%${search}%`,
          `phone_e164.ilike.%${search}%`,
          `campaign_name.ilike.%${search}%`,
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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCount = rows.length;

  return (
    <Wrap>
      <Top>
        <Left>
          <H1>Leads</H1>
          <Sub>
            Quote form contacts + enrollment status (campaign + consent snapshot).
          </Sub>
        </Left>

        <Right>
          <Search
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, phone, email, campaign…"
          />
          <Btn onClick={load}>{loading ? "Loading…" : "Refresh"}</Btn>
        </Right>
      </Top>

      <Card>
        <MetaRow>
          <Meta>
            {loading ? "Loading…" : `${filteredCount} result${filteredCount === 1 ? "" : "s"}`}
          </Meta>
        </MetaRow>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Lead</Th>
                <Th>Contact</Th>
                <Th>Consents</Th>
                <Th>Enrolled?</Th>
                <Th>Campaign</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  <Td colSpan={6} style={{ opacity: 0.7, fontWeight: 900 }}>
                    No leads found.
                  </Td>
                </tr>
              )}

              {rows.map((r) => {
                const name = [r.first_name, r.last_name].filter(Boolean).join(" ") || "—";
                const enrolled = r.enrollment_status === "enrolled" && !!r.campaign_id;

                return (
                  <tr key={`${r.lead_id}_${r.campaign_id || "none"}`}>
                    <Td>
                      <Strong>{name}</Strong>
                      <Small>{r.lead_id}</Small>
                    </Td>

                    <Td>
                      <div>{r.email || "—"}</div>
                      <Small>{r.raw_phone || r.phone_e164 || "—"}</Small>
                    </Td>

                    <Td>
                      <Pill $tone={r.sms_subscription ? "good" : "bad"}>
                        SMS: {r.sms_subscription ? "Yes" : "No"}
                      </Pill>
                      <Pill $tone={r.consent_marketing ? "good" : "bad"}>
                        Mktg: {r.consent_marketing ? "Yes" : "No"}
                      </Pill>
                    </Td>

                    <Td>
                      <Pill $tone={enrolled ? "good" : "bad"}>
                        {enrolled ? "Enrolled" : "Not enrolled"}
                      </Pill>
                      {r.enrolled_at ? <Small>since {fmt(r.enrolled_at)}</Small> : <Small>&nbsp;</Small>}
                    </Td>

                    <Td>
                      {r.campaign_name ? (
                        <>
                          <Strong>{r.campaign_name}</Strong>
                          <Small>
                            {r.campaign_kind || "—"} • {r.campaign_status || "—"}
                          </Small>
                        </>
                      ) : (
                        <span style={{ opacity: 0.7, fontWeight: 900 }}>—</span>
                      )}
                    </Td>

                    <Td>
                      <Small>{fmt(r.lead_created_at)}</Small>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
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

/* styles */

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
`;

const TableWrap = styled.div`
  overflow: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 1100px;

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
