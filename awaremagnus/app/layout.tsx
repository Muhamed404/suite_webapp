import "@/styles/globals.css";
import "@/styles/fonts.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";

import { I18nProvider } from "@/i18n/I18nProvider";
import { getLocaleDir } from "@/i18n/config";
import { getServerLocale } from "@/i18n/locale-cookie";
import { loadMessages } from "@/i18n/messages";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: getContentAssetUrl("/images/img/aware-icon.svg"),
  },
  other: {
    "google": "notranslate",
    "googlebot": "notranslate",
  },
};

export const viewport: Viewport = {
  themeColor: "white",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  const dir = getLocaleDir(locale);
  const messages = await loadMessages(locale);

  return (
    <html suppressHydrationWarning className="light notranslate" dir={dir} lang={locale} translate="no">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <I18nProvider locale={locale} messages={messages}>
          <Providers
            themeProps={{ attribute: "class", defaultTheme: "light", forcedTheme: "light" }}
          >
            <LayoutWrapper>{children}</LayoutWrapper>
          </Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
