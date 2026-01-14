import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [status, setStatus] = useState("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setStatus("loading");
      setMsg("");

      const { data: s1 } = await supabase.auth.getSession();
      if (s1?.session) {
        if (mounted) {
          setMsg("Set a new password to finish.");
          setStatus("idle");
        }
        return;
      }

      const hash = window.location.hash?.replace(/^#/, "");
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token || !refresh_token) {
        if (mounted) {
          setStatus("error");
          setMsg("Auth session missing! Please reopen the reset link from your email.");
        }
        return;
      }

      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (mounted) {
        if (error) {
          setStatus("error");
          setMsg(error.message || "Could not establish session from reset link.");
        } else {
          setMsg("Set a new password to finish.");
          setStatus("idle");
          // Optional: clean up the URL so tokens aren't left in the address bar
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  const updatePassword = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setMsg("");

    try {
      if (pw.length < 8) throw new Error("Password must be at least 8 characters.");
      if (pw !== pw2) throw new Error("Passwords don’t match.");

      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;

      setMsg("Password updated. Redirecting…");
      navigate("/admin");
    } catch (err) {
      setStatus("error");
      setMsg(err?.message || "Could not update password.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <Page>
      <Card>
        <Title>Set your password</Title>
        <Sub>Choose a new password to finish signing in.</Sub>

        <Form onSubmit={updatePassword}>
          <Field>
            <Label>New password</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </Field>

          <Field>
            <Label>Confirm password</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="Repeat password"
              required
            />
          </Field>

          <Button type="submit" disabled={status === "loading" || msg.includes("missing")}>
            {status === "loading" ? "Saving…" : "Save password"}
          </Button>

          {msg ? <Notice $error={status === "error"}>{msg}</Notice> : null}
        </Form>
      </Card>
    </Page>
  );
}

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
const Title = styled.h1`
  margin: 0 0 6px;
  font-size: 22px;
  color: #2f2f32;
  font-weight: 900;
`;
const Sub = styled.p`
  margin: 0 0 18px;
  font-size: 13px;
  color: rgba(47, 47, 50, 0.68);
  font-weight: 700;
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
const Button = styled.button`
  border: 0;
  border-radius: 18px;
  padding: 14px 16px;
  font-weight: 900;
  cursor: pointer;
  background: #7da8c1;
  color: #fff;
  &:disabled {
    opacity: 0.6;
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
