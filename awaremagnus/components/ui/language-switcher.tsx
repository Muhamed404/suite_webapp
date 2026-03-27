"use client";

import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Button } from "@heroui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import clsx from "clsx";

import { useI18n } from "@/i18n/I18nProvider";
import { setLocaleCookie } from "@/i18n/client-locale";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";

const CAMPAIGN_DRAFT_PRESERVE_ONCE_KEY = "awaremagnus:create-campaign:draft:preserve-once";

export function LanguageSwitcher() {
  const { locale, dir } = useI18n();
  const router = useRouter();
  const isRtl = dir === "rtl";

  const handleLanguageChange = (key: string) => {
    const newLocale = key as "en" | "ar";

    if (newLocale === locale) return;

    window.sessionStorage.setItem(CAMPAIGN_DRAFT_PRESERVE_ONCE_KEY, "1");
    setLocaleCookie(newLocale);
    window.location.reload();
  };

  const languages = [
    {
      key: "en",
      label: "English",
      flag: "/images/eng.png",
    },
    {
      key: "ar",
      label: "العربية",
      flag: "/images/ar.png",
    },
  ];

  const currentLanguage = languages.find((lang) => lang.key === locale) || languages[0];

  return (
    <Dropdown placement={isRtl ? "bottom-end" : "bottom-start"}>
      <DropdownTrigger>
        <Button
          className="h-9 min-w-0 px-3 flex items-center gap-2 border border-[var(--strokeGray)] bg-white hover:bg-[var(--gray)] transition-colors rounded-full"
          variant="light"
        >
          <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-100 flex-shrink-0 relative">
            <Image
              fill
              alt=""
              className="object-cover"
              src={getContentAssetUrl(currentLanguage.flag)}
            />
          </div>
          <span className="text-xs font-medium text-[var(--mainblue)] hidden sm:inline">
            {currentLanguage.label}
          </span>
          <svg
            className="w-3 h-3 text-gray-400 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Language Selection"
        className="w-36"
        selectedKeys={[locale]}
        selectionMode="single"
        onAction={(key) => handleLanguageChange(key as string)}
      >
        {languages.map((lang) => (
          <DropdownItem
            key={lang.key}
            startContent={
              <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-100 flex-shrink-0 relative">
                <Image fill alt="" className="object-cover" src={getContentAssetUrl(lang.flag)} />
              </div>
            }
          >
            <span
              className={clsx("text-xs", lang.key === locale && "font-bold text-[var(--mainblue)]")}
            >
              {lang.label}
            </span>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
