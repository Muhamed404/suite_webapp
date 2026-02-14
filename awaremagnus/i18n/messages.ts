import type { Locale } from "./config";

export type Messages = Record<string, unknown>;

export interface AppMessages {
  common: Messages;
  login: Messages;
  dashboard: Messages;
  quiz: Messages;
  module: Messages;
  content: Messages;
  campaigns: Messages;
}

export async function loadMessages(locale: Locale): Promise<AppMessages> {
  const [common, hintLogin, hintDashboard, quiz, module, content, campaigns] = await Promise.all([
    import(`@/messages/${locale}/common.json`).then((m) => m.default),
    import(`@/messages/${locale}/login.json`).then((m) => m.default),
    import(`@/messages/${locale}/dashboard.json`).then((m) => m.default),
    import(`@/messages/${locale}/quiz.json`).then((m) => m.default),
    import(`@/messages/${locale}/module.json`).then((m) => m.default),
    import(`@/messages/${locale}/content.json`).then((m) => m.default),
    import(`@/messages/${locale}/campaigns.json`).then((m) => m.default),
  ]);

  return {
    common,
    login: hintLogin,
    dashboard: hintDashboard,
    quiz,
    module,
    content,
    campaigns,
  };
}
