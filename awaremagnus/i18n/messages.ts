import type { Locale } from "./config";

export type Messages = Record<string, unknown>;

export interface AppMessages {
  common: Messages;
  login: Messages;
  dashboard: Messages;
  awarenessAssets: Messages;
  quiz: Messages;
  module: Messages;
  content: Messages;
  campaigns: Messages;
  certificateBranding: Messages;
  surveyManagement: Messages;
}

export async function loadMessages(locale: Locale): Promise<AppMessages> {
  const [common, hintLogin, hintDashboard, awarenessAssets, quiz, module, content, campaigns, certificateBranding, surveyManagement] = await Promise.all([
    import(`@/messages/${locale}/common.json`).then((m) => m.default),
    import(`@/messages/${locale}/login.json`).then((m) => m.default),
    import(`@/messages/${locale}/dashboard.json`).then((m) => m.default),
    import(`@/messages/${locale}/awareness-assets.json`).then((m) => m.default),
    import(`@/messages/${locale}/quiz.json`).then((m) => m.default),
    import(`@/messages/${locale}/module.json`).then((m) => m.default),
    import(`@/messages/${locale}/content.json`).then((m) => m.default),
    import(`@/messages/${locale}/campaigns.json`).then((m) => m.default),
    import(`@/messages/${locale}/certificate-branding.json`).then((m) => m.default),
    import(`@/messages/${locale}/survey-management.json`).then((m) => m.default),
  ]);

  return {
    common,
    login: hintLogin,
    dashboard: hintDashboard,
    awarenessAssets,
    quiz,
    module,
    content,
    campaigns,
    certificateBranding,
    surveyManagement,
  };
}
