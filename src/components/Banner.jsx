import React, { useRef, useState } from "react";
import styled from "styled-components";
import { IMaskInput } from "react-imask";

export function Banner({
  heroImageSrc = "/images/HouseBanner.jpg",
  formspreeEndpoint = "https://formspree.io/f/xvzgenvn",
}) {
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const addressInputRef = useRef(null);

  const canAdvance = address.trim().length >= 6;
  const canSubmit =
    canAdvance &&
    name.trim().length >= 2 &&
    email.trim().includes("@") &&
    phone.length === 10;


  function handleAddressSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSubmitState("idle");

    if (!canAdvance) {
      setErrorMsg("Please enter a valid home address.");
      return;
    }

    setStep(2);

    setTimeout(() => {
      const first = document.getElementById("contact-name");
      first?.focus?.();
    }, 0);
  }

  async function handleFinalSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSubmitState("idle");

    if (!canSubmit) {
      setErrorMsg("Please enter your contact info so we can send your offer.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { address, name, email, phone, source: "Hero Banner" };

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

  function handleEditAddress() {
    setSubmitState("idle");
    setErrorMsg("");
    setStep(1);
  }

  return (
    <Wrap>
      <Frame>
        <BgImage src={heroImageSrc} alt="" aria-hidden="true" />
        <BgOverlay />

        <ContentPanel>
          <Kicker>Hello, we’re</Kicker>

          <Title>
            Stone Bridge <Accent>Buyers</Accent>
          </Title>

          <Role>Local Home Buyers Who Make Selling Simple</Role>

          <Subhead>
            Get a fair cash offer and decide what works best for you. No agents,
            no fees, and no obligation.
          </Subhead>

          {step === 1 && (
            <Form onSubmit={handleAddressSubmit}>
              <Pill>
                <PillInput
                  id="contact-address"
                  ref={addressInputRef}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your home address *"
                  aria-label="Enter your home address"
                  autoComplete="street-address"
                />
                <PillButton type="submit">Get My Free Offer</PillButton>
              </Pill>

              {!!errorMsg && <ErrorText>{errorMsg}</ErrorText>}
            </Form>
          )}

          {step === 2 && (
            <Form onSubmit={handleFinalSubmit}>
              <AddressLockRow>
                <LockedLabel>Home address</LockedLabel>

                <LockedPill>
                  <LockedInput
                    value={address}
                    readOnly
                    aria-label="Home address"
                  />
                  <EditBtn type="button" onClick={handleEditAddress}>
                    Edit
                  </EditBtn>
                </LockedPill>
              </AddressLockRow>

              {submitState !== "success" ? (
                <>
                  <ContactWrap>
                    <ContactGrid>
                      <Field>
                        <Label>Your name</Label>
                        <ContactInput
                          id="contact-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Name"
                          aria-label="Name"
                          autoComplete="name"
                        />
                      </Field>

                      <Field>
                        <Label>Email</Label>
                        <ContactInput
                          id="contact-email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email"
                          aria-label="Email"
                          autoComplete="email"
                        />
                      </Field>

                      <FieldWide>
                        <Label>Phone</Label>

                        <PhoneMask
                          mask="(000) 000-0000"
                          unmask={true} // digits only in `val`
                          placeholder="(555) 123-4567"
                          autoComplete="tel"
                          inputMode="tel"
                          value={phone}
                          prepare={(str) => {
                            // Runs BEFORE IMask applies characters (typing/paste/autofill)
                            const digits = String(str || "").replace(/\D/g, "");

                            // If the incoming chunk starts with 1 and is long enough, drop it
                            if (digits.length >= 11 && digits.startsWith("1")) return digits.slice(1);

                            return digits;
                          }}
                          onAccept={(val) => {
                            let digits = String(val || "").replace(/\D/g, "");

                            // Safety: if any path still leaves a leading 1, remove it
                            if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);

                            // Safety: never store more than 10 digits
                            if (digits.length > 10) digits = digits.slice(0, 10);

                            setPhone(digits);
                          }}
                        />
                      </FieldWide>
                    </ContactGrid>

                    <Hint>
                      We’ll use this only to send your offer and follow up if
                      needed.
                    </Hint>
                  </ContactWrap>

                  <BottomSubmitRow>
                    <BottomSubmit
                      type="submit"
                      disabled={isSubmitting || !canSubmit}
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </BottomSubmit>
                  </BottomSubmitRow>

                  {!!errorMsg && <ErrorText>{errorMsg}</ErrorText>}
                </>
              ) : (
                <Success>
                  ✅ Got it — we’ll reach out soon with your offer options.
                </Success>
              )}

              {submitState === "error" && !!errorMsg && (
                <ErrorText>{errorMsg}</ErrorText>
              )}
            </Form>
          )}

          <TrustLine>Trusted Home Buyers • Based in Texas</TrustLine>
        </ContentPanel>
      </Frame>
    </Wrap>
  );
}

/* ---------------- styles ---------------- */

const Kicker = styled.div`
  color: rgba(255, 255, 255, 0.65);
  font-size: 13px;
  letter-spacing: 0.1em;

  @media (max-width: 520px) {
    font-size: 12px;
  }
`;

const Title = styled.h1`
  margin: 5px 0 5px;
  font-size: 52px;
  line-height: 1.02;
  letter-spacing: -0.04em;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);

  overflow-wrap: anywhere;

  @media (max-width: 980px) {
    font-size: 44px;
  }

  @media (max-width: 520px) {
    margin-top: 12px;
    font-size: 36px;
  }
`;

const Accent = styled.span`
  color: #7da8c1;
`;

