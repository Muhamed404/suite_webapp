/** Junior Magnus public website brand tokens (from /juniormagnus/styles.css) */
export const brandColors = {
  primary: "#FF6B35",
  secondary: "#00D4AA",
  accentYellow: "#FFD23F",
  accentPink: "#FF69B4",
  accentCyan: "#00CED1",
  dark: "#2D3047",
  white: "#ffffff",
  lightGray: "#f8f9fa",
} as const;

const BRAND_BASE = "/jnr/branding";

export const brandAssets = {
  logoLight: `${BRAND_BASE}/logo-light.png`,
  logoDark: `${BRAND_BASE}/logo-dark.png`,
  companyLogo: `${BRAND_BASE}/company-logo.png`,
  saudiMade: `${BRAND_BASE}/saudi-made.png`,
  heroBackground: `${BRAND_BASE}/background.gif`,
} as const;
