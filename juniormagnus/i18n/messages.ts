import type { Locale } from "./config";

export type Messages = Record<string, unknown>;

export interface AppMessages {
  common: Messages;
  login: Messages;
  dashboard: Messages;
}

export async function loadMessages(locale: Locale): Promise<AppMessages> {
  const [common, hintLogin, hintDashboard] = await Promise.all([
    import(`@/messages/${locale}/common.json`).then((m) => m.default),
    import(`@/messages/${locale}/login.json`).then((m) => m.default),
    import(`@/messages/${locale}/dashboard.json`).then((m) => m.default),
  ]);

  return {
    common,
    login: hintLogin,
    dashboard: hintDashboard,
  };
}
