// src/pages/Admin/Leads/EditLeadModal.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { supabase } from "../../../lib/supabaseClient";

export default function EditLeadModal({ leadId, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lead, setLead] = useState(null);

  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    street_address: "",
    unit: "",
    city: "",
    state: "",
    zipcode: "",
    raw_address: "",
    can_text: true,
    sms_subscription: null,
    consent_marketing: null,
    status: "new",
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
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
          raw_address,
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
        .eq("id", leadId)
        .maybeSingle();

      setLoading(false);

      if (error) {
        console.error(error);
        alert(error.message);
        onClose();
        return;
      }
      if (!data) {
        alert("Lead not found.");
        onClose();
        return;
      }

      setLead(data);
      setForm({
        email: data.email || "",
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        street_address: data.street_address || "",
        unit: data.unit || "",
        city: data.city || "",
        state: data.state || "",
        zipcode: data.zipcode || "",
        raw_address: data.raw_address || "",
        can_text: !!data.can_text,
        sms_subscription: data.sms_subscription,
        consent_marketing: data.consent_marketing,
        status: data.status || "new",
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  function triValue(v) {
    return v === true ? "true" : v === false ? "false" : "null";
  }

  function setTri(key, v) {
    const next = v === "true" ? true : v === "false" ? false : null;
    setForm((p) => ({ ...p, [key]: next }));
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        email: form.email.trim() ? form.email.trim() : null,
        first_name: form.first_name.trim() ? form.first_name.trim() : null,
        last_name: form.last_name.trim() ? form.last_name.trim() : null,
        street_address: form.street_address.trim() ? form.street_address.trim() : null,
        unit: form.unit.trim() ? form.unit.trim() : null,
        city: form.city.trim() ? form.city.trim() : null,
        state: form.state.trim() ? form.state.trim() : null,
        zipcode: form.zipcode.trim() ? form.zipcode.trim() : null,
        raw_address: form.raw_address.trim() ? form.raw_address.trim() : null,

        can_text: !!form.can_text,
        sms_subscription: form.sms_subscription,
        consent_marketing: form.consent_marketing,

        status: form.status,
        status_updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("leads").update(payload).eq("id", leadId);
      if (error) throw error;

      await onSaved();
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  const readOnlyPhone = lead?.raw_phone || lead?.phone_e164 || "";

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <ModalTop>
          <ModalTitle>Edit lead</ModalTitle>
          <X onClick={onClose}>×</X>
        </ModalTop>

        {loading ? (
          <Hint>Loading…</Hint>
        ) : (
          <>
            <Hint>
              Editing <b>{readOnlyPhone || leadId}</b>
            </Hint>

            <Grid>
              <Field>
                <Label>Phone (read-only)</Label>
                <Input value={readOnlyPhone} disabled />
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
                    <input
                      type="checkbox"
                      checked={!!form.can_text}
                      onChange={(e) => setForm({ ...form, can_text: e.target.checked })}
                    />
                    <span>Can text</span>
                  </Check>
                </Row>
              </Field>

              <Field>
                <Label>SMS subscription</Label>
                <Select value={triValue(form.sms_subscription)} onChange={(e) => setTri("sms_subscription", e.target.value)}>
                  <option value="null">Unknown</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Select>
              </Field>

              <Field>
                <Label>Marketing consent</Label>
                <Select value={triValue(form.consent_marketing)} onChange={(e) => setTri("consent_marketing", e.target.value)}>
                  <option value="null">Unknown</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Select>
              </Field>
            </Grid>

            <ModalBottom>
              <Btn onClick={onClose} style={{ background: "rgba(47,47,50,0.06)" }}>
                Cancel
              </Btn>
              <Btn onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Btn>
            </ModalBottom>
          </>
        )}
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

const Summary = styled.div`
  margin-top: 12px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(243, 244, 246, 0.9);
  border: 1px solid rgba(47, 47, 50, 0.08);
  font-weight: 900;
  color: rgba(47, 47, 50, 0.8);
`;
