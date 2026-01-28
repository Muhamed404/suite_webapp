"use client";

import type { Locale } from "./config";
import { LOCALE_COOKIE } from "./constants";

export function setLocaleCookie(locale: Locale) {
  // 400 days, path=/ for whole app
  const maxAge = 60 * 60 * 24 * 400;
  document.cookie = `${LOCALE_COOKIE}=${locale}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}


