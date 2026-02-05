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
      className="size-5 text-gray-400"
      height={20}
      src="/images/img/search.svg"
      width={20}
    />
  );

  return (
    <header
      className={clsx(
        "bg-[#FAFBFC] px-3 sm:px-6 py-3 flex items-center justify-between gap-2 sticky top-0 z-30",
        isRtl && "flex-row-reverse",
      )}
    >
      <h1 className="text-lg sm:text-2xl font-semibold text-[var(--mainblue)] truncate min-w-0">
        {t("header.welcome", { name: t("header.profileCompany") })}
      </h1>

      {/* Right Section for lg and up */}
      <div className="items-center hidden gap-5 lg:flex">
        {/* Search Bar */}
        <div className="relative">
          <Input
            classNames={{
              base: "w-72",
              input: clsx(
                "py-2 text-base",
                isRtl ? "pr-14 pl-10" : "pl-14 pr-10",
              ),
              inputWrapper:
                "rounded-full bg-white border border-gray-300 h-11 min-h-11",
            }}
            endContent={isRtl ? searchIcon : undefined}
            placeholder={t("header.searchPlaceholder")}
            startContent={isRtl ? undefined : searchIcon}
            type="text"
          />
        </div>

        {/* Two Circle Buttons */}
        <Button
          isIconOnly
          aria-label={t("header.mail")}
          className="w-11 h-11 min-w-11 min-h-11 rounded-full border border-gray-200 hover:bg-gray-200"
          variant="light"
        >
          <Image
            alt=""
            className="size-5.5"
            height={22}
            src="/images/img/mail.svg"
            width={22}
          />
        </Button>

        <Button
          isIconOnly
          aria-label={t("header.notifications")}
          className="w-11 h-11 min-w-11 min-h-11 rounded-full border border-gray-200 hover:bg-gray-200"
          variant="light"
        >
          <Image
            alt=""
            className="size-5.5"
            height={22}
            src="/images/img/bell.svg"
            width={22}
          />
        </Button>

        {/* User Profile */}
        <div className="flex gap-4 items-center">
          <Image
            alt=""
            className="w-11 h-11 rounded-full"
            height={44}
            src="/images/img/profile.png"
            width={44}
          />
          <div className="flex flex-col gap-1">
            <h4 className="flex gap-1.5 text-lg font-medium">
              {t("header.profileCompany")}
              <Image
                alt=""
                className="size-5"
                height={20}
                src="/images/img/arrow.svg"
                width={20}
              />
            </h4>
            <p className="text-base text-gray-500">
              {t("header.profileEmail")}
            </p>
          </div>
        </div>
      </div>

      {/* Hamburger Button for small screens */}
      <Button
        isIconOnly
        aria-label="Menu"
        className="shrink-0 lg:hidden"
        variant="light"
        onPress={onMenuClick}
      >
        <svg
          className="w-7 h-7 text-gray-800"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            d="M4 6h16M4 12h16M4 18h16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Button>
    </header>
  );
};
