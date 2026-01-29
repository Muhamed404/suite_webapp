import { cookies } from "next/headers";

import { defaultLocale, isLocale } from "./config";

import { LOCALE_COOKIE } from "./constants";

export function getServerLocale() {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}


