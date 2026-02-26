"use client";

import Image from "next/image";
import clsx from "clsx";
import { useRouter } from "next/navigation";

import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";

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
    icon: getContentAssetUrl("/images/ispring.png"),
    labelKey: "contentTypes.iSpring",
  },
  {
    type: "Quiz",
    icon: getContentAssetUrl("/images/Icon_Bulb.svg"),
    labelKey: "contentTypes.quiz",
  },
  { type: "PDF", icon: getContentAssetUrl("/images/Icon_Pdf.svg"), labelKey: "contentTypes.pdf" },
  {
    type: "Video",
    icon: getContentAssetUrl("/images/Icon_video.svg"),
    labelKey: "contentTypes.video",
  },
  {
    type: "Brochure",
    icon: getContentAssetUrl("/images/Icon_Brouchure.svg"),
    labelKey: "contentTypes.brochure",
  },
  {
    type: "Screen Saver",
    icon: getContentAssetUrl("/images/Icon_Ss.svg"),
    labelKey: "contentTypes.screenSaver",
  },
  {
    type: "Poster",
    icon: getContentAssetUrl("/images/Icon_Poster.svg"),
    labelKey: "contentTypes.poster",
  },
  {
    type: "Game",
    icon: getContentAssetUrl("/images/Icon_Game.svg"),
    labelKey: "contentTypes.game",
  },
  {
    type: "Misc",
    icon: getContentAssetUrl("/images/Icon_Music.svg"),
    labelKey: "contentTypes.misc",
  },
];

/** Map ContentType to translation key for heading/labels (use with t(key)) */
export const CONTENT_TYPE_LABEL_KEYS: Record<ContentType, string> = {
  iSpring: "contentTypes.iSpring",
  Quiz: "contentTypes.quiz",
  PDF: "contentTypes.pdf",
  Video: "contentTypes.video",
  Brochure: "contentTypes.brochure",
  "Screen Saver": "contentTypes.screenSaver",
  Poster: "contentTypes.poster",
  Game: "contentTypes.game",
  Misc: "contentTypes.misc",
};

export interface ApiContentType {
  id: number;
  name: string;
  allowsFileUpload?: boolean;
}

/** Map API content type name (AWM: Interactive Contents, Motion Videos, etc.) to icon path */
const API_NAME_TO_ICON: Record<string, string> = {
  "interactive contents": getContentAssetUrl("/images/img/interact.svg"),
  "motion videos": getContentAssetUrl("/images/Icon_video.svg"),
  brochures: getContentAssetUrl("/images/Icon_Brouchure.svg"),
  brochure: getContentAssetUrl("/images/Icon_Brouchure.svg"),
  posters: getContentAssetUrl("/images/Icon_Poster.svg"),
  poster: getContentAssetUrl("/images/Icon_Poster.svg"),
  "screen savers": getContentAssetUrl("/images/Icon_Ss.svg"),
  "screen saver": getContentAssetUrl("/images/Icon_Ss.svg"),
  games: getContentAssetUrl("/images/Icon_Game.svg"),
  game: getContentAssetUrl("/images/Icon_Game.svg"),
  documents: getContentAssetUrl("/images/Icon_Pdf.svg"),
  document: getContentAssetUrl("/images/Icon_Pdf.svg"),
  misc: getContentAssetUrl("/images/Icon_Music.svg"),
  "vr games": getContentAssetUrl("/images/Icon_Game.svg"),
  video: getContentAssetUrl("/images/Icon_video.svg"),
  pdf: getContentAssetUrl("/images/Icon_Pdf.svg"),
  quiz: getContentAssetUrl("/images/Icon_Bulb.svg"),
  "manual quiz": getContentAssetUrl("/images/Icon_Bulb.svg"),
  ispring: getContentAssetUrl("/images/img/interact.svg"),
  "interactive lesson": getContentAssetUrl("/images/img/interact.svg"),
  "interactive content": getContentAssetUrl("/images/img/interact.svg"),
  text: getContentAssetUrl("/images/Icon_Music.svg"),
  article: getContentAssetUrl("/images/Icon_Music.svg"),
};

const DEFAULT_CONTENT_ICON = getContentAssetUrl("/images/Icon_Music.svg");

function getIconForApiContentType(name: string): string {
  const key = name.trim().toLowerCase();

  return API_NAME_TO_ICON[key] ?? DEFAULT_CONTENT_ICON;
}

