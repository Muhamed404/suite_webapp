import { getContentAssetUrl } from "@/utils/contentAssetUrl";

/**
 * Base URL of the Suite Webapp (where suite pages like /home, /package/list live).
 * Set NEXT_PUBLIC_SUITE_WEBAPP_URL in .env.local (e.g. http://localhost:8000).
 */
export const SUITE_WEBAPP_BASE_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SUITE_WEBAPP_URL) ||
  "http://localhost:8000";

function suiteUrl(path: string): string {
  const base = SUITE_WEBAPP_BASE_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;

  return `${base}${p}`;
}

export interface SuitePrimaryMenuItem {
  label: string;
  link?: string;
  imgPath: string;
  children?: { label: string; link: string }[];
}

/** Suite primary sidebar menu items (mirrors suite_management_menu_middleware). */
export const SUITE_PRIMARY_MENU_ITEMS: SuitePrimaryMenuItem[] = [
  {
    label: "Suite Management",
    link: "/home",
    imgPath: getContentAssetUrl("/images/icons/primary-suit.svg"),
  },
  {
    label: "Package",
    link: "/package/list",
    imgPath: getContentAssetUrl("/images/icons/primary_group.svg"),
  },
  {
    label: "Services",
    link: "/app_service/list",
    imgPath: getContentAssetUrl("/images/icons/Settings.svg"),
  },
  {
    label: "Organization",
    link: "/organization/",
    imgPath: getContentAssetUrl("/images/icons/primary-organization.svg"),
  },
  {
    label: "User",
    link: "/user/securemagnus-users",
    imgPath: getContentAssetUrl("/images/icons/primary-uses.svg"),
  },
  {
    label: "Categories",
    link: "/cybersecurity/categories/list",
    imgPath: getContentAssetUrl("/images/icons/cyber-security.svg"),
  },
  {
    label: "Settings",
    imgPath: getContentAssetUrl("/images/icons/Settings.svg"),
    children: [{ label: "Service Registry", link: "/service-registry/" }],
  },
];

export { suiteUrl };
