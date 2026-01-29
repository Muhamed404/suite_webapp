"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { useI18n } from "@/i18n/I18nProvider";

function cn(...classes: (string | boolean | undefined)[]): string {
  return clsx(...classes.filter(Boolean));
}

interface SubMenuItem {
  href: string;
  icon: string;
  label: string;
  activeIcon?: string;
}

interface SubMenuProps {
  items: SubMenuItem[];
  isCollapsed?: boolean;
}

export const SubMenu = ({ items, isCollapsed = false }: SubMenuProps) => {
  const pathname = usePathname();
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  return (
    <div
      className={cn(
        "w-12 bg-[var(--bg)] text-gray-800 transition-all duration-300 overflow-hidden mt-2 h-[98vh]",
        isRtl ? "rounded-r-3xl" : "rounded-l-3xl",
        !isCollapsed && "w-48"
      )}
    >
      <div className="flex py-5 px-3 gap-3 items-center">
        <Image
          src="/images/img/aware-icon.svg"
          alt=""
          width={24}
          height={24}
          className="size-6"
        />
        {!isCollapsed && (
          <Image
            src="/images/img/aware-name.svg"
            alt=""
            width={80}
            height={16}
            className="svg-color menu-text hidden text-[var(--mainblue)] h-4"
          />
        )}
      </div>
      <ul className="text-white">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "px-3 py-3 flex items-center gap-3 cursor-pointer transition-colors",
                  isActive
                    ? "bg-[#00999310]"
                    : "hover:bg-white/10"
                )}
              >
                <span>
                  <Image
                    src={isActive && item.activeIcon ? item.activeIcon : item.icon}
                    alt=""
                    width={20}
                    height={20}
                    className="size-5"
                  />
                </span>
                {!isCollapsed && (
                  <span
                    className={cn(
                      "menu-text text-[var(--mainblue)] text-sm",
                      isCollapsed && "hidden"
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

