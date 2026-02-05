import { cookies } from "next/headers";

import { defaultLocale, isLocale } from "./config";
import { LOCALE_COOKIE } from "./constants";

export async function getServerLocale() {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;

  return isLocale(value) ? value : defaultLocale;
}
