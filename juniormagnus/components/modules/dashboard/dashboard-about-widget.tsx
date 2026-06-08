"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@heroui/button";

import { useTranslations } from "@/i18n/useTranslations";
import { AWM_BASE_PATH } from "@/services/jnrStorage";

const CHILD_AVATARS = [
  `${AWM_BASE_PATH}/images/avatars/1.png`,
  `${AWM_BASE_PATH}/images/avatars/2.png`,
  `${AWM_BASE_PATH}/images/avatars/3.png`,
];

export function DashboardAboutWidget() {
  const t = useTranslations("dashboard");

  return (
    <div className="flex h-full min-h-[360px] w-full flex-1 flex-col rounded-xl border border-[var(--strokeGray)] bg-white p-5 shadow-sm">
      <h2 className="text-center text-sm font-bold leading-snug text-[var(--mainblue)]">
        {t("aboutWidget.title")}
      </h2>

      <p className="mt-4 text-center text-xs leading-relaxed text-[var(--primary-color)]">
        {t("aboutWidget.description")}
      </p>

      <div className="mt-5 flex items-end justify-center gap-1">
        {CHILD_AVATARS.map((src, index) => (
          <Image
            key={src}
            alt=""
            className="h-20 w-20 object-contain drop-shadow-sm"
            height={80}
            src={src}
            style={{ marginBottom: index === 1 ? 8 : 0 }}
            width={80}
          />
        ))}
      </div>

      <Button
        as={Link}
        className="mt-auto rounded-full bg-[var(--primary-color)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm"
        href="/dashboard/add-families"
        startContent={
          <span className="flex size-5 items-center justify-center rounded bg-[#4BABDC]">
            <ExternalLink aria-hidden className="size-3 text-white" strokeWidth={2.5} />
          </span>
        }
      >
        {t("aboutWidget.open")}
      </Button>
    </div>
  );
}
