"use client";

import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";

import { useTranslations } from "@/i18n/useTranslations";
import { useAuthStore } from "@/hooks/useAuthStore";
import { suiteSuiteService, type Department, type Group, type User } from "@/services/suiteSuiteService";

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
  modulesList: Array<{ id: number; title?: string; name?: string; code?: string; translations?: Array<{ name?: string }> }>;
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
        const orgId = user?.organization_id || user?.org_id;
        if (!orgId) return;

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

    return module?.title || module?.name || module?.translations?.[0]?.name || module?.code || `Module ${moduleId}`;
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold">Campaign Ready to Create!</h2>
        <p className="text-gray-600 mt-2">Review your campaign details below</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Basic Information</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Campaign Name:</dt>
              <dd className="font-medium">{formData.campaignName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Description:</dt>
              <dd className="font-medium">{formData.description || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Duration:</dt>
              <dd className="font-medium">
                {formData.startDate} to {formData.endDate}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Gamification:</dt>
              <dd className="font-medium">{formData.gamified ? "Enabled" : "Disabled"}</dd>
            </div>
          </dl>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Target Users</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex flex-col">
              <dt className="text-gray-600 mb-1">Departments:</dt>
              <dd className="font-medium ml-4">{getDepartmentNames()}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-gray-600 mb-1">Groups:</dt>
              <dd className="font-medium ml-4">{getGroupNames()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Manual Users:</dt>
              <dd className="font-medium">{formData.manualUsers.length} users</dd>
            </div>
          </dl>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Modules & Content</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-600 mb-1">Selected Modules:</dt>
              <dd className="font-medium ml-4">
                <ul className="list-disc">
                  {formData.modules.map((id) => (
                    <li key={id}>{getModuleName(id)}</li>
                  ))}
                </ul>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Short Videos:</dt>
              <dd className="font-medium">{formData.visualShortVideos ? "Yes" : "No"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Interactive Content:</dt>
              <dd className="font-medium">{formData.visualInteractive ? "Yes" : "No"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Quiz Enabled:</dt>
              <dd className="font-medium">{formData.enableQuiz ? "Yes" : "No"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Certificate Enabled:</dt>
              <dd className="font-medium">{formData.enableCertificate ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </div>

        {formData.schedules.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Schedule</h3>
            <dl className="space-y-2 text-sm">
              {formData.schedules.map((schedule) => (
                <div key={schedule.module_id} className="flex justify-between">
                  <dt className="text-gray-600">{getModuleName(schedule.module_id)}:</dt>
                  <dd className="font-medium">{schedule.start_date}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
