// src/pages/Admin/Leads/NewLeadModal.jsx
import React, { useState } from "react";
import styled from "styled-components";
import { supabase } from "../../../lib/supabaseClient";

export default function NewLeadModal({ onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    phone: "",
    email: "",
    first_name: "",
    last_name: "",
    street_address: "",
    unit: "",
    city: "",
    state: "",
    zipcode: "",
    raw_address: "",
    sms_subscription: null,
    consent_marketing: null,
    can_text: true,
    status: "new",
  });

  async function save() {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("upsert-leads", {
        body: { leads: [{ ...form, source: "manual", source_ref: "admin_panel" }] },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.skipped_invalid) throw new Error("Phone number looks invalid. Please check formatting.");

      await onSaved();
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <ModalTop>
          <ModalTitle>New lead</ModalTitle>
          <X onClick={onClose}>×</X>
        </ModalTop>

        <Grid>
          <Field>
            <Label>Phone (required)</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(808) 555-1234" />
          </Field>

          <Field>
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>

          <Field>
            <Label>First name</Label>
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </Field>

          <Field>
            <Label>Last name</Label>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </Field>

          <Field style={{ gridColumn: "1 / -1" }}>
            <Label>Street address</Label>
            <Input value={form.street_address} onChange={(e) => setForm({ ...form, street_address: e.target.value })} />
          </Field>

          <Field>
            <Label>Unit</Label>
            <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </Field>

          <Field>
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>

          <Field>
            <Label>State</Label>
            <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </Field>

          <Field>
            <Label>Zip</Label>
            <Input value={form.zipcode} onChange={(e) => setForm({ ...form, zipcode: e.target.value })} />
          </Field>

          <Field style={{ gridColumn: "1 / -1" }}>
            <Label>Status</Label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="followUp">Follow-Up</option>
              <option value="interested">Interested</option>
              <option value="do_not_contact">Do not contact</option>
            </Select>
          </Field>

          <Field style={{ gridColumn: "1 / -1" }}>
            <Row>
              <Check>
                <input type="checkbox" checked={!!form.can_text} onChange={(e) => setForm({ ...form, can_text: e.target.checked })} />
                <span>Can text</span>
              </Check>
            </Row>
          </Field>
        </Grid>

        <ModalBottom>
          <Btn onClick={onClose} style={{ background: "rgba(47,47,50,0.06)" }}>
            Cancel
          </Btn>
          <Btn onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save lead"}
          </Btn>
        </ModalBottom>
      </ModalCard>
    </ModalBackdrop>
  );
}

/* ------------------ styles ------------------ */

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

const Row = styled.div`
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
`;

const Check = styled.label`
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 900;
  font-size: 12px;
  color: rgba(47, 47, 50, 0.8);

  input {
    transform: scale(1.05);
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

const ModalBottom = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
`;