interface ContentTypeSelectorPropsBase {
  className?: string;
  /** Hide the "Select content type" label (e.g. when used as horizontal strip) */
  hideLabel?: boolean;
  /** Extra class for each content card (e.g. rounded-lg to match reference) */
  cardClassName?: string;
  /** Extra class for the cards container (e.g. gap-2 min-w-max h-[99px]) */
  containerClassName?: string;
  /** Optional href for dedicated Quiz creation screen. Shown as a card at the start. */
  quizLink?: string;
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

export type ContentTypeSelectorProps = ContentTypeSelectorPropsStatic | ContentTypeSelectorPropsApi;

export function ContentTypeSelector(props: ContentTypeSelectorProps) {
  const { className, hideLabel, cardClassName, containerClassName, quizLink } = props;
  const router = useRouter();
  const t = useTranslations("content");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const isApiMode = "apiContentTypes" in props && props.apiContentTypes?.length;

  const cardBase = clsx(
    "shrink-0 w-24 h-24 flex flex-col items-center justify-center p-2 transition-all duration-200 cursor-pointer border box-border bg-white",
    cardClassName ?? "rounded-2xl border-2"
  );

  const containerBase = clsx(
    "flex min-w-max items-center overflow-x-auto overflow-y-visible",
    isRtl && "flex-row-reverse",
    containerClassName ?? "gap-3 items-stretch pb-1"
  );

  if (isApiMode && props.apiContentTypes) {
    const { selectedContentTypeId, onSelectContentTypeId } = props;

    return (
      <div className={clsx(!hideLabel && "mb-4", className)}>
        {!hideLabel && (
          <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
            {t("selectContentType")}
          </label>
        )}
        <div className={hideLabel ? "overflow-x-auto" : "overflow-x-auto overflow-y-visible pb-1"}>
          <div className={containerBase}>
            {quizLink && (
              <button
                className={clsx(
                  cardBase,
                  "border-transparent hover:border-[var(--blue)]/50 hover:bg-[var(--gray)]/20"
                )}
                type="button"
                onClick={() => router.push(quizLink)}
              >
                <Image
                  alt={t("contentTypes.quiz")}
                  className="w-6 h-6 mb-1.5 object-contain"
                  height={24}
                  src={getContentAssetUrl("/images/Icon_Bulb.svg")}
                  width={24}
                />
                <p className="text-[10px] text-center leading-tight text-gray-700">
                  {t("contentTypes.quiz")}
                </p>
              </button>
            )}
            {props.apiContentTypes
              .filter((ct) => !quizLink || !ct.name.toLowerCase().includes("quiz"))
              .map((ct) => {
                const isSelected = selectedContentTypeId === ct.id;
                const icon = getIconForApiContentType(ct.name);

                return (
                  <button
                    key={ct.id}
                    className={clsx(
                      cardBase,
                      isSelected
                        ? "border-[#3FBDFF] bg-[var(--gray)]/30"
                        : "border-transparent hover:border-[var(--blue)]/50 hover:bg-[var(--gray)]/20"
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
                    <p className="text-[10px] text-center leading-tight text-gray-700">{ct.name}</p>
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
    <div className={clsx(!hideLabel && "mb-4", className)}>
      {!hideLabel && (
        <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
          {t("selectContentType")}
        </label>
      )}
      <div className={hideLabel ? "overflow-x-auto" : "overflow-x-auto overflow-y-visible pb-1"}>
        <div className={containerBase}>
          {quizLink && (
            <button
              className={clsx(
                cardBase,
                "border-transparent hover:border-[var(--blue)]/50 hover:bg-[var(--gray)]/20"
              )}
              type="button"
              onClick={() => router.push(quizLink)}
            >
              <Image
                alt={t("contentTypes.quiz")}
                className="w-6 h-6 mb-1.5 object-contain"
                height={24}
                src={getContentAssetUrl("/images/Icon_Bulb.svg")}
                width={24}
              />
              <p className="text-[10px] text-center leading-tight text-gray-700">
                {t("contentTypes.quiz")}
              </p>
            </button>
          )}
          {CONTENT_TYPES.filter((ct) => !quizLink || ct.type !== "Quiz").map(
            ({ type, icon, labelKey }) => {
              const isSelected = selectedType === type;

              return (
                <button
                  key={type}
                  className={clsx(
                    cardBase,
                    isSelected
                      ? "border-[#3FBDFF] bg-[var(--gray)]/30"
                      : "border-transparent hover:border-[var(--blue)]/50 hover:bg-[var(--gray)]/20"
                  )}
                  type="button"
                  onClick={() => onSelect(type)}
                >
                  <Image
                    alt={t(labelKey)}
                    className="w-6 h-6 mb-1.5 object-contain"
                    height={24}
                    src={icon}
                    width={24}
                  />
                  <p className="text-[10px] text-center leading-tight text-gray-700">
                    {t(labelKey)}
                  </p>
                </button>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
