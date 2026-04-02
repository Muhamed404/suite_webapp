"use client";

import clsx from "clsx";

import { Logo } from "@/components/ui/logo";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { LoginForm } from "@/components/modules/auth/login-form";
import { LoginHero } from "@/components/modules/auth/login-hero";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";

export default function LoginPage() {
  const t = useTranslations("login");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  return (
    <div className="grid grid-cols-12 min-h-screen bg-white">
      {/* Login Section (Always Visible) */}
      <div className="flex flex-col justify-between col-span-12 sm:col-span-6 h-screen lg:p-10 p-4">
        {/* Header */}
        <div
          className={clsx(
            "flex items-center justify-between w-full max-w-xl mx-auto",
            isRtl && "flex-row-reverse"
          )}
        >
          <Logo />
          <LanguageToggle />
        </div>

        {/* Login Form */}
        <div className="flex items-center justify-center flex-1 w-full">
          <div className="w-full max-w-md mx-auto px-4">
            <LoginForm />
          </div>
        </div>

        {/* Footer */}
        <div className="w-full max-w-xl mx-auto">
          <p className="text-xs text-gray-600 mt-4">{t("page.copyright")}</p>
        </div>
      </div>

      {/* Hero Section (Hidden on Small Screens) */}
      <div className="hidden sm:block col-span-6 lg:p-5 p-4">
        <LoginHero />
      </div>
    </div>
  );
}
