"use client";

import Image from "next/image";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  const { dir } = useI18n();
  const t = useTranslations("dashboard");
  const isRtl = dir === "rtl";

  const searchIcon = (
    <Image
      alt=""
      className="size-4 text-gray-400"
      height={16}
      src="/images/img/search.svg"
      width={16}
    />
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
        {t("header.welcome", { name: t("header.profileCompany") })}
      </h1>

      {/* Right Section for lg and up - compact row like PhishMagnus */}
      <div
        className={clsx("hidden lg:flex items-center gap-3 shrink-0", isRtl && "flex-row-reverse")}
      >
        <div className="w-56 xl:w-64">
          <Input
            classNames={{
              input: clsx("py-2 text-sm", isRtl ? "pr-10 pl-9" : "pl-10 pr-9"),
              inputWrapper:
                "rounded-full bg-[var(--gray)] border border-[var(--strokeGray)] h-9 min-h-9",
            }}
            endContent={isRtl ? searchIcon : undefined}
            placeholder={t("header.searchPlaceholder")}
            startContent={isRtl ? undefined : searchIcon}
            type="text"
          />
        </div>
        <Button
          isIconOnly
          aria-label={t("header.mail")}
          className="w-9 h-9 min-w-9 min-h-9 rounded-full border border-[var(--strokeGray)] bg-white hover:bg-[var(--gray)]"
          variant="light"
        >
          <Image alt="" className="size-4" height={16} src="/images/img/mail.svg" width={16} />
        </Button>
        <Button
          isIconOnly
          aria-label={t("header.notifications")}
          className="w-9 h-9 min-w-9 min-h-9 rounded-full border border-[var(--strokeGray)] bg-white hover:bg-[var(--gray)]"
          variant="light"
        >
          <Image alt="" className="size-4" height={16} src="/images/img/bell.svg" width={16} />
        </Button>
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
            src="/images/img/profile.png"
            width={36}
          />
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-medium text-[var(--mainblue)] truncate">
              {t("header.profileCompany")}
            </span>
            <p className="text-xs text-[var(--darkgray)] truncate">{t("header.profileEmail")}</p>
          </div>
        </div>
      </div>

      <Button
        isIconOnly
        aria-label="Menu"
        className="shrink-0 lg:hidden w-9 h-9 min-w-9 min-h-9"
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
    </header>
  );
};
