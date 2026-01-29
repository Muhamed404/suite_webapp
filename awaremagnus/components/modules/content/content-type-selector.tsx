"use client";

import Image from "next/image";
import clsx from "clsx";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";

export type ContentType =
  | "iSpring"
  | "Quiz"
  | "PDF"
  | "Video"
  | "Brochure"
  | "Screen Saver"
  | "Poster"
  | "Game"
  | "Misc";

export const CONTENT_TYPE_TO_ID: Record<ContentType, number> = {
  "iSpring": 4, // Interactive Content
  "Quiz": 4, // Interactive Content
  "PDF": 2, // Document/PDF
  "Video": 1, // Video
  "Brochure": 2, // Document/PDF
  "Screen Saver": 5, // Text/Article
  "Poster": 2, // Document/PDF
  "Game": 4, // Interactive Content
  "Misc": 5, // Text/Article
};

interface ContentTypeCard {
  type: ContentType;
  icon: string;
  labelKey: string;
}

const CONTENT_TYPES: ContentTypeCard[] = [
  { type: "iSpring", icon: "/images/ispring.png", labelKey: "contentTypes.iSpring" },
  { type: "Quiz", icon: "/images/Icon_Bulb.svg", labelKey: "contentTypes.quiz" },
  { type: "PDF", icon: "/images/Icon_Pdf.svg", labelKey: "contentTypes.pdf" },
  { type: "Video", icon: "/images/Icon_video.svg", labelKey: "contentTypes.video" },
  { type: "Brochure", icon: "/images/Icon_Brouchure.svg", labelKey: "contentTypes.brochure" },
  { type: "Screen Saver", icon: "/images/Icon_Ss.svg", labelKey: "contentTypes.screenSaver" },
  { type: "Poster", icon: "/images/Icon_Poster.svg", labelKey: "contentTypes.poster" },
  { type: "Game", icon: "/images/Icon_Game.svg", labelKey: "contentTypes.game" },
  { type: "Misc", icon: "/images/Icon_Music.svg", labelKey: "contentTypes.misc" },
];

interface ContentTypeSelectorProps {
  selectedType: ContentType | null;
  onSelect: (type: ContentType) => void;
  className?: string;
}

export function ContentTypeSelector({
  selectedType,
  onSelect,
  className,
}: ContentTypeSelectorProps) {
  const t = useTranslations("content");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  return (
    <div className={clsx("mb-4", className)}>
      <div className="overflow-x-auto">
        <div
          className={clsx(
            "flex gap-2 min-w-max h-[99px] items-center px-1",
            isRtl && "flex-row-reverse"
          )}
        >
          {CONTENT_TYPES.map(({ type, icon, labelKey }) => {
            const isSelected = selectedType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onSelect(type)}
                className={clsx(
                  "content-card cursor-pointer border rounded-lg w-24 h-24 flex flex-col items-center justify-center p-2 transition transform bg-white",
                  isSelected
                    ? "border-[#3FBDFF] bg-[#EAF8FF] shadow-md scale-105"
                    : "border-transparent hover:border-gray-300 hover:shadow-sm"
                )}
              >
                <Image
                  src={icon}
                  alt={t(labelKey)}
                  width={24}
                  height={24}
                  className="w-6 h-6 mb-1.5"
                />
                <p className="text-[10px] text-center">{t(labelKey)}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