const Role = styled.div`
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.86);
  font-weight: 800;

  @media (max-width: 520px) {
    font-size: 13px;
    line-height: 1.35;
  }
`;

const Subhead = styled.p`
  margin-top: 14px;
  max-width: 520px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 14px;
  line-height: 1.65;

  @media (max-width: 520px) {
    font-size: 13px;
    line-height: 1.6;
  }
`;

const PillInput = styled.input`
  border: 0;
  outline: none;
  padding: 12px 16px;
  font-size: 13px;
  color: rgba(2, 6, 23, 0.88);
  background: transparent;

  @media (max-width: 520px) {
    padding: 12px 14px;
  }
`;

/* Step 2 address lock */
const AddressLockRow = styled.div`
  margin-top: 2px;
`;

const LockedLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin: 0 0 8px;
`;

const LockedInput = styled.input`
  border: 0;
  outline: none;
  padding: 12px 16px;
  font-size: 13px;
  color: rgba(2, 6, 23, 0.88);
  background: transparent;

  @media (max-width: 520px) {
    padding: 12px 14px;
  }
`;

/* Step 2 contact */
const ContactWrap = styled.div`
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const Field = styled.div``;

const Label = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin: 0 0 6px;
`;

const PhoneMask = styled(IMaskInput)`
  width: 100%;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  outline: none;

  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);

  padding: 12px 12px;
  font-size: 13px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.42);
  }

  &:focus {
    border-color: rgba(111, 136, 176, 0.55);
    box-shadow: 0 0 0 4px rgba(111, 136, 176, 0.14);
  }
`;

const ContactInput = styled.input`
  width: 100%;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  outline: none;

  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);

  padding: 12px 12px;
  font-size: 13px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.42);
  }

  &:focus {
    border-color: rgba(111, 136, 176, 0.55);
    box-shadow: 0 0 0 4px rgba(111, 136, 176, 0.14);
  }
`;

const Hint = styled.div`
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.46);
  font-size: 12px;
  line-height: 1.5;
`;

const Success = styled.div`
  margin-top: 14px;
  padding: 12px 12px;
  border-radius: 18px;
  background: rgba(111, 136, 176, 0.14);
  border: 1px solid rgba(111, 136, 176, 0.28);
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
`;

const ErrorText = styled.div`
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 12px;
  padding: 10px 12px;
  border-radius: 18px;
  background: rgba(220, 38, 38, 0.12);
  border: 1px solid rgba(220, 38, 38, 0.2);
`;

const TrustLine = styled.div`
  margin-top: 14px;
  width: 100%;
  text-align: center;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.42);
  text-transform: uppercase;

  @media (max-width: 520px) {
    font-size: 11px;
    letter-spacing: 0.06em;
  }
`;

/* ---------------- layout styles ---------------- */

const Wrap = styled.section`
  width: 100%;
  background: #101217;
  overflow: hidden;
`;

const Frame = styled.div`
  position: relative;
  overflow: hidden;

  width: 100%;
  padding: clamp(14px, 3vw, 34px);

  min-height: clamp(700px, 60vh, 760px);
  height: auto;

  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.55);
  outline: 1px solid rgba(255, 255, 255, 0.06);

  display: flex;
  align-items: center;
  justify-content: center;
`;

const BgImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 58% 45%;

  filter: grayscale(0.45) contrast(1.1) brightness(0.95);
  transform: scale(1.02);
`;

const BgOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: white;
  opacity: 0.5;
`;

const ContentPanel = styled.div`
  z-index: 1;

  width: min(680px, 100%);
  padding: 30px 28px;

  background: #101217;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);

  box-shadow:
    0 18px 45px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);

  max-height: calc(100dvh - 48px);
  overflow: auto;

  @media (max-width: 520px) {
    padding: 22px 16px;
    border-radius: 18px;
    max-height: calc(100dvh - 28px);
  }
`;

const Form = styled.form`
  margin: 18px auto 0;
  width: 100%;
  max-width: 520px;

  @media (max-width: 680px) {
    max-width: 100%;
  }
`;

/* Step 1 pill */
const Pill = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 190px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.92);
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
    border-radius: 18px;
  }
`;

const PillButton = styled.button`
  border: 0;
  cursor: pointer;
  padding: 12px 14px;
  font-weight: 900;
  font-size: 12px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: white;
  background: linear-gradient(180deg, #7da8c1, #4f6d8a);

  &:hover {
    filter: brightness(1.06);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  @media (max-width: 680px) {
    width: 100%;
    padding: 13px 14px;
  }
`;

/* Step 2 address lock */
const LockedPill = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 88px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.92);
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
    border-radius: 18px;
  }
`;

const EditBtn = styled.button`
  border: 0;
  cursor: pointer;
  padding: 12px 14px;
  font-weight: 900;
  font-size: 12px;
  letter-spacing: 0.05em;
  text-transform: uppercase;

  color: rgba(2, 6, 23, 0.78);
  background: rgba(2, 6, 23, 0.06);

  &:hover {
    background: rgba(2, 6, 23, 0.1);
  }

  @media (max-width: 680px) {
    width: 100%;
    padding: 13px 14px;
  }
`;

/* Contact grid */
const ContactGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const FieldWide = styled.div`
  grid-column: span 2;

  @media (max-width: 680px) {
    grid-column: auto;
  }
`;

const BottomSubmitRow = styled.div`
  margin-top: 14px;
  display: flex;
  justify-content: center;
`;

const BottomSubmit = styled.button`
  border: 0;
  cursor: pointer;
  padding: 12px 60px;
  border-radius: 30px;

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

  @media (max-width: 520px) {
    width: 100%;
    padding: 13px 14px;
    border-radius: 18px;
  }
`;
