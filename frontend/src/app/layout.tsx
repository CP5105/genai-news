import type { Metadata } from "next";
import Link from "next/link";
import { JetBrains_Mono, Outfit, Playfair_Display } from "next/font/google";
import { CONTACT_EMAIL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "dvCBQCAcAT8gwL9-XZUEuU14TPog-NJEplTHqYQsGbs",
  },
};

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "600", "700"],
  variable: "--font-display-google",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-google",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body-google",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const edition = new Date()
    .toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();

  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${jetBrainsMono.variable} ${outfit.variable}`}
    >
      <body className="antialiased">
        <header
          style={{ background: "var(--background)", paddingTop: "1.5rem" }}
        >
          <div
            className="mx-auto w-[min(1100px,94vw)]"
            style={{ paddingBottom: "1px" }}
          >
            {/* Thick crimson rule */}
            <div className="masthead-rule" />

            {/* Top meta row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                padding: "0.55rem 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.66rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase" as const,
                  color: "var(--muted)",
                }}
              >
                {edition}
              </span>
            </div>

            {/* Publication name */}
            <div
              style={{
                textAlign: "center" as const,
                padding: "1.1rem 0 1rem",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Link
                href="/"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2rem, 5vw, 3.25rem)",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  color: "var(--heading)",
                  textDecoration: "none",
                  display: "block",
                  lineHeight: 1,
                }}
              >
                GenAI News
              </Link>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.66rem",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase" as const,
                  color: "var(--muted)",
                  marginTop: "0.45rem",
                }}
              >
                The Intelligence Wire
              </p>
            </div>
          </div>
        </header>
        {children}
        <footer className="mx-auto w-[min(1100px,94vw)] border-t border-[var(--border)] py-8">
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            Contact:
            {" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              style={{ color: "var(--heading)", textDecoration: "underline" }}
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
