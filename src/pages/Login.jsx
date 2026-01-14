import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Login({
  title = "Admin Access",
  subtitle = "Sign in to view submissions",
}) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [msg, setMsg] = useState("");

  // If already signed in, go to /admin
  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      if (data?.session) navigate("/admin", { replace: true });
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session) navigate("/admin", { replace: true });
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      // ✅ Don't navigate until we have a session for sure
      const session = data?.session || (await supabase.auth.getSession()).data?.session;
      if (!session) throw new Error("Signed in, but session not ready yet. Try again.");

      navigate("/admin", { replace: true });
    } catch (err) {
      setStatus("error");
      setMsg(err?.message || "Could not sign in.");
    } finally {
      setStatus("idle");
    }
  };


  return (
    <Page>
      <Card>
        <BrandRow>
          <Mark />
          <div>
            <Title>{title}</Title>
            <SubTitle>{subtitle}</SubTitle>
          </div>
        </BrandRow>

        <Form onSubmit={signIn}>
          <Field>
            <Label>Email</Label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </Field>

          <Field>
            <Label>Password</Label>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Field>

          <PrimaryButton type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Signing in…" : "Sign in"}
          </PrimaryButton>

          {msg ? <Notice $error={status === "error"}>{msg}</Notice> : null}
        </Form>
      </Card>
    </Page>
  );
}

/* styling unchanged */
const Page = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px 18px;
  background: #ffffff;
`;
const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: #f3f4f6;
  border-radius: 30px;
  padding: 26px;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.25);
`;
const BrandRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;
const Mark = styled.div`
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #7da8c1;
  box-shadow: 0 0 0 6px rgba(125, 168, 193, 0.14);
`;
const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  color: #2f2f32;
  font-weight: 900;
`;
const SubTitle = styled.p`
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(47, 47, 50, 0.68);
`;
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;
const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const Label = styled.label`
  font-size: 12px;
  font-weight: 800;
  color: rgba(47, 47, 50, 0.75);
`;
const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(47, 47, 50, 0.1);
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: #7da8c1;
  }
`;
const PrimaryButton = styled.button`
  margin-top: 6px;
  border: 0;
  border-radius: 18px;
  padding: 14px 16px;
  font-weight: 900;
  cursor: pointer;
  background: #7da8c1;
  color: #fff;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
const Notice = styled.div`
  border-radius: 14px;
  padding: 12px;
  font-size: 13px;
  font-weight: 800;
  color: ${(p) => (p.$error ? "#7f1d1d" : "#14532d")};
  background: ${(p) => (p.$error ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)")};
`;
