"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { useI18n } from "@/i18n/I18nProvider";

function cn(...classes: (string | boolean | undefined)[]): string {
  return clsx(...classes.filter(Boolean));
}

export interface SubMenuItem {
  href: string;
  icon: string;
  label: string;
  activeIcon?: string;
  children?: SubMenuItem[];
}

interface SubMenuProps {
  items: SubMenuItem[];
  isCollapsed?: boolean;
}

function isPathUnder(basePath: string, pathname: string): boolean {
  return pathname === basePath || pathname.startsWith(basePath + "/");
}

/** Chevron down icon for expand/collapse */
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      className={cn("w-4 h-4 shrink-0 transition-transform duration-200", open && "rotate-180")}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export const SubMenu = ({ items, isCollapsed = false }: SubMenuProps) => {
  const pathname = usePathname();
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    items.forEach((item) => {
      if (item.children?.length) {
        const key = item.label.toLowerCase().replace(/\s+/g, "");
        initial[key] = item.children!.some((c) => isPathUnder(c.href, pathname));
      }
    });
    return initial;
  });

  const toggleMenu = (menuId: string) => {
    setOpenMenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const navItemBase =
    "w-full px-3 py-2.5 flex items-center gap-3 cursor-pointer transition-colors duration-150 rounded-lg text-sm font-medium";
  const navItemDefault = "text-[var(--mainblue)] hover:bg-[var(--gray)]/60";
  const navItemActive = "bg-[var(--blue)]/15 text-[var(--blue)]";
  const childItemBase =
    "flex items-center gap-3 cursor-pointer transition-colors duration-150 rounded-r-lg text-sm py-2.5 pr-3 pl-4 border-l-2";
  const childItemDefault =
    "text-gray-600 hover:bg-[var(--gray)]/50 hover:text-[var(--mainblue)] border-transparent";
  const childItemActive =
    "bg-[var(--blue)]/10 text-[var(--blue)] font-semibold border-[var(--blue)]";

  return (
    <div
      className={cn(
        "w-12 bg-[var(--bg)] text-gray-800 transition-all duration-300 overflow-hidden mt-2 h-[98vh]",
        isRtl ? "rounded-r-3xl" : "rounded-l-3xl",
        !isCollapsed && "w-52",
      )}
    >
      <div className="flex py-5 px-3 gap-3 items-center">
        <Image
          alt=""
          className="size-6"
          height={24}
          src="/images/img/aware-icon.svg"
          width={24}
        />
        {!isCollapsed && (
          <Image
            alt=""
            className="svg-color menu-text hidden text-[var(--mainblue)] h-4"
            height={16}
            src="/images/img/aware-name.svg"
            width={80}
          />
        )}
      </div>
      <nav className="py-3 overflow-y-auto" aria-label="Dashboard navigation">
        <ul className="space-y-0.5 px-2">
          {items.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const menuId = item.label.toLowerCase().replace(/\s+/g, "");
            const isOpen = openMenus[menuId];
            const isParentActive =
              hasChildren &&
              item.children!.some((c) => isPathUnder(c.href, pathname));

            if (hasChildren) {
              return (
                <li key={item.href + menuId} className="space-y-0.5">
                  <button
                    type="button"
                    className={cn(
                      navItemBase,
                      isParentActive ? navItemActive : navItemDefault,
                      isOpen && "bg-[var(--gray)]/40",
                    )}
                    onClick={() => toggleMenu(menuId)}
                    aria-expanded={isOpen}
                    aria-controls={`submenu-${menuId}`}
                  >
                    <Image
                      alt=""
                      className="size-5 shrink-0"
                      height={20}
                      src={
                        isParentActive && item.activeIcon
                          ? item.activeIcon
                          : item.icon
                      }
                      width={20}
                    />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronIcon open={isOpen} />
                      </>
                    )}
                  </button>
                  {!isCollapsed && isOpen && (
                    <ul
                      id={`submenu-${menuId}`}
                      className={cn(
                        "space-y-0.5 pt-0.5",
                        isRtl ? "mr-2 ml-0" : "ml-2",
                      )}
                    >
                      {item.children!.map((child) => {
                        const isChildActive =
                          pathname === child.href ||
                          isPathUnder(child.href, pathname);
                        return (
                          <li key={child.href}>
                            <Link
                              className={cn(
                                childItemBase,
                                isChildActive ? childItemActive : childItemDefault,
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
            return (
              <li key={item.href}>
                <Link
                  className={cn(
                    navItemBase,
                    isActive ? navItemActive : navItemDefault,
                  )}
                  href={item.href}
                >
                  <Image
                    alt=""
                    className="size-5 shrink-0"
                    height={20}
                    src={
                      isActive && item.activeIcon ? item.activeIcon : item.icon
                    }
                    width={20}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};
