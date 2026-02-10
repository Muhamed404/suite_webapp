"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";

import {
  SUITE_PRIMARY_MENU_ITEMS,
  suiteUrl,
  type SuitePrimaryMenuItem,
} from "@/config/suite-links";
import { useI18n } from "@/i18n/I18nProvider";

interface SidebarPrimaryMenuProps {
  /** When true, sidebar is collapsed (icon-only, w-16). */
  isCollapsed: boolean;
  /** Toggle collapse (flip icon). */
  onToggle: () => void;
}

export function SidebarPrimaryMenu({ isCollapsed, onToggle }: SidebarPrimaryMenuProps) {
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const toggleSubmenu = (id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      className={clsx(
        "relative flex flex-col h-screen bg-black text-white transition-all duration-300 shrink-0",
        isCollapsed ? "w-20 collapsed" : "w-48"
      )}
      id="sidebar"
    >
      {/* Logo - HTML: images/menu-logo.svg + images/menu-logo-name.svg */}
      <a
        className={clsx(
          "sidebar-logo absolute left-0 flex items-center gap-2 px-2 py-2 transition mt-5 group hover:bg-white/10 rounded whitespace-nowrap",
          isCollapsed && "justify-center px-0"
        )}
        href={suiteUrl("/home")}
      >
        <Image
          alt=""
          className="size-4 shrink-0"
          height={16}
          src="/images/menu-logo.svg"
          width={16}
        />
        <span
          className={clsx(
            "text-xs font-normal whitespace-nowrap overflow-hidden flex items-center",
            isCollapsed && "hidden"
          )}
        >
          <Image
            alt="Suite"
            className="h-3 w-auto"
            height={12}
            src="/images/menu-logo-name.svg"
            width={60}
          />
        </span>
      </a>

      {/* Toggle button - keep visible when collapsed so user can expand again (excluded from .collapsed span hide) */}
      <div className="relative">
        <button
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={clsx(
            "sidebar-toggle absolute right-0 top-7 py-1 h-8 px-1 bg-[#00CCC440] rounded-l-2xl z-20 flex items-center justify-center",
            isRtl && "left-0 right-auto rounded-l-none rounded-r-2xl"
          )}
          type="button"
          onClick={onToggle}
        >
          <span
            className={clsx(
              "text-lg font-light inline-block transition-transform duration-300 scale-x-[-1]",
              isCollapsed && "rotate-180"
            )}
          >
            ›
          </span>
        </button>
      </div>

      {/* Scrollable nav - mt-[60px] like HTML; custom-scroll for sidebar styling */}
      <div className="relative grow overflow-hidden flex flex-col custom-scroll">
        <div className="scrollbar-hide h-[95vh] mt-[60px] flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col gap-3.5 h-[90%] justify-between">
            <div>
              {SUITE_PRIMARY_MENU_ITEMS.map((item) =>
                item.children && item.children.length > 0 ? (
                  <SuitePrimaryItemWithChildren
                    key={item.label}
                    isCollapsed={isCollapsed}
                    isOpen={openMenuId === item.label}
                    item={item}
                    onToggle={() => toggleSubmenu(item.label)}
                  />
                ) : (
                  <SuitePrimaryLink key={item.label} isCollapsed={isCollapsed} item={item} />
                )
              )}
            </div>
            <div>
              <a
                className={clsx(
                  "flex items-center gap-2 px-2 py-2.5 transition hover:bg-white/10 group rounded whitespace-nowrap",
                  isCollapsed && "justify-center px-0"
                )}
                href={suiteUrl("/logout")}
              >
                <Image
                  alt=""
                  className="size-4 shrink-0"
                  height={16}
                  src="/images/icons/logout.svg"
                  width={16}
                />
                <span className={clsx("text-sm font-normal", isCollapsed && "hidden")}>Logout</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuitePrimaryLink({
  item,
  isCollapsed,
}: {
  item: SuitePrimaryMenuItem;
  isCollapsed: boolean;
}) {
  if (!item.link) return null;

  return (
    <a
      className={clsx(
        "relative flex items-center gap-2 px-2 py-2.5 transition hover:bg-white/10 group rounded whitespace-nowrap",
        isCollapsed && "justify-center px-0"
      )}
      href={suiteUrl(item.link)}
    >
      <Image alt="" className="size-4 shrink-0" height={16} src={item.imgPath} width={16} />
      <span className={clsx("text-sm font-normal", isCollapsed && "hidden")}>{item.label}</span>
    </a>
  );
}

function SuitePrimaryItemWithChildren({
  item,
  isCollapsed,
  isOpen,
  onToggle,
}: {
  item: SuitePrimaryMenuItem;
  isCollapsed: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const children = item.children ?? [];

  return (
    <div className="menu-group">
      <button
        className={clsx(
          "w-full flex items-center justify-between gap-2 px-2 py-1 hover:bg-white/10 rounded group whitespace-nowrap",
          isCollapsed && "justify-center px-0"
        )}
        type="button"
        onClick={onToggle}
      >
        <div className={clsx("flex items-center gap-2", isCollapsed && "gap-0")}>
          <Image alt="" className="size-4 shrink-0" height={16} src={item.imgPath} width={16} />
          <span className={clsx("text-sm font-normal", isCollapsed && "hidden")}>{item.label}</span>
        </div>
        <span
          className={clsx(
            "transition-transform duration-300 text-lg shrink-0 font-light",
            isOpen && "rotate-90",
            isCollapsed && "hidden"
          )}
        >
          ›
        </span>
      </button>
      {!isCollapsed && isOpen && (
        <div className="mt-2 flex flex-col space-y-2 pl-4">
          {children.map((child) => (
            <a
              key={child.link}
              className="block px-4 py-2 rounded hover:bg-white/10 text-sm"
              href={suiteUrl(child.link)}
            >
              {child.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
