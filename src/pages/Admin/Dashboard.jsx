import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "../../auth/useAuth";

export default function AdminDashboard() {
  const { session } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!session) return;

    const client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      }
    );

    async function load() {
      const [{ count: quotes }, { count: help }] = await Promise.all([
        client
          .from("quote_form_submissions")
          .select("*", { count: "exact", head: true }),
        client
          .from("help_agent_submissions")
          .select("*", { count: "exact", head: true }),
      ]);

      setStats({ quotes, help });
    }

    load();
  }, [session]);

  return (
    <>
      <H1>Dashboard</H1>

      <Cards>
        <StatCard>
          <Label>Quote Form Submissions</Label>
          <Value>{stats?.quotes ?? "—"}</Value>
        </StatCard>

        <StatCard>
          <Label>Help Agent Requests</Label>
          <Value>{stats?.help ?? "—"}</Value>
        </StatCard>
      </Cards>
    </>
  );
}

/* styles */

const H1 = styled.h1`
  margin: 0 0 18px;
  font-size: 26px;
  font-weight: 900;
  color: #2f2f32;
`;

const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
`;

const StatCard = styled.div`
  background: #f3f4f6;
  border-radius: 22px;
  padding: 18px;
`;

const Label = styled.div`
  font-size: 12px;
  font-weight: 900;
  color: rgba(47, 47, 50, 0.6);
`;

const Value = styled.div`
  margin-top: 6px;
  font-size: 32px;
  font-weight: 900;
  color: #2f2f32;
`;
