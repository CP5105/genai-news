function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const SITE_URL = requireEnv("NEXT_PUBLIC_SITE_URL");

export const SITE_NAME = "GenAI News";
export const SITE_DESCRIPTION =
  "Open-source GenAI news aggregator with curated stories from the frontier of Generative AI.";
