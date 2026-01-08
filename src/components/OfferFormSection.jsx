import React, { useMemo, useState } from "react";
import styled from "styled-components";

/**
 * OfferFormSection
 * - Two-column layout (form left, benefits right) like your reference
 * - Matches your “slate/navy + dark glass” vibe (no logos/reviews)
 * - Submits to Formspree (JSON) with the same endpoint prop
 */
export function OfferFormSection({
  formspreeEndpoint = "https://formspree.io/f/xvzgenvn",
  title = "Get Your Free Cash Offer",
  subtitle = "Tell us a little about the home — we’ll send a no-obligation offer.",
  benefitsTitle = "What you get",
  benefits = [
    "No fees. No commissions.",
    "Sell as-is — no repairs or cleanup.",
    "Choose your close date.",
    "Local, straightforward communication.",
    "No pressure — you decide what’s best.",
  ],
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState("idle"); // idle | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    streetAddress: "",
    unit: "",
    city: "",
    state: "",
    zip: "",
  });

  const requiredKeys = useMemo(
    () => ["firstName", "lastName", "phone", "email", "streetAddress", "city", "state", "zip"],
    []
  );

  const isValid = useMemo(() => {
    const hasRequired = requiredKeys.every((k) => String(form[k] || "").trim().length > 0);
    const emailOk = form.email.includes("@");
    const phoneOk = form.phone.replace(/\D/g, "").length >= 7;
    return hasRequired && emailOk && phoneOk;
  }, [form, requiredKeys]);

  function update(key) {
    return (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSubmitState("idle");

    if (!isValid) {
      setErrorMsg("Please fill out the required fields so we can send your offer.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        source: "Offer Form Section",
      };

      const res = await fetch(formspreeEndpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg =
          data?.errors?.[0]?.message ||
          "Something went wrong submitting the form. Please try again.";
        throw new Error(msg);
      }

      setSubmitState("success");
    } catch (err) {
      setSubmitState("error");
      setErrorMsg(err?.message || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Wrap>
      <Inner>
        <CardGrid>
          <FormCard>
            <FormTop>
              <FormTitle>{title}</FormTitle>
              <FormSubtitle>{subtitle}</FormSubtitle>
            </FormTop>

            {submitState === "success" ? (
              <Success>
                ✅ Received — we’ll review and reach out shortly with next steps.
              </Success>
            ) : (
              <Form onSubmit={handleSubmit}>
                <Grid2>
                  <Field>
                    <Label>
                      First name <Req>*</Req>
                    </Label>
                    <Input
                      id='firstName'
                      value={form.firstName}
                      onChange={update("firstName")}
                      placeholder="First name"
                      autoComplete="given-name"
                    />
                  </Field>

                  <Field>
                    <Label>
                      Last name <Req>*</Req>
                    </Label>
                    <Input
                      id='lastName'
                      value={form.lastName}
                      onChange={update("lastName")}
                      placeholder="Last name"
                      autoComplete="family-name"
                    />
                  </Field>

                  <Field>
                    <Label>
                      Phone <Req>*</Req>
                    </Label>
                    <Input
                      id='phone'
                      value={form.phone}
                      onChange={update("phone")}
                      placeholder="Phone"
                      autoComplete="tel"
                      inputMode="tel"
                    />
                  </Field>

                  <Field>
                    <Label>
                      Email <Req>*</Req>
                    </Label>
                    <Input
                      id='email'
                      value={form.email}
                      onChange={update("email")}
                      placeholder="Email"
                      autoComplete="email"
                      inputMode="email"
                    />
                  </Field>
                </Grid2>

                <Field>
                  <Label>
                    Street address <Req>*</Req>
                  </Label>
                  <Input
                    id='streetAddress'
                    value={form.streetAddress}
                    onChange={update("streetAddress")}
                    placeholder="Street address"
                    autoComplete="street-address"
                  />
                </Field>

                <Field>
                  <Label>Unit</Label>
                  <Input
                    id='unit'
                    value={form.unit}
                    onChange={update("unit")}
                    placeholder="Unit (optional)"
                  />
                </Field>

                <Grid3>
                  <Field>
                    <Label>
                      City <Req>*</Req>
                    </Label>
                    <Input
                      id='city'
                      value={form.city}
                      onChange={update("city")}
                      placeholder="City"
                      autoComplete="address-level2"
                    />
                  </Field>

                  <Field>
                    <Label>
                      State <Req>*</Req>
                    </Label>
                    <Select value={form.state} onChange={update("state")} aria-label="State">
                      <option value="">Select…</option>
                      <option value="HI">Hawaii (HI)</option>
                      <option value="AK">Alaska (AK)</option>
                      <option value="AZ">Arizona (AZ)</option>
                      <option value="CA">California (CA)</option>
                      <option value="CO">Colorado (CO)</option>
                      <option value="FL">Florida (FL)</option>
                      <option value="NV">Nevada (NV)</option>
                      <option value="OR">Oregon (OR)</option>
                      <option value="TX">Texas (TX)</option>
                      <option value="WA">Washington (WA)</option>
                    </Select>
                  </Field>

                  <Field>
                    <Label>
                      Zip <Req>*</Req>
                    </Label>
                    <Input
                      id='zip'
                      value={form.zip}
                      onChange={update("zip")}
                      placeholder="Zip"
                      autoComplete="postal-code"
                      inputMode="numeric"
                    />
                  </Field>
                </Grid3>

                <BottomRow>
                  <Submit
                    type="submit"
                    disabled={isSubmitting || !isValid}
                    aria-disabled={isSubmitting || !isValid}
                  >
                    {isSubmitting ? "Submitting…" : "Submit"}
                  </Submit>
                </BottomRow>

                {!!errorMsg && <ErrorText>{errorMsg}</ErrorText>}
              </Form>
            )}
          </FormCard>

          <SideCard>
            <SideTitle>{benefitsTitle}</SideTitle>

            <BenefitList>
              {benefits.map((b) => (
                <BenefitItem key={b}>
                  <CheckDot aria-hidden="true">✓</CheckDot>
                  <BenefitText>{b}</BenefitText>
                </BenefitItem>
              ))}
            </BenefitList>

            <SideNote>
              Prefer a quick call? Drop your phone number and a good time — we’ll
              keep it simple.
            </SideNote>
          </SideCard>
        </CardGrid>
      </Inner>
    </Wrap>
  );
}

/* ---------------- styles ---------------- */

const Wrap = styled.section`
  width: 100%;
  margin: auto;
  background: #101217;
  padding: 34px 12px;

  @media (min-width: 720px) {
    padding: 54px 18px;
  }
`;

const Inner = styled.div`
  max-width: 1180px;
  margin: 0 auto;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 18px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const CardBase = styled.div`
  background: rgba(20, 22, 27, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;

  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  box-shadow:
    0 18px 45px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
`;

const FormCard = styled(CardBase)`
  padding: 22px 20px;

  @media (min-width: 720px) {
    padding: 28px 26px;
  }
`;

const SideCard = styled(CardBase)`
  padding: 22px 20px;

  @media (min-width: 720px) {
    padding: 28px 26px;
  }
`;

const FormTop = styled.div`
  margin-bottom: 14px;
`;

const FormTitle = styled.h2`
  margin: 0;
  font-size: 28px;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.92);

  @media (max-width: 520px) {
    font-size: 22px;
  }
`;

const FormSubtitle = styled.p`
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.62);
  font-size: 13px;
  line-height: 1.6;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const Grid3 = styled.div`
  display: grid;
  grid-template-columns: 1.3fr 0.9fr 0.9fr;
  gap: 10px;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div``;

const Label = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin: 0 0 6px;
`;

const Req = styled.span`
  color: #7da8c1;
`;

const ControlBase = styled.div`
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);

  color: rgba(255, 255, 255, 0.92);
  box-sizing: border-box;

  padding: 12px 12px;
  font-size: 13px;

  outline: none;

  &:focus-within {
    border-color: rgba(111, 136, 176, 0.55);
    box-shadow: 0 0 0 4px rgba(111, 136, 176, 0.14);
  }
`;

const Input = styled.input`
  ${ControlBase};
  display: block;
  border-radius: 30px;
  border: none;
  width: 100%;
  padding: 5px 15px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.42);
  }
`;

const Select = styled.select`
  ${ControlBase};
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, rgba(255, 255, 255, 0.55) 50%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.55) 50%, transparent 50%);
  background-position: calc(100% - 18px) calc(50% - 2px), calc(100% - 13px) calc(50% - 2px);
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  display: block;
  border-radius: 30px;
  border: none;
  width: 100%;
  padding: 5px 15px;

  option {
    color: #0b1220;
  }
`;

const BottomRow = styled.div`
  margin-top: 8px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const Submit = styled.button`
  border: 0;
  cursor: pointer;
  padding: 12px 16px;
  border-radius: 30px;
  margin-top: 16px;

  font-weight: 900;
  font-size: 12px;
  letter-spacing: 0.05em;
  text-transform: uppercase;

  color: white;
  background: linear-gradient(180deg, #7da8c1, #4f6d8a);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.35);

  &:hover {
    filter: brightness(1.06);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
    filter: none;
  }

  @media (max-width: 680px) {
    width: 100%;
  }
`;

const ErrorText = styled.div`
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.84);
  font-size: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(220, 38, 38, 0.12);
  border: 1px solid rgba(220, 38, 38, 0.2);
`;

const Success = styled.div`
  margin-top: 6px;
  padding: 14px 14px;
  border-radius: 14px;
  background: rgba(111, 136, 176, 0.14);
  border: 1px solid rgba(111, 136, 176, 0.28);
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  line-height: 1.5;
`;

/* side */
const SideTitle = styled.h3`
  margin: 0 0 12px;
  color: rgba(255, 255, 255, 0.92);
  font-size: 18px;
  letter-spacing: -0.01em;
`;

const BenefitList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const BenefitItem = styled.div`
  display: grid;
  grid-template-columns: 22px 1fr;
  gap: 10px;
  align-items: start;

  padding: 10px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

const CheckDot = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: grid;
  place-items: center;

  background: rgba(111, 136, 176, 0.16);
  border: 1px solid rgba(111, 136, 176, 0.35);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 900;
  font-size: 12px;
`;

const BenefitText = styled.div`
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  line-height: 1.55;
`;

const SideNote = styled.div`
  margin-top: 14px;
  color: rgba(255, 255, 255, 0.48);
  font-size: 12px;
  line-height: 1.55;
`;
