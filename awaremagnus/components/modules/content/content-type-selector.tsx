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
  iSpring: 4, // Interactive Content
  Quiz: 4, // Interactive Content
  PDF: 2, // Document/PDF
  Video: 1, // Video
  Brochure: 2, // Document/PDF
  "Screen Saver": 5, // Text/Article
  Poster: 2, // Document/PDF
  Game: 4, // Interactive Content
  Misc: 5, // Text/Article
};

interface ContentTypeCard {
  type: ContentType;
  icon: string;
  labelKey: string;
}

const CONTENT_TYPES: ContentTypeCard[] = [
  {
    type: "iSpring",
    icon: "/images/ispring.png",
    labelKey: "contentTypes.iSpring",
  },
  {
    type: "Quiz",
    icon: "/images/Icon_Bulb.svg",
    labelKey: "contentTypes.quiz",
  },
  { type: "PDF", icon: "/images/Icon_Pdf.svg", labelKey: "contentTypes.pdf" },
  {
    type: "Video",
    icon: "/images/Icon_video.svg",
    labelKey: "contentTypes.video",
  },
  {
    type: "Brochure",
    icon: "/images/Icon_Brouchure.svg",
    labelKey: "contentTypes.brochure",
  },
  {
    type: "Screen Saver",
    icon: "/images/Icon_Ss.svg",
    labelKey: "contentTypes.screenSaver",
  },
  {
    type: "Poster",
    icon: "/images/Icon_Poster.svg",
    labelKey: "contentTypes.poster",
  },
  {
    type: "Game",
    icon: "/images/Icon_Game.svg",
    labelKey: "contentTypes.game",
  },
  {
    type: "Misc",
    icon: "/images/Icon_Music.svg",
    labelKey: "contentTypes.misc",
  },
];

export interface ApiContentType {
  id: number;
  name: string;
}

/** Map API content type name (any case) to static icon path */
const API_NAME_TO_ICON: Record<string, string> = {
  video: "/images/Icon_video.svg",
  document: "/images/Icon_Pdf.svg",
  pdf: "/images/Icon_Pdf.svg",
  quiz: "/images/Icon_Bulb.svg",
  "manual quiz": "/images/Icon_Bulb.svg",
  brochure: "/images/Icon_Brouchure.svg",
  "screen saver": "/images/Icon_Ss.svg",
  screensaver: "/images/Icon_Ss.svg",
  poster: "/images/Icon_Poster.svg",
  game: "/images/Icon_Game.svg",
  ispring: "/images/ispring.png",
  misc: "/images/Icon_Music.svg",
  text: "/images/Icon_Music.svg",
  article: "/images/Icon_Music.svg",
  interactive: "/images/Icon_Bulb.svg",
};

const DEFAULT_CONTENT_ICON = "/images/Icon_Music.svg";

function getIconForApiContentType(name: string): string {
  const key = name.trim().toLowerCase();
  return API_NAME_TO_ICON[key] ?? DEFAULT_CONTENT_ICON;
}

interface ContentTypeSelectorPropsBase {
  className?: string;
}

interface ContentTypeSelectorPropsStatic extends ContentTypeSelectorPropsBase {
  apiContentTypes?: never;
  selectedContentTypeId?: never;
  onSelectContentTypeId?: never;
  selectedType: ContentType | null;
  onSelect: (type: ContentType) => void;
}

interface ContentTypeSelectorPropsApi extends ContentTypeSelectorPropsBase {
  apiContentTypes: ApiContentType[];
  selectedContentTypeId: number | null;
  onSelectContentTypeId: (id: number) => void;
  selectedType?: never;
  onSelect?: never;
}

export type ContentTypeSelectorProps =
  | ContentTypeSelectorPropsStatic
  | ContentTypeSelectorPropsApi;

export function ContentTypeSelector(props: ContentTypeSelectorProps) {
  const { className } = props;
  const t = useTranslations("content");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const isApiMode = "apiContentTypes" in props && props.apiContentTypes?.length;

  const cardBase =
    "shrink-0 w-24 h-24 flex flex-col items-center justify-center p-2 transition-colors duration-200 cursor-pointer border-2 box-border rounded-2xl";

  if (isApiMode && props.apiContentTypes) {
    const { selectedContentTypeId, onSelectContentTypeId } = props;
    return (
      <div className={clsx("mb-4", className)}>
        <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
          {t("selectContentType")}
        </label>
        <div className="overflow-x-auto overflow-y-visible pb-1">
          <div
            className={clsx(
              "flex gap-3 min-w-max items-stretch",
              isRtl && "flex-row-reverse",
            )}
          >
            {props.apiContentTypes.map((ct) => {
              const isSelected = selectedContentTypeId === ct.id;
              const icon = getIconForApiContentType(ct.name);
              return (
                <button
                  key={ct.id}
                  className={clsx(
                    cardBase,
                    isSelected
                      ? "border-[var(--blue)] bg-[var(--gray)]/50"
                      : "border-[var(--strokeGray)] bg-white hover:border-[var(--blue)]/50 hover:bg-[var(--gray)]/30",
                  )}
                  type="button"
                  onClick={() => onSelectContentTypeId(ct.id)}
                >
                  <Image
                    alt={ct.name}
                    className="w-6 h-6 mb-1.5 object-contain"
                    height={24}
                    src={icon}
                    width={24}
                  />
                  <p className="text-[10px] text-center leading-tight text-[var(--mainblue)]">
                    {ct.name}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const { selectedType, onSelect } = props as ContentTypeSelectorPropsStatic;
  return (
    <div className={clsx("mb-4", className)}>
      <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
        {t("selectContentType")}
      </label>
      <div className="overflow-x-auto overflow-y-visible pb-1">
        <div
          className={clsx(
            "flex gap-3 min-w-max items-stretch",
            isRtl && "flex-row-reverse",
          )}
        >
          {CONTENT_TYPES.map(({ type, icon, labelKey }) => {
            const isSelected = selectedType === type;

            return (
              <button
                key={type}
                className={clsx(
                  cardBase,
                  isSelected
                    ? "border-[var(--blue)] bg-[var(--gray)]/50"
                    : "border-[var(--strokeGray)] bg-white hover:border-[var(--blue)]/50 hover:bg-[var(--gray)]/30",
                )}
                type="button"
                onClick={() => onSelect(type)}
              >
                <Image
                  alt={t(labelKey)}
                  className="w-6 h-6 mb-1.5"
                  height={24}
                  src={icon}
                  width={24}
                />
                <p className="text-[10px] text-center text-[var(--mainblue)]">
                  {t(labelKey)}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
