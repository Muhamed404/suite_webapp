"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";
import { suiteSuiteService, type Department, type Group } from "@/services/suiteSuiteService";
import { useAuthStore } from "@/hooks/useAuthStore";

interface WizardStep2Props {
  formData: {
    departments: number[];
    groups: number[];
    manualUsers: number[];
  };
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  onOpenUserModal: () => void;
}

export function WizardStep2({ formData, onChange, errors, onOpenUserModal }: WizardStep2Props) {
  const t = useTranslations("campaigns");
  const { user } = useAuthStore();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<Record<number, string>>({}); // Map of userId -> userName
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const orgId = user?.organization_id || user?.org_id;
      if (!orgId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const [depts, grps, fetchedUsers] = await Promise.all([
          suiteSuiteService.getDepartments(orgId),
          suiteSuiteService.getGroups(orgId),
          suiteSuiteService.getUnassignedUsers(orgId),
        ]);
        
        console.log('Departments response:', depts);
        console.log('Groups response:', grps);
        console.log('Users response:', fetchedUsers);
        
        setDepartments(depts || []);
        setGroups(grps || []);
        
        // Build user map for display
        const userMap: Record<number, string> = {};
        if (fetchedUsers && Array.isArray(fetchedUsers)) {
          fetchedUsers.forEach((u: any) => {
            userMap[u.id] = `${u.firstName} ${u.lastName}`.trim();
          });
        }
        setUsers(userMap);
      } catch (err) {
        console.error("Failed to fetch departments/groups/users:", err);
        setError("Failed to load departments, groups, and users");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.organization_id, user?.org_id]);

  const toggleDepartment = (id: number) => {
    const newDepts = formData.departments.includes(id)
      ? formData.departments.filter((d) => d !== id)
      : [...formData.departments, id];

    onChange("departments", newDepts);
  };

  const toggleGroup = (id: number) => {
    const newGroups = formData.groups.includes(id)
      ? formData.groups.filter((g) => g !== id)
      : [...formData.groups, id];

    onChange("groups", newGroups);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <Users className="w-6 h-6 text-blue-500" />
        <span>{t("wizard.step2")} <span className="text-red-500">*</span></span>
      </h2>

      {errors.targets && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {errors.targets}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading departments and groups...</div>
      ) : (
        <>
          {/* Departments */}
          <div>
            <label className="block text-sm font-medium mb-3">{t("form.selectDepartments")}</label>
            {departments.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No departments available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {departments
                  .filter((dept) => dept.is_Active !== false && dept.is_Deleted !== true)
                  .map((dept) => (
                    <label
                      key={dept.id}
                      className={clsx(
                        "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                        formData.departments.includes(dept.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:border-blue-300"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={formData.departments.includes(dept.id)}
                        onChange={() => toggleDepartment(dept.id)}
                        className="w-4 h-4 text-blue-500 rounded"
                      />
                      <span className="text-sm font-medium">{dept.name}</span>
                    </label>
                  ))}
              </div>
            )}
            <small className="text-gray-500 mt-2 block">{t("form.departmentsPlaceholder")}</small>
          </div>

          {/* Groups */}
          <div>
            <label className="block text-sm font-medium mb-3">{t("form.selectGroups")}</label>
            {groups.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No groups available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groups
                  .filter((group) => group.is_Active !== false && group.is_Deleted !== true)
                  .map((group) => (
                    <label
                      key={group.id}
                      className={clsx(
                        "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                        formData.groups.includes(group.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:border-blue-300"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={formData.groups.includes(group.id)}
                        onChange={() => toggleGroup(group.id)}
                        className="w-4 h-4 text-blue-500 rounded"
                      />
                      <span className="text-sm font-medium">{group.name}</span>
                    </label>
                  ))}
              </div>
            )}
            <small className="text-gray-500 mt-2 block">{t("form.groupsPlaceholder")}</small>
          </div>
        </>
      )}

      {/* Manual Users */}
      <div>
        <Button onClick={onOpenUserModal} className="bg-blue-500 text-white">
          {t("form.addUsersManually")}
        </Button>
        {formData.manualUsers.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium">{t("form.manuallyAddedUsers")}:</p>
            <div className="flex flex-wrap gap-2">
              {formData.manualUsers.map((userId) => (
                <span
                  key={userId}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {users[userId] || `User ${userId}`}
                  <button
                    onClick={() => onChange("manualUsers", formData.manualUsers.filter((id) => id !== userId))}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
