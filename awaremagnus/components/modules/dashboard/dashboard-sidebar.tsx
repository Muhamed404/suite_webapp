"use client";

import clsx from "clsx";

import { SubMenu } from "@/components/ui/sidebar-sub-menu";
import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";

interface DashboardSidebarProps {
  /** On mobile: controls drawer visibility. On lg: ignored (sidebar always visible). */
  open?: boolean;
  /** Called when sidebar should close (e.g. backdrop click). Used on mobile. */
  onClose?: () => void;
}

export const DashboardSidebar = ({ open = false, onClose }: DashboardSidebarProps) => {
  const { dir } = useI18n();
  const t = useTranslations("dashboard");
  const isRtl = dir === "rtl";

  const subMenuItems = [
    {
      href: "/dashboard",
      icon: "/images/icons/second-menu-dashboard-active.svg",
      activeIcon: "/images/icons/second-menu-dashboard-active.svg",
      label: t("menu.dashboard"),
    },
    {
      href: "/dashboard/license-user",
      icon: "/images/Icon_License.svg",
      label: t("menu.licenseUser"),
    },
    {
      href: "/dashboard/survey",
      icon: "/images/Icon_Template.svg",
      label: t("menu.survey"),
    },
    {
      href: "/dashboard/training-library/system",
      icon: "/images/Icon_Template.svg",
      label: t("menu.trainingLibrary"),
      children: [
        {
          href: "/dashboard/training-library/system",
          icon: "/images/Icon_Template.svg",
          label: t("menu.systemLibrary"),
        },
        {
          href: "/dashboard/training-library/my",
          icon: "/images/Icon_Template.svg",
          label: t("menu.myLibrary"),
        },
      ],
    },
    {
      href: "/dashboard/system-branding",
      icon: "/images/Icon_Template.svg",
      label: t("menu.systemBranding"),
      children: [
        { href: "#", icon: "", label: "Certificate" },
        { href: "#", icon: "", label: "Logo and Images" },
      ],
    },
    {
      href: "/dashboard/launch-awareness",
      icon: "/images/Icon_Template.svg",
      label: t("menu.launchAwareness"),
      children: [
        { href: "#", icon: "", label: "Campaigns" },
        { href: "#", icon: "", label: "Reports" },
      ],
    },
    {
      href: "/dashboard/settings",
      icon: "/images/Icon_Template.svg",
      label: t("menu.systemSettings"),
    },
    {
      href: "/dashboard/my-awareness",
      icon: "/images/Icon_Template.svg",
      label: t("menu.myAwareness"),
      children: [
        { href: "#", icon: "", label: "Profile" },
        { href: "#", icon: "", label: "Certificates" },
        { href: "#", icon: "", label: "Achievements" },
        { href: "#", icon: "", label: "Assignments" },
        { href: "#", icon: "", label: "Report Card" },
      ],
    },
  ];

  return (
    <div
      className={clsx(
        "flex h-screen shrink-0 w-52 z-50 transition-[transform] duration-300 ease-out",
        "fixed top-0 bottom-0 lg:relative lg:translate-x-0 lg:transition-none",
        isRtl ? "right-0" : "left-0",
        open ? "translate-x-0" : isRtl ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      <SubMenu isCollapsed={false} items={subMenuItems} />
    </div>
  );
};
