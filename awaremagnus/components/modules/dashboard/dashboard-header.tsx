"use client";

import Image from "next/image";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";

export const DashboardHeader = () => {
  const { dir } = useI18n();
  const t = useTranslations("dashboard");
  const isRtl = dir === "rtl";

  const searchIcon = (
    <Image
      src="/images/img/search.svg"
      alt=""
      width={20}
      height={20}
      className="size-5 text-gray-400"
    />
  );

  return (
    <header
      className={clsx(
        "bg-[#FAFBFC] px-6 py-3 flex items-center justify-between sticky top-0 z-30",
        isRtl && "flex-row-reverse"
      )}
    >
      <h1 className="text-2xl font-semibold text-[var(--mainblue)]">
        {t("header.welcome", { name: t("header.profileCompany") })}
      </h1>

      {/* Right Section for lg and up */}
      <div className="items-center hidden gap-5 lg:flex">
        {/* Search Bar */}
        <div className="relative">
          <Input
            type="text"
            placeholder={t("header.searchPlaceholder")}
            classNames={{
              base: "w-72",
              input: clsx("py-2 text-base", isRtl ? "pr-14 pl-10" : "pl-14 pr-10"),
              inputWrapper: "rounded-full bg-white border border-gray-300 h-11 min-h-11",
            }}
            startContent={isRtl ? undefined : searchIcon}
            endContent={isRtl ? searchIcon : undefined}
          />
        </div>

        {/* Two Circle Buttons */}
        <Button
          isIconOnly
          variant="light"
          className="w-11 h-11 min-w-11 min-h-11 rounded-full border border-gray-200 hover:bg-gray-200"
          aria-label={t("header.mail")}
        >
          <Image src="/images/img/mail.svg" alt="" width={22} height={22} className="size-5.5" />
        </Button>

        <Button
          isIconOnly
          variant="light"
          className="w-11 h-11 min-w-11 min-h-11 rounded-full border border-gray-200 hover:bg-gray-200"
          aria-label={t("header.notifications")}
        >
          <Image src="/images/img/bell.svg" alt="" width={22} height={22} className="size-5.5" />
        </Button>

        {/* User Profile */}
        <div className="flex gap-4 items-center">
          <Image
            src="/images/img/profile.png"
            alt=""
            width={44}
            height={44}
            className="w-11 h-11 rounded-full"
          />
          <div className="flex flex-col gap-1">
            <h4 className="flex gap-1.5 text-lg font-medium">
              {t("header.profileCompany")}
              <Image src="/images/img/arrow.svg" alt="" width={20} height={20} className="size-5" />
            </h4>
            <p className="text-base text-gray-500">{t("header.profileEmail")}</p>
          </div>
        </div>
      </div>

      {/* Hamburger Button for small screens */}
      <Button
        isIconOnly
        variant="light"
        className="block lg:hidden"
        aria-label="Menu"
      >
        <svg
          className="w-7 h-7 text-gray-800"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </Button>
    </header>
  );
};

