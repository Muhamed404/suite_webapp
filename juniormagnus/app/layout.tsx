import "@/styles/globals.css";
import "@/styles/fonts.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { Fredoka, Noto_Kufi_Arabic } from "next/font/google";

import { Providers } from "./providers";

import { I18nProvider } from "@/i18n/I18nProvider";
import { getLocaleDir } from "@/i18n/config";
import { getServerLocale } from "@/i18n/locale-cookie";
import { loadMessages } from "@/i18n/messages";
import { siteConfig } from "@/config/site";
import { brandColors } from "@/config/branding";
import { LayoutWrapper } from "@/components/layout-wrapper";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-kufi",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  other: {
    google: "notranslate",
    googlebot: "notranslate",
  },
};

export const viewport: Viewport = {
  themeColor: brandColors.primary,
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
          fredoka.variable,
          notoKufiArabic.variable
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
