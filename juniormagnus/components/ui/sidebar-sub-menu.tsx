"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Tooltip } from "@heroui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";

import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";
import { brandAssets } from "@/config/branding";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";
import { useOrgLogo } from "@/hooks/useOrgBranding";

const HOVER_OPEN_DELAY_MS = 120;
const HOVER_CLOSE_DELAY_MS = 180;

function cn(...classes: (string | boolean | undefined)[]): string {
  return clsx(...classes.filter(Boolean));
}

export interface SubMenuItem {
  href: string;
  icon: LucideIcon;
  label: string;
  children?: SubMenuItem[];
}

function NavIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon aria-hidden className="size-5 shrink-0 min-w-5 min-h-5" strokeWidth={1.75} />;
}

interface SubMenuProps {
  items: SubMenuItem[];
  isCollapsed?: boolean;
  onLogout?: () => void;
}

function isPathUnder(basePath: string, pathname: string): boolean {
  return pathname === basePath || pathname.startsWith(basePath + "/");
}

/** Chevron down icon for expand/collapse */
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      className={cn("size-5 shrink-0 transition-transform duration-200", open && "rotate-180")}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const SubMenu = ({ items, isCollapsed = false, onLogout }: SubMenuProps) => {
  const pathname = usePathname();
  const { dir } = useI18n();
  const t = useTranslations("common");
  const isRtl = dir === "rtl";

  // Fetch org logo for white-label branding
  const { data: orgBrandingData } = useOrgLogo();
  const orgLogoUrl = orgBrandingData?.logo_url
    ? getContentAssetUrl(orgBrandingData.logo_url)
    : null;

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};

    items.forEach((item) => {
      if (item.children?.length) {
        const key = item.label.toLowerCase().replace(/\s+/g, "");

        initial[key] = item.children!.some((c) => isPathUnder(c.href, pathname ?? ""));
      }
    });

    return initial;
  });

  const [hoverPopoverId, setHoverPopoverId] = useState<string | null>(null);
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const clearOpenTimeout = useCallback(() => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
  }, []);

  const toggleMenu = (menuId: string) => {
    setOpenMenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const tooltipPlacement = isRtl ? "left" : "right";
  const popoverPlacement = isRtl ? "left" : "right";

  /* Match HTML + primary: px-2.5 py-2.5, gap-3, size-4 icons. When collapsed use minimal px so icon fits in w-9 */
  const navItemBase =
    "w-full flex items-center gap-3 cursor-pointer transition-colors duration-150 rounded whitespace-nowrap text-xs font-normal min-w-0";
  const navItemPadding = isCollapsed ? "px-1.5 py-2.5 justify-center" : "px-2.5 py-2.5";
  const navItemDefault = "text-[var(--mainblue)] hover:bg-white/10";
  const navItemActive = "bg-[#00999310] text-[var(--mainblue)]";
  const childItemBase =
    "flex items-center gap-3 cursor-pointer transition-colors duration-150 rounded text-xs py-2.5 pr-3 pl-4 border-l-2";
  const childItemDefault =
    "text-gray-600 hover:bg-white/10 hover:text-[var(--mainblue)] border-transparent";
  const childItemActive =
    "bg-[#00999310]/80 text-[var(--mainblue)] font-medium border-[var(--mainblue)]/30";

  return (
    <div
      className={cn(
        "bg-[var(--bg)] text-[var(--mainblue)] transition-all duration-300",
        "h-full min-h-0 lg:h-[98vh] rounded-l-3xl",
        isRtl && "rounded-l-none rounded-r-3xl",
        "flex flex-col",
        isCollapsed ? "w-9 min-w-9" : "w-52 overflow-hidden"
      )}
    >
      {/* Logo area – use org custom logo if available, otherwise default Junior Magnus branding */}
      <div className={cn("flex gap-2 items-center py-4 px-2", isCollapsed ? "justify-center" : "")}>
        {orgLogoUrl ? (
          /* White-label: org custom logo */
          isCollapsed ? (
            <Tooltip closeDelay={0} content="Organization" delay={300} placement={tooltipPlacement}>
              <span className="flex justify-center">
                <Image
                  alt="Organization Logo"
                  className="size-5 shrink-0 object-contain"
                  height={20}
                  src={orgLogoUrl}
                  width={20}
                  unoptimized
                />
              </span>
            </Tooltip>
          ) : (
            <Image
              alt="Organization Logo"
              className="h-5 w-auto max-w-[140px] shrink-0 object-contain"
              height={20}
              src={orgLogoUrl}
              width={140}
              unoptimized
            />
          )
        ) : (
          /* Default: single Junior Magnus logo */
          isCollapsed ? (
            <Tooltip closeDelay={0} content="Junior Magnus" delay={300} placement={tooltipPlacement}>
              <span className="flex justify-center w-full">
                <Image
                  alt="Junior Magnus"
                  className="h-8 w-auto max-w-full shrink-0 object-contain"
                  height={32}
                  src={brandAssets.logoLight}
                  width={32}
                />
              </span>
            </Tooltip>
          ) : (
            <Image
              alt="Junior Magnus"
              className="h-12 w-auto max-w-[180px] shrink-0 object-contain"
              height={48}
              src={brandAssets.logoLight}
              width={160}
            />
          )
        )}
      </div>
      <nav
        aria-label="Dashboard navigation"
        className="py-3 overflow-y-auto overflow-x-visible flex-1"
      >
        <ul className={cn("space-y-0.5 text-xs", isCollapsed ? "px-1" : "px-2")}>
          {items.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const menuId = item.label.toLowerCase().replace(/\s+/g, "");
            const isOpen = openMenus[menuId];
            const isParentActive =
              hasChildren && item.children!.some((c) => isPathUnder(c.href, pathname ?? ""));

            if (hasChildren) {
              const parentButton = (
                <button
                  aria-controls={isCollapsed ? undefined : `submenu-${menuId}`}
                  aria-expanded={isOpen}
                  className={cn(
                    navItemBase,
                    navItemPadding,
                    isParentActive ? navItemActive : navItemDefault,
                    isOpen && "bg-[var(--gray)]/40"
                  )}
                  type="button"
                  onClick={() => !isCollapsed && toggleMenu(menuId)}
                >
                  <NavIcon icon={item.icon} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronIcon open={isOpen} />
                    </>
                  )}
                </button>
              );

              return (
                <li key={item.href + menuId} className="space-y-0.5">
                  {isCollapsed ? (
                    <Popover
                      isOpen={hoverPopoverId === menuId}
                      motionProps={{
                        initial: { opacity: 0, scale: 0.95 },
                        animate: { opacity: 1, scale: 1 },
                        exit: { opacity: 0, scale: 0.95 },
                        transition: { type: "ease", duration: 0.15 },
                      }}
                      offset={4}
                      placement={popoverPlacement}
                      showArrow={false}
                      onOpenChange={(open) => {
                        if (!open) setHoverPopoverId(null);
                      }}
                    >
                      <PopoverTrigger>
                        <div
                          className="flex w-full justify-center"
                          onMouseEnter={() => {
                            clearCloseTimeout();
                            clearOpenTimeout();
                            openTimeoutRef.current = setTimeout(
                              () => setHoverPopoverId(menuId),
                              HOVER_OPEN_DELAY_MS
                            );
                          }}
                          onMouseLeave={() => {
                            clearOpenTimeout();
                            closeTimeoutRef.current = setTimeout(
                              () => setHoverPopoverId(null),
                              HOVER_CLOSE_DELAY_MS
                            );
                          }}
                        >
                          {parentButton}
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="p-2 min-w-[180px] border border-[var(--strokeGray)] shadow-lg bg-[var(--bg)]">
                        <div
                          onMouseEnter={clearCloseTimeout}
                          onMouseLeave={() => {
                            closeTimeoutRef.current = setTimeout(
                              () => setHoverPopoverId(null),
                              HOVER_CLOSE_DELAY_MS
                            );
                          }}
                        >
                          <p className="text-sm font-semibold text-[var(--mainblue)] px-2 py-1.5 border-b border-[var(--strokeGray)] mb-1">
                            {item.label}
                          </p>
                          <ul className="space-y-0.5">
                            {item.children!.map((child) => {
                              const isChildActive =
                                pathname === child.href ||
                                (isPathUnder(child.href, pathname ?? "") &&
                                  !item.children!.some(
                                    (sibling) =>
                                      sibling.href !== child.href &&
                                      sibling.href.length > child.href.length &&
                                      isPathUnder(sibling.href, pathname ?? "")
                                  ));

                              return (
                                <li key={child.href}>
                                  <Link
                                    className={cn(
                                      "flex items-center gap-2 rounded-lg text-sm py-2.5 px-3 transition-colors w-full",
                                      isChildActive ? childItemActive : childItemDefault
                                    )}
                                    href={child.href}
                                  >
                                    {child.label}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    parentButton
                  )}
                  {!isCollapsed && isOpen && (
                    <ul
                      className={cn("space-y-0.5 pt-0.5", isRtl ? "mr-2 ml-0" : "ml-2")}
                      id={`submenu-${menuId}`}
                    >
                      {item.children!.map((child) => {
                        const isChildActive =
                          pathname === child.href ||
                          (isPathUnder(child.href, pathname ?? "") &&
                            !item.children!.some(
                              (sibling) =>
                                sibling.href !== child.href &&
                                sibling.href.length > child.href.length &&
                                isPathUnder(sibling.href, pathname ?? "")
                            ));

                        return (
                          <li key={child.href}>
                            <Link
                              className={cn(
                                childItemBase,
                                isChildActive ? childItemActive : childItemDefault
                              )}
                              href={child.href}
                            >
                              {child.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            const isActive = pathname === item.href;
            const simpleLink = (
              <Link
                className={cn(
                  navItemBase,
                  navItemPadding,
                  isActive ? navItemActive : navItemDefault
                )}
                href={item.href}
              >
                <NavIcon icon={item.icon} />
                {!isCollapsed && <span className="text-xs font-normal">{item.label}</span>}
              </Link>
            );

            return (
              <li key={item.href}>
                {isCollapsed ? (
                  <Tooltip
                    closeDelay={0}
                    content={item.label}
                    delay={300}
                    placement={tooltipPlacement}
                  >
                    {simpleLink}
                  </Tooltip>
                ) : (
                  simpleLink
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button at Bottom */}
      {onLogout && (
        <div
          className={cn("border-t border-[var(--strokeGray)] py-3", isCollapsed ? "px-1" : "px-2")}
        >
          <button
            className={cn(navItemBase, navItemPadding, navItemDefault, "hover:bg-red-500/20")}
            title={t("suitePrimaryMenu.logout", { defaultValue: "Logout" })}
            type="button"
            onClick={onLogout}
          >
            <LogOut aria-hidden className="size-5 shrink-0 min-w-5 min-h-5" strokeWidth={1.75} />
            {!isCollapsed && (
              <span className="text-xs font-normal">
                {t("suitePrimaryMenu.logout", { defaultValue: "Logout" })}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
