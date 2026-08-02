import { ORG_API } from "@/lib/apiConfig";
import { getStoredUser } from "@/lib/authStorage";

export type UiTheme = {
  primary?: string;
  radius?: string;
  gradientPrimaryStart?: string;
  gradientPrimaryMid?: string;
  gradientPrimaryEnd?: string;
  gradientPrimaryHoverStart?: string;
  gradientPrimaryHoverMid?: string;
  gradientPrimaryHoverEnd?: string;
  gradientHeaderStart?: string;
  gradientHeaderMid?: string;
  gradientHeaderMid2?: string;
  gradientHeaderEnd?: string;
  gradientHeaderAccent?: string;
  gradientBadgeStart?: string;
  gradientBadgeEnd?: string;
  loginPanelEnd?: string;
};

export const DEFAULT_THEME: UiTheme = {};

const THEME_STYLE_ID = "ui-theme-overrides";

function getOrganizationId() {
  return getStoredUser().organizationId || "default-org";
}

function cssVarName(key: keyof UiTheme): string {
  const map: Record<keyof UiTheme, string> = {
    primary: "--primary",
    radius: "--radius",
    gradientPrimaryStart: "--gradient-primary-start",
    gradientPrimaryMid: "--gradient-primary-mid",
    gradientPrimaryEnd: "--gradient-primary-end",
    gradientPrimaryHoverStart: "--gradient-primary-hover-start",
    gradientPrimaryHoverMid: "--gradient-primary-hover-mid",
    gradientPrimaryHoverEnd: "--gradient-primary-hover-end",
    gradientHeaderStart: "--gradient-header-start",
    gradientHeaderMid: "--gradient-header-mid",
    gradientHeaderMid2: "--gradient-header-mid2",
    gradientHeaderEnd: "--gradient-header-end",
    gradientHeaderAccent: "--gradient-header-accent",
    gradientBadgeStart: "--gradient-badge-start",
    gradientBadgeEnd: "--gradient-badge-end",
    loginPanelEnd: "--login-panel-end",
  };
  return map[key];
}

/** Apply a theme by injecting CSS variables on :root. Pass {} to clear. */
export function applyUiTheme(theme: UiTheme) {
  const entries = Object.entries(theme).filter(([, value]) => value);
  if (entries.length === 0) {
    document.getElementById(THEME_STYLE_ID)?.remove();
    return;
  }
  const vars = entries
    .map(([key, value]) => `${cssVarName(key as keyof UiTheme)}: ${value};`)
    .join("\n");
  let style = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = THEME_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = `:root {\n${vars}\n}`;
}

export async function fetchUiTheme(): Promise<UiTheme> {
  try {
    const orgId = getOrganizationId();
    const response = await fetch(`${ORG_API}/ui-settings`, {
      headers: { "X-Organization-Id": orgId },
    });
    if (!response.ok) return {};
    const data = await response.json();
    return (data?.theme || {}) as UiTheme;
  } catch {
    return {};
  }
}

export async function saveUiTheme(theme: UiTheme) {
  const orgId = getOrganizationId();
  const response = await fetch(`${ORG_API}/ui-settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Organization-Id": orgId,
    },
    body: JSON.stringify({ theme }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "Failed to save theme");
  }
  return response.json();
}

/** Load theme from DB and apply it. Call once at app startup. */
export async function initUiTheme() {
  const theme = await fetchUiTheme();
  applyUiTheme(theme);
  return theme;
}
