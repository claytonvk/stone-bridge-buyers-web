import { useState } from "react";
import styled from "styled-components";

export function ContactForm() {
  const [status, setStatus] = useState("idle");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.target);

    formData.append("source", "Website Contact Form");

    const res = await fetch("https://formspree.io/f/xvzgenvn", {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      setStatus("success");
      e.target.reset();
    } else {
      setStatus("error");
    }
  }

  return (
    <Wrapper id="contact">
      <FormWrap>
        <FormTitle>Contact Us</FormTitle>
        <FormSubTitle>
          Interested in our product? Fill out some info and we will be in touch
          shortly. We can’t wait to hear from you!
        </FormSubTitle>

        <Form onSubmit={handleSubmit}>
          <Row>
            <Field>
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" autoComplete="given-name" required />
            </Field>

            <Field>
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" autoComplete="family-name" required />
            </Field>
          </Row>

          <Field>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </Field>

          <Field>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" />
          </Field>

          <Field>
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" rows={5} required />
          </Field>

          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Sending..." : "Send Message"}
          </Button>

          {status === "success" && (
            <Success>Thanks! We’ll be in touch shortly.</Success>
          )}
          {status === "error" && (
            <Error>Something went wrong. Please try again.</Error>
          )}
        </Form>
      </FormWrap>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
  background: #2f2f32;
  padding: 80px 22px;
  box-sizing: border-box;
`;

const FormWrap = styled.section`
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
  padding: 30px;
  box-sizing: border-box;
  background: #f3f4f6;
  border-radius: 30px;
`;

const FormTitle = styled.h2`
  font-size: 32px;
  margin: 0 0 12px;
  color: #2f2f32;
`;

const FormSubTitle = styled.p`
  font-size: 16px;
  margin: 0 0 24px;
  color: #83838c;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
  min-width: 0;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1 1 0;
  min-width: 0;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: rgba(47, 47, 50, 0.72);
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 14px 16px;
  border-radius: 30px;
  border: 1px solid #f3f4f6;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #2f2f32;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  padding: 14px 16px;
  border-radius: 30px;
  border: 1px solid #f3f4f6;
  font-size: 14px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #2f2f32;
  }
`;

const Button = styled.button`
  margin-top: 8px;
  padding: 14px 18px;
  border-radius: 30px;
  border: none;
  background: #e5e7eb;
  color: #2f2f32;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
  }
`;

const Success = styled.p`
  color: #16a34a;
  font-size: 14px;
`;

const Error = styled.p`
  color: #da5247;
  font-size: 14px;
`;
