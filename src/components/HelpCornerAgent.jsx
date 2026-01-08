import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Button, Card, Form, Collapse, Spinner, Alert, Badge } from "react-bootstrap";
import { ChatDotsFill } from "react-bootstrap-icons";

export default function HelpCornerAgent({
  brand = "Help Desk",
  subtitle = "How can we help?",
  position = { bottom: 18, right: 18 },
  accent = "#101217",
  expandAfterMs = 15000,
  expandedWidth = 350,
}) {
  const [open, setOpen] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const [hasWaited, setHasWaited] = useState(false);
  const [everOpened, setEverOpened] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHasWaited(true), expandAfterMs);
    return () => clearTimeout(t);
  }, [expandAfterMs]);

  const showLauncherCopy = hasWaited && !open && !everOpened;

  const canSend =
    message.trim().length >= 8 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    status !== "sending";

  const reset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setStatus("idle");
    setError("");
  };

  const toggleOpen = () => {
    setOpen((v) => {
      const next = !v;
      if (next) setEverOpened(true);
      return next;
    });
  };

  const prettyField = (field) => {
    const map = {
      email: "Email",
      phone: "Phone",
      firstName: "First name",
      lastName: "Last name",
      message: "Message",
    };
    return map[field] || "This field";
  };

  const prettyCode = (code) => {
    const map = {
      TYPE_EMAIL: "Please enter a valid email address.",
      TYPE_URL: "Please enter a valid URL.",
      REQUIRED_FIELD: "This field is required.",
      EMPTY: "This field can’t be empty.",
    };
    return map[code] || null;
  };

  const friendlyFormspreeError = async (res) => {
    let fallback = "Something went wrong. Please try again.";

    try {
      const data = await res.json();

      if (data?.errors?.length) {
        const first = data.errors[0];
        const codeMsg = prettyCode(first.code);
        const fieldLabel = prettyField(first.field);

        return (
          codeMsg ||
          (first.message
            ? `${fieldLabel}: ${first.message}`
            : `${fieldLabel}: Please check this field and try again.`)
        );
      }

      if (data?.error && typeof data.error === "string") return data.error;
      return fallback;
    } catch {
      try {
        const text = await res.text();
        return text?.trim() ? "Something went wrong. Please check your info and try again." : fallback;
      } catch {
        return fallback;
      }
    }
  };

  const send = async () => {
    setStatus("sending");
    setError("");

    try {
      const formData = new FormData();
      formData.append("source", brand);
      formData.append("firstName", firstName.trim());
      formData.append("lastName", lastName.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("message", message.trim());

      const res = await fetch("https://formspree.io/f/xwvpgjwd", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const msg = await friendlyFormspreeError(res);
        throw new Error(msg);
      }

      setStatus("sent");
    } catch (e) {
      setStatus("error");
      setError(e?.message || "Something went wrong.");
    }
  };

  return (
    <Wrap style={{ bottom: position.bottom, right: position.right }}>
      <Panel>
        <Collapse in={open}>
          <div>
            <Card
              className="shadow-sm border-0"
              style={{ borderRadius: 30, overflow: "hidden", width: expandedWidth }}
            >
              <Header $accent={accent}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Dot />
                  <div style={{ lineHeight: 1.1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{brand}</div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>{subtitle}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Badge bg="light" text="dark" style={{ fontWeight: 700, borderRadius: 30 }}>
                    Live help
                  </Badge>
                  <CloseBtn aria-label="Close" onClick={() => setOpen(false)}>
                    ✕
                  </CloseBtn>
                </div>
              </Header>

              <Body>
                {status === "sent" ? (
                  <div>
                    <Alert variant="success" className="mb-3" style={{ borderRadius: 12 }}>
                      Sent! We’ll get back to you soon.
                    </Alert>
                    <div className="d-flex gap-2">
                      <Button variant="outline-secondary" className="w-100" onClick={reset}>
                        Send another
                      </Button>
                      <PrimaryButton $accent={accent} className="w-100" onClick={() => setOpen(false)}>
                        Done
                      </PrimaryButton>
                    </div>
                  </div>
                ) : (
                  <FormTheme>
                    {status === "error" && (
                      <Alert variant="danger" className="mb-3" style={{ borderRadius: 12 }}>
                        {error || "Couldn’t send. Try again."}
                      </Alert>
                    )}

                    <NameRow>
                      <Form.Group className="mb-2" style={{ flex: 1 }}>
                        <Form.Label className="mb-1" style={{ fontSize: 12, fontWeight: 700 }}>
                          First name
                        </Form.Label>
                        <Form.Control
                          size="sm"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First"
                          style={{ borderRadius: 12 }}
                        />
                      </Form.Group>

                      <Form.Group className="mb-2" style={{ flex: 1 }}>
                        <Form.Label className="mb-1" style={{ fontSize: 12, fontWeight: 700 }}>
                          Last name
                        </Form.Label>
                        <Form.Control
                          size="sm"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last"
                          style={{ borderRadius: 12 }}
                        />
                      </Form.Group>
                    </NameRow>

                    <Form.Group className="mb-2">
                      <Form.Label className="mb-1" style={{ fontSize: 12, fontWeight: 700 }}>
                        Email
                      </Form.Label>
                      <Form.Control
                        size="sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        style={{ borderRadius: 12 }}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label className="mb-1" style={{ fontSize: 12, fontWeight: 700 }}>
                        Phone
                      </Form.Label>
                      <Form.Control
                        size="sm"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Phone"
                        style={{ borderRadius: 12 }}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label className="mb-1" style={{ fontSize: 12, fontWeight: 700 }}>
                        How can we help?
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Let us know how we can help!"
                        style={{ borderRadius: 12, resize: "none" }}
                      />
                      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>
                        Tip: include address/date details if relevant.
                      </div>
                    </Form.Group>

                    <PrimaryButton
                      $accent={accent}
                      className="w-100"
                      onClick={send}
                      disabled={!canSend}
                      style={{ borderRadius: 14, fontWeight: 800 }}
                    >
                      {status === "sending" ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-2" />
                          Sending…
                        </>
                      ) : (
                        "Send message"
                      )}
                    </PrimaryButton>
                  </FormTheme>
                )}
              </Body>
            </Card>
          </div>
        </Collapse>

        <LauncherRow $right={open || everOpened}>
          <Launcher
            type="button"
            onClick={toggleOpen}
            $accent={accent}
            $expanded={showLauncherCopy}
            $expandedWidth={expandedWidth}
            aria-expanded={open}
            aria-label={open ? "Close help" : "Open help"}
          >
            <LauncherCopy $visible={showLauncherCopy}>
              <span style={{ fontWeight: 900 }}>Need help?</span>
              <span style={{ fontSize: 12, opacity: 0.9 }}>Message us</span>
            </LauncherCopy>

            <BubbleIcon aria-hidden>
              <ChatDotsFill size={20} />
            </BubbleIcon>
          </Launcher>
        </LauncherRow>
      </Panel>
    </Wrap>
  );
}

const Wrap = styled.div`
  position: fixed;
  z-index: 2147483000;
`;

const Panel = styled.div`
  width: auto;
  max-width: calc(100vw - 28px);
`;

const Header = styled.div`
  padding: 12px 20px;
  color: #fff;
  background: ${(p) => p.$accent};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Body = styled.div`
  padding: 12px;
  background: #fff;
`;

const PrimaryButton = styled(Button)`
  && {
    background: ${(p) => p.$accent};
    border-color: ${(p) => p.$accent};
    color: #fff;
  }
  &&:hover {
    filter: brightness(0.95);
  }
  &&:disabled {
    background: ${(p) => p.$accent};
    border-color: ${(p) => p.$accent};
    opacity: 0.55;
  }
`;

const NameRow = styled.div`
  display: flex;
  gap: 10px;
`;

const LauncherRow = styled.div`
  margin-top: 10px;
  display: flex;
  justify-content: ${(p) => (p.$right ? "flex-end" : "flex-start")};
`;

const Launcher = styled.button`
  border-radius: 999px;
  background: ${(p) => p.$accent};
  border: 1px solid #f3f4f6;
  color: #fff;
  position: relative;
  overflow: hidden;
  width: ${(p) => (p.$expanded ? `${p.$expandedWidth}px` : "56px")};
  height: 56px;
  padding: 0;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.18);
  transition: width 260ms ease, transform 120ms ease, box-shadow 120ms ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.22);
  }
`;

const LauncherCopy = styled.span`
  position: absolute;
  left: 18px;
  right: 56px;
  top: 50%;
  display: flex;
  flex-direction: column;
  line-height: 1.05;
  text-align: left;
  white-space: nowrap;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transform: ${(p) => (p.$visible ? "translateY(-50%)" : "translateY(calc(-50% + 6px))")};
  transition: opacity 180ms ease, transform 180ms ease;
  pointer-events: none;
`;

const BubbleIcon = styled.span`
  position: absolute;
  right: 17px;
  top: 50%;
  transform: translateY(-54%);
  display: grid;
  place-items: center;
`;

const CloseBtn = styled.button`
  border: 0;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  width: 30px;
  height: 30px;
  border-radius: 30px;
  font-weight: 900;
  display: grid;
  place-items: center;

  &:hover {
    background: rgba(255, 255, 255, 0.28);
  }
`;

const Dot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.22);
`;

const FormTheme = styled.div`
  .form-control:focus {
    border-color: #7da8c1 !important;
    box-shadow: 0 0 0 0.2rem #7da8c1(218, 82, 71, 0.28) !important;
  }
`;
