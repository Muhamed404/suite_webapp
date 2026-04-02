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
      `Module ${moduleId}`
    );
  };

  const getDepartmentNames = () => {
    if (loading) return "Loading...";
    if (formData.departments.length === 0) return "None";

    return formData.departments
      .map((id) => {
        const dept = departments.find((d) => d.id === id);

        return dept?.name || `Department ${id}`;
      })
      .join(", ");
  };

  const getGroupNames = () => {
    if (loading) return "Loading...";
    if (formData.groups.length === 0) return "None";

    return formData.groups
      .map((id) => {
        const group = groups.find((g) => g.id === id);

        return group?.name || `Group ${id}`;
      })
      .join(", ");
  };

  return (
    <div>
      {/* Header Section */}
      <div className="flex items-start gap-4 pb-4 mb-4 border-b border-gray-200">
        <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#051226]">Campaign Ready to Create!</h2>
          <p className="text-xs text-gray-500">Review your campaign details before submitting</p>
        </div>
      </div>

      {/* Summary Details */}
      <div className="space-y-0">
        <div className="flex items-start gap-4 py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#051226] w-32 flex-shrink-0">Name</span>
          <span className="text-sm text-gray-600 flex-1">{formData.campaignName}</span>
        </div>
        <div className="flex items-start gap-4 py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#051226] w-32 flex-shrink-0">
            Description
          </span>
          <span className="text-sm text-gray-600 flex-1">{formData.description || "—"}</span>
        </div>
        <div className="flex items-start gap-4 py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#051226] w-32 flex-shrink-0">Gamified</span>
          <span className="text-sm text-gray-600 flex-1">{formData.gamified ? "Yes" : "No"}</span>
        </div>
        <div className="flex items-start gap-4 py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#051226] w-32 flex-shrink-0">
            Departments
          </span>
          <span className="text-sm text-gray-600 flex-1">{getDepartmentNames()}</span>
        </div>
        <div className="flex items-start gap-4 py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#051226] w-32 flex-shrink-0">Groups</span>
          <span className="text-sm text-gray-600 flex-1">{getGroupNames()}</span>
        </div>
        <div className="flex items-start gap-4 py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#051226] w-32 flex-shrink-0">Users</span>
          <span className="text-sm text-gray-600 flex-1">
            {formData.manualUsers.length > 0
              ? formData.manualUsers.map((u) => `${u.firstName} ${u.lastName}`).join(", ")
              : "None"}
          </span>
        </div>
        <div className="flex items-start gap-4 py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#051226] w-32 flex-shrink-0">Topics</span>
          <span className="text-sm text-gray-600 flex-1">
            {formData.modules.length > 0
              ? formData.modules.map((id) => getModuleName(id)).join(", ")
              : "None"}
          </span>
        </div>
        <div className="flex items-start gap-4 py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#051226] w-32 flex-shrink-0">Start</span>
          <span className="text-sm text-gray-600 flex-1">{formData.startDate || "—"}</span>
        </div>
        <div className="flex items-start gap-4 py-2">
          <span className="text-sm font-semibold text-[#051226] w-32 flex-shrink-0">End</span>
          <span className="text-sm text-gray-600 flex-1">{formData.endDate || "—"}</span>
        </div>
      </div>
    </div>
  );
}
