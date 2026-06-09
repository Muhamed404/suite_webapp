"use client";

import { useRouter } from "next/navigation";
import clsx from "clsx";

import { LayoutDashboard, Mail, UsersRound } from "lucide-react";

import { SubMenu } from "@/components/ui/sidebar-sub-menu";
import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/hooks/useAuthStore";
import { clearAuthTokenCookie } from "@/services/httpClient";

interface DashboardSidebarProps {
  /** On mobile: controls drawer visibility. On lg: ignored (sidebar always visible). */
  open?: boolean;
  /** Called when sidebar should close (e.g. backdrop click). Used on mobile. */
  onClose?: () => void;
  /** When true, show icon-only (collapsed). When false, show full width. */
  isCollapsed?: boolean;
  /** Reserved for parity with Aware Magnus layout API. */
  isEndUser?: boolean;
}

export const DashboardSidebar = ({
  open = false,
  onClose: _onClose,
  isCollapsed = false,
  isEndUser: _isEndUser = false,
}: DashboardSidebarProps) => {
  const router = useRouter();
  const { dir } = useI18n();
  const t = useTranslations("dashboard");
  const isRtl =
    dir === "rtl" ||
    (typeof document !== "undefined" && document.documentElement.dir === "rtl");
  const resetAuth = useAuthStore((state) => state.reset);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      resetAuth();
      clearAuthTokenCookie();
      router.push("/login");
    }
  };

  const subMenuItems = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: t("menu.dashboard"),
    },
    {
      href: "/dashboard/add-families",
      icon: UsersRound,
      label: t("menu.addCybersafeFamily"),
    },
    {
      href: "/dashboard/invitations",
      icon: Mail,
      label: t("menu.invitationLog"),
    },
  ];

  return (
    <div
      className={clsx(
        "flex shrink-0 z-50 transition-[transform] duration-300 ease-out",
        "fixed top-0 bottom-0 lg:relative lg:translate-x-0 lg:transition-none",
        "lg:mt-2 lg:h-[98vh]",
        isRtl ? "right-0" : "left-0",
        open
          ? "translate-x-0"
          : isRtl
            ? "translate-x-full lg:translate-x-0"
            : "-translate-x-full lg:translate-x-0"
      )}
    >
      <SubMenu isCollapsed={isCollapsed} items={subMenuItems} onLogout={handleLogout} />
    </div>
  );
};
