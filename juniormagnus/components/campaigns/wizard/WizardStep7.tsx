"use client";

import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";

import { useTranslations } from "@/i18n/useTranslations";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
  suiteSuiteService,
  type Department,
  type Group,
  type User,
} from "@/services/suiteSuiteService";

interface WizardStep7Props {
  formData: {
    campaignName: string;
    description: string;
    startDate: string;
    endDate: string;
    gamified: boolean;
    departments: number[];
    groups: number[];
    manualUsers: User[];
    modules: number[];
    visualShortVideos: boolean;
    visualInteractive: boolean;
    visualOthers: boolean;
    enableQuiz: boolean;
    enableCertificate: boolean;
    schedules: Array<{ module_id: number; start_date: string }>;
  };
  modulesList: Array<{
    id: number;
    title?: string;
    name?: string;
    code?: string;
    translations?: Array<{ name?: string }>;
  }>;
}

export function WizardStep7({ formData, modulesList }: WizardStep7Props) {
  const t = useTranslations("campaigns");
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orgId = user?.organization_id ?? user?.org_id;

        if (orgId === undefined || orgId === null) return;

        const [deptData, groupData] = await Promise.all([
          suiteSuiteService.getDepartments(orgId),
          suiteSuiteService.getGroups(orgId),
        ]);

        setDepartments(deptData || []);
        setGroups(groupData || []);
      } catch (error) {
        console.error("Error fetching departments/groups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.organization_id, user?.org_id]);

  const getModuleName = (moduleId: number) => {
    const module = modulesList.find((m) => m.id === moduleId);

    return (
      module?.title ||
      module?.name ||
      module?.translations?.[0]?.name ||
      module?.code ||
      t("form.moduleFallback", { id: moduleId })
    );
  };

  const getDepartmentNames = () => {
    if (loading) return t("form.loading");
    if (formData.departments.length === 0) return t("form.summaryUsersNone");

    return formData.departments
      .map((id) => {
        const dept = departments.find((d) => Number(d.id) === Number(id));

        return dept?.name || t("form.deptFallback", { id });
      })
      .join(", ");
  };

  const getGroupNames = () => {
    if (loading) return t("form.loading");
    if (formData.groups.length === 0) return t("form.summaryUsersNone");

    return formData.groups
      .map((id) => {
        const group = groups.find((g) => Number(g.id) === Number(id));

        return group?.name || t("form.groupFallback", { id });
      })
      .join(", ");
  };

  const getUsersSummary = () => {
    const manualPart = formData.manualUsers
      .map((u) => `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim())
      .filter(Boolean)
      .join(", ");
    const hasDeptOrGroup =
      formData.departments.length > 0 || formData.groups.length > 0;

    if (manualPart && hasDeptOrGroup) {
      return t("form.summaryUsersManualPlusTargets", { names: manualPart });
    }
    if (manualPart) return manualPart;
    if (hasDeptOrGroup) return t("form.summaryUsersViaTargets");

    return t("form.summaryUsersNone");
  };

  return (
    <div>
      {/* Header Section */}
      <div className="flex items-start gap-4 pb-4 mb-4 border-b border-gray-200">
        <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#051226]">{t("form.summaryReadyTitle")}</h2>
          <p className="text-xs text-gray-500">{t("form.summaryReadySubtitle")}</p>
        </div>
      </div>

      {/* Summary Details */}
      <div className="space-y-0">
        <div className="flex items-start gap-4 py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#051226] w-32 flex-shrink-0">
            {t("form.summaryFieldName")}
          </span>
          <span className="text-sm text-gray-600 flex-1">{formData.campaignName}</span>
        </div>
        <div className="flex items-start gap-4 py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#051226] w-32 flex-shrink-0">
            {t("form.summaryFieldDescription")}
          </span>
          <span className="text-sm text-gray-600 flex-1">
            {formData.description || t("form.emDash")}
          </span>
        </div>
        <div className="flex items-start gap-4 py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#051226] w-32 flex-shrink-0">
            {t("form.summaryFieldGamified")}
          </span>
          <span className="text-sm text-gray-600 flex-1">
            {formData.gamified ? t("form.summaryYes") : t("form.summaryNo")}
          </span>
        </div>
        <div className="flex items-start gap-4 py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#051226] w-32 flex-shrink-0">
            {t("form.summaryFieldDepartments")}
          </span>
          <span className="text-sm text-gray-600 flex-1">{getDepartmentNames()}</span>
        </div>
        <div className="flex items-start gap-4 py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#051226] w-32 flex-shrink-0">
            {t("form.summaryFieldGroups")}
          </span>
          <span className="text-sm text-gray-600 flex-1">{getGroupNames()}</span>
        </div>
        <div className="flex items-start gap-4 py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#051226] w-32 flex-shrink-0">
            {t("form.summaryFieldUsers")}
          </span>
          <span className="text-sm text-gray-600 flex-1">{getUsersSummary()}</span>
        </div>
        <div className="flex items-start gap-4 py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#051226] w-32 flex-shrink-0">
            {t("form.summaryFieldTopics")}
          </span>
          <span className="text-sm text-gray-600 flex-1">
            {formData.modules.length > 0
              ? formData.modules.map((id) => getModuleName(id)).join(", ")
              : t("form.summaryUsersNone")}
          </span>
        </div>
        <div className="flex items-start gap-4 py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#051226] w-32 flex-shrink-0">
            {t("form.summaryFieldStart")}
          </span>
          <span className="text-sm text-gray-600 flex-1">{formData.startDate || t("form.emDash")}</span>
        </div>
        <div className="flex items-start gap-4 py-2">
          <span className="text-sm font-semibold text-[#051226] w-32 flex-shrink-0">
            {t("form.summaryFieldEnd")}
          </span>
          <span className="text-sm text-gray-600 flex-1">{formData.endDate || t("form.emDash")}</span>
        </div>
      </div>
    </div>
  );
}
