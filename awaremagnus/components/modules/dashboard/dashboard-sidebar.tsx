"use client";

import { useRouter } from "next/navigation";
import clsx from "clsx";

import { SubMenu } from "@/components/ui/sidebar-sub-menu";
import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/hooks/useAuthStore";
import { clearAuthTokenCookie } from "@/services/httpClient";
import { isOrgAdmin } from "@/utils/roles";

interface DashboardSidebarProps {
  /** On mobile: controls drawer visibility. On lg: ignored (sidebar always visible). */
  open?: boolean;
  /** Called when sidebar should close (e.g. backdrop click). Used on mobile. */
  onClose?: () => void;
  /** When true, show icon-only (collapsed). When false, show full width. Matches PhishMagnus: sub collapsed when primary expanded. */
  isCollapsed?: boolean;
  /** When true, user is Org User (end-user / learner): show limited menu (Campaign Assignments, Certificates). */
  isEndUser?: boolean;
}

export const DashboardSidebar = ({
  open = false,
  onClose,
  isCollapsed = false,
  isEndUser = false,
}: DashboardSidebarProps) => {
  const router = useRouter();
  const { dir } = useI18n();
  const t = useTranslations("dashboard");
  const isRtl =
    dir === "rtl" ||
    (typeof document !== "undefined" && document.documentElement.dir === "rtl");
  const user = useAuthStore((state) => state.user);
  const resetAuth = useAuthStore((state) => state.reset);
  const isOrgAdminUser = isOrgAdmin(user?.role_id);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Clear auth state and cookies regardless of API success
      resetAuth();
      clearAuthTokenCookie();
      router.push("/login");
    }
  };

  /* ─── Admin / Org Admin menu items (existing) ─── */
  const adminMenuItems = [
    {
      href: "/dashboard",
      icon: getContentAssetUrl("/images/awaremagnus_sidebar/Dashboard_Solid.svg"),
      activeIcon: getContentAssetUrl("/images/awaremagnus_sidebar/Dashboard_Solid.svg"),
      label: t("menu.dashboard"),
    },
    {
      href: "/dashboard/training-library/system",
      icon: getContentAssetUrl("/images/awaremagnus_sidebar/Training_Library_Solid.svg"),
      label: t("menu.trainingLibrary"),
      children: [
        {
          href: "/dashboard/training-library/system",
          icon: getContentAssetUrl("/images/awaremagnus_sidebar/Training_Library_Solid.svg"),
          label: t("menu.systemLibrary"),
        },
        {
          href: "/dashboard/training-library/my",
          icon: getContentAssetUrl("/images/awaremagnus_sidebar/Training_Library_Solid.svg"),
          label: t("menu.myLibrary"),
        },
        {
          href: "/dashboard/awareness-assets",
          icon: getContentAssetUrl("/images/awaremagnus_sidebar/AwarenessAssets_Solid.svg"),
          label: t("menu.assetsAndMaterials") ?? "Assets & Materials",
        },
      ],
    },

    {
      href: "/dashboard/launch-awareness",
      icon: getContentAssetUrl("/images/awaremagnus_sidebar/Awareness_Solid.svg"),
      label: t("menu.launchAwareness"),
      children: [
        {
          href: "/dashboard/launch-awareness/campaigns/create",
          icon: "",
          label: t("menu.newCampaign"),
        },
        {
          href: "/dashboard/launch-awareness/campaigns",
          icon: "",
          label: t("menu.campaigns"),
        },
      ],
    },
    {
      href: "/dashboard/launch-awareness/invitations",
      icon: getContentAssetUrl("/images/mail.svg"),
      label: t("menu.invitationLog"),
    },
    {
      href: "/dashboard/survey",
      icon: getContentAssetUrl("/images/awaremagnus_sidebar/Assessments_Solid.svg"),
      label: t("menu.surveyManagement"),
      children: [
        {
          href: "/dashboard/survey",
          icon: "",
          label: t("menu.viewSurveys"),
        },
        {
          href: "/dashboard/survey/questions",
          icon: "",
          label: t("menu.quizQuestions"),
        },
      ],
    },
    {
      href: "/dashboard/system-branding",
      icon: getContentAssetUrl("/images/awaremagnus_sidebar/Branding_Solid.svg"),
      label: t("menu.systemBranding"),
      children: [
        { href: "/dashboard/system-branding/certificate", icon: "", label: t("menu.certificate") },
      ],
    },
    {
      href: "/dashboard/my-awareness",
      icon: getContentAssetUrl("/images/awaremagnus_sidebar/Report.svg"),
      label: t("menu.myAwareness"),
      children: [
        { href: "/dashboard/certification-report", icon: "", label: t("menu.certificationReport") },
      ],
    },
  ];

  /* ─── Org User (end-user / learner) menu items ─── */
  const endUserMenuItems = [
    {
      href: "/dashboard",
      icon: getContentAssetUrl("/images/awaremagnus_sidebar/Dashboard_Solid.svg"),
      activeIcon: getContentAssetUrl("/images/awaremagnus_sidebar/Dashboard_Solid.svg"),
      label: t("menu.dashboard"),
    },
    {
      href: "/dashboard/campaign-assignments",
      icon: getContentAssetUrl("/images/awaremagnus_sidebar/Assessments_Solid.svg"),
      label: t("menu.campaignAssignments"),
    },
    {
      href: "/dashboard/certificates",
      icon: getContentAssetUrl("/images/awaremagnus_sidebar/Licensed_user_Solid.svg"),
      label: t("menu.certificates"),
    },
    {
      href: "/dashboard/my-report-card",
      icon: getContentAssetUrl("/images/awaremagnus_sidebar/Report.svg"),
      label: t("menu.reportCard"),
    },
    {
      href: "/dashboard/my-achievements",
      icon: getContentAssetUrl("/images/awaremagnus_sidebar/Achievements_Solid.svg"),
      label: t("menu.achievements"),
    },
  ];

  const subMenuItems = isEndUser ? endUserMenuItems : adminMenuItems;

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
