"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { useI18n } from "@/i18n/I18nProvider";

function cn(...classes: (string | boolean | undefined)[]): string {
  return clsx(...classes.filter(Boolean));
}

interface MenuItem {
  href?: string;
  icon: string;
  label: string;
  children?: MenuItem[];
}

interface PrimaryMenuProps {
  menuItems: MenuItem[];
  onToggle?: () => void;
  isCollapsed?: boolean;
}

export const PrimaryMenu = ({ menuItems, onToggle, isCollapsed = false }: PrimaryMenuProps) => {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const toggleMenu = (menuId: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  return (
    <div
      className={cn(
        "flex h-screen bg-black text-white transition-all duration-300",
        isCollapsed ? "w-20" : "w-[200px]"
      )}
    >
      {/* Logo */}
      <Link
        href="#"
        className="absolute flex items-center gap-3 px-3 py-3 transition mt-5 group"
      >
        <Image
          src="/images/menu-logo.svg"
          alt="Menu Logo"
          width={20}
          height={20}
          className="size-5"
        />
        {!isCollapsed && (
          <span className="menu-text">
            <Image
              src="/images/menu-logo-name.svg"
              alt="Menu Logo Name"
              width={80}
              height={16}
              className="h-4"
            />
          </span>
        )}
      </Link>

      {/* Toggle Button */}
      <div className="relative">
        <Button
          onPress={onToggle}
          className={cn(
            "absolute top-7 py-1.5 h-10 px-1.5 bg-[#00CCC440] z-20",
            isRtl ? "left-0 rounded-r-2xl" : "right-0 rounded-l-2xl"
          )}
          variant="flat"
          isIconOnly
        >
          <span className={cn("text-xl font-light inline-block transition-transform", isCollapsed && "scale-x-[-1]")}>
            ›
          </span>
        </Button>
      </div>

      {/* Menu Items */}
      <div className="relative grow overflow-hidden custom-scroll">
        <div className="h-[95vh] mt-[70px] flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col gap-4 h-[90%] justify-between">
            {/* Navigation Links */}
            <div>
              {menuItems.map((item, index) => (
                <MenuItemComponent
                  key={index}
                  item={item}
                  isCollapsed={isCollapsed}
                  openMenus={openMenus}
                  onToggleMenu={toggleMenu}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MenuItemComponentProps {
  item: MenuItem;
  isCollapsed: boolean;
  openMenus: Record<string, boolean>;
  onToggleMenu: (menuId: string) => void;
}

const MenuItemComponent = ({ item, isCollapsed, openMenus, onToggleMenu }: MenuItemComponentProps) => {
  const menuId = item.label.toLowerCase().replace(/\s+/g, "");

  if (item.children && item.children.length > 0) {
    return (
      <div>
        <button
          onClick={() => onToggleMenu(menuId)}
          className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-white/10 rounded whitespace-nowrap group"
        >
          <div className="flex items-center gap-3">
            <Image src={item.icon} alt="" width={20} height={20} className="size-5" />
            {!isCollapsed && <span className="text-sm font-normal menu-text">{item.label}</span>}
          </div>
          {!isCollapsed && (
            <span
              className={cn(
                "transition-transform duration-300 text-xl menu-text",
                openMenus[menuId] && "rotate-90"
              )}
            >
              ›
            </span>
          )}
        </button>

        {!isCollapsed && openMenus[menuId] && (
          <div className={cn("mt-2 flex-col space-y-2", isRtl ? "pr-6" : "pl-6")}>
            {item.children.map((child, childIndex) => (
              <MenuItemComponent
                key={childIndex}
                item={child}
                isCollapsed={isCollapsed}
                openMenus={openMenus}
                onToggleMenu={onToggleMenu}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href || "#"}
      className="relative flex items-center gap-3 px-3 py-3 transition hover:bg-white/10 group whitespace-nowrap"
    >
      <Image src={item.icon} alt="" width={20} height={20} className="size-5" />
      {!isCollapsed && <span className="text-sm font-normal menu-text">{item.label}</span>}
    </Link>
  );
};


