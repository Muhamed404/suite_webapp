"use client";

import { useState } from "react";
import { PrimaryMenu } from "@/components/ui/sidebar-primary-menu";
import { SubMenu } from "@/components/ui/sidebar-sub-menu";
import clsx from "clsx";

import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";

export const DashboardSidebar = () => {
  const [isPrimaryCollapsed, setIsPrimaryCollapsed] = useState(false);
  const { dir } = useI18n();
  const t = useTranslations("dashboard");
  const isRtl = dir === "rtl";

  const primaryMenuItems = [
    {
      href: "#",
      icon: "/images/icons/primary-suit.svg",
      label: t("menu.suitManagement"),
    },
    {
      href: "/dashboard/organization",
      icon: "/images/icons/primary-organization.svg",
      label: t("menu.organization"),
    },
    {
      href: "#",
      icon: "/images/icons/primary-uses.svg",
      label: t("menu.users"),
    },
    {
      icon: "/images/icons/primary-department.svg",
      label: t("menu.department"),
      children: [
        { href: "#", icon: "", label: "A1" },
        {
          icon: "",
          label: "A2",
          children: [
            { href: "#", icon: "", label: "B1" },
            {
              icon: "",
              label: "B2",
              children: [
                { href: "#", icon: "", label: "C1" },
                { href: "#", icon: "", label: "C2" },
              ],
            },
          ],
        },
      ],
    },
    {
      href: "#",
      icon: "/images/icons/primary_group.svg",
      label: t("menu.group"),
    },
    {
      href: "#",
      icon: "/images/icons/primary_subscription.svg",
      label: t("menu.subscriptionHistory"),
    },
    {
      href: "#",
      icon: "/images/icons/primary_products.svg",
      label: t("menu.products"),
    },
  ];

  const subMenuItems = [
    {
      href: "/dashboard",
      icon: "/images/icons/second-menu-dashboard.svg",
      activeIcon: "/images/icons/second-menu-dashboard-active.svg",
      label: t("menu.dashboard"),
    },
    {
      href: "/dashboard/quiz",
      icon: "/images/Icon_Template.svg",
      label: t("menu.quizzes"),
    },
    {
      href: "/dashboard/module",
      icon: "/images/Icon_Template.svg",
      label: t("menu.modules"),
    },
    {
      href: "/dashboard/content/create",
      icon: "/images/Icon_Template.svg",
      label: t("menu.content"),
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
      href: "/dashboard/training-library",
      icon: "/images/Icon_Template.svg",
      label: t("menu.trainingLibrary"),
    },
  ];

  return (
    <div className={clsx("flex h-screen", isRtl && "flex-row-reverse")}>
      <PrimaryMenu
        menuItems={primaryMenuItems}
        isCollapsed={isPrimaryCollapsed}
        onToggle={() => setIsPrimaryCollapsed(!isPrimaryCollapsed)}
      />
      <SubMenu items={subMenuItems} isCollapsed={isPrimaryCollapsed} />
    </div>
  );
};

