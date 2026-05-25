"use client";

import Image from "next/image";
import { Button } from "@heroui/button";
import clsx from "clsx";
import { useMemo } from "react";

import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useAuthStore } from "@/hooks/useAuthStore";
import { decodeJwt, extractUserDisplayName, extractUserEmail } from "@/utils/jwt";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  const { dir } = useI18n();
  const t = useTranslations("dashboard");
  const isRtl = dir === "rtl";
  const { user, token } = useAuthStore();

  // Decode JWT to extract user details
  const jwtPayload = useMemo(() => decodeJwt(token), [token]);
  const userDisplayName = useMemo(() => extractUserDisplayName(jwtPayload), [jwtPayload]);
  const userEmail = useMemo(
    () => user?.email || extractUserEmail(jwtPayload),
    [user?.email, jwtPayload]
  );

  return (
    <header
      className={clsx(
        "flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-3.5",
        "bg-white border-b border-[var(--strokeGray)] sticky top-0 z-30",
        isRtl && "flex-row-reverse"
      )}
    >
      <h1 className="text-base font-semibold text-[var(--mainblue)] truncate min-w-0 flex-1">
        {t("header.welcome", { name: userDisplayName })}
      </h1>

      {/* Right Section for lg and up - compact row like PhishMagnus */}
      <div
        className={clsx("hidden lg:flex items-center gap-3 shrink-0", isRtl && "flex-row-reverse")}
      >
        {/* Temporarily hidden per request: search, message, and notification controls */}
        <LanguageSwitcher />
        <div
          className={clsx(
            "flex items-center gap-3 pl-2 border-l border-[var(--strokeGray)]",
            isRtl && "border-l-0 border-r pl-0 pr-2"
          )}
        >
          <Image
            alt=""
            className="w-9 h-9 rounded-full shrink-0"
            height={36}
            src={getContentAssetUrl("/images/img/profile.png")}
            width={36}
          />
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-medium text-[var(--mainblue)] truncate">
              {userDisplayName}
            </span>
            <p className="text-xs text-[var(--darkgray)] truncate">{userEmail}</p>
          </div>
        </div>
      </div>

      <div className={clsx("flex lg:hidden items-center gap-2", isRtl && "flex-row-reverse")}>
        <LanguageSwitcher />
        <Button
          isIconOnly
          aria-label="Menu"
          className="shrink-0 w-9 h-9 min-w-9 min-h-9"
          variant="light"
          onPress={onMenuClick}
        >
          <svg
            className="w-6 h-6 text-gray-800"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>
      </div>
    </header>
  );
};
