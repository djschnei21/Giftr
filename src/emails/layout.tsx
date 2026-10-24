import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type * as React from "react";

const colors = {
  bg: "#f7f4ee",
  card: "#ffffff",
  ink: "#26221d",
  muted: "#756d63",
  primary: "#1f5c45",
  border: "#ebe5da",
};

export function EmailLayout({
  preview,
  heading,
  children,
  cta,
  footer,
}: {
  preview: string;
  heading: string;
  children: React.ReactNode;
  cta?: { label: string; href: string };
  footer?: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: colors.bg,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          margin: 0,
          padding: "32px 12px",
        }}
      >
        <Container style={{ maxWidth: 520, margin: "0 auto" }}>
          <Text style={{ fontSize: 18, fontWeight: 700, color: colors.primary, margin: "0 0 16px 4px", letterSpacing: -0.3 }}>
            Giftr
          </Text>
          <Section
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              border: `1px solid ${colors.border}`,
              padding: "32px 28px",
            }}
          >
            <Heading as="h1" style={{ fontSize: 24, lineHeight: "30px", color: colors.ink, margin: "0 0 16px", fontWeight: 650 }}>
              {heading}
            </Heading>
            <div style={{ color: colors.ink, fontSize: 15, lineHeight: "24px" }}>{children}</div>
            {cta ? (
              <Section style={{ marginTop: 24 }}>
                <Button
                  href={cta.href}
                  style={{
                    backgroundColor: colors.primary,
                    color: "#ffffff",
                    borderRadius: 999,
                    padding: "12px 22px",
                    fontSize: 15,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  {cta.label}
                </Button>
              </Section>
            ) : null}
          </Section>
          <Hr style={{ borderColor: "transparent", margin: "8px 0" }} />
          <Text style={{ color: colors.muted, fontSize: 12, lineHeight: "18px", margin: "0 4px" }}>
            {footer ?? "You're receiving this because someone invited you to a gift exchange on Giftr."}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <Text style={{ margin: "0 0 12px", fontSize: 15, lineHeight: "24px", color: colors.ink }}>{children}</Text>;
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={{ margin: "12px 0 0", fontSize: 13, lineHeight: "20px", color: colors.muted }}>{children}</Text>;
}

export function Unsubscribe({ href }: { href: string }) {
  return (
    <>
      Don&apos;t want these emails?{" "}
      <Link href={href} style={{ color: colors.muted, textDecoration: "underline" }}>
        Turn off notifications
      </Link>
      .
    </>
  );
}
