"use client";

import { useEffect, useRef, useState } from "react";
import { Users, ChevronDown, X } from "lucide-react";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";
import { suiteSuiteService, type Department, type Group, type User } from "@/services/suiteSuiteService";
import { useAuthStore } from "@/hooks/useAuthStore";

interface WizardStep2Props {
  formData: {
    departments: number[];
    groups: number[];
    manualUsers: User[];
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
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);
  const groupDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target as Node)) {
        setDeptDropdownOpen(false);
      }
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target as Node)) {
        setGroupDropdownOpen(false);
      }
    };

    if (deptDropdownOpen || groupDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [deptDropdownOpen, groupDropdownOpen]);

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

  const removeDepartment = (id: number) => {
    onChange("departments", formData.departments.filter((d) => d !== id));
  };

  const toggleGroup = (id: number) => {
    const newGroups = formData.groups.includes(id)
      ? formData.groups.filter((g) => g !== id)
      : [...formData.groups, id];

    onChange("groups", newGroups);
  };

  const removeGroup = (id: number) => {
    onChange("groups", formData.groups.filter((g) => g !== id));
  };

  const getDepartmentName = (id: number) => {
    return departments.find((d) => d.id === id)?.name || `Department ${id}`;
  };

  const getGroupName = (id: number) => {
    return groups.find((g) => g.id === id)?.name || `Group ${id}`;
  };

  const activeDepartments = departments.filter((dept) => dept.is_Active !== false && dept.is_Deleted !== true);
  const activeGroups = groups.filter((group) => group.is_Active !== false && group.is_Deleted !== true);

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
            
            <div className="relative" ref={deptDropdownRef}>
              <button
                onClick={() => setDeptDropdownOpen(!deptDropdownOpen)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-between hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 bg-white min-h-[40px] text-left"
              >
                <div className="flex flex-wrap gap-2 flex-1">
                  {formData.departments.length === 0 ? (
                    <span className="text-gray-500">{t("form.selectDepartments")}</span>
                  ) : (
                    formData.departments.map((deptId) => (
                      <span
                        key={deptId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                      >
                        {getDepartmentName(deptId)}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            removeDepartment(deptId);
                          }}
                          className="hover:text-blue-900 transition-colors flex-shrink-0 cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              removeDepartment(deptId);
                            }
                          }}
                        >
                          <X className="w-3 h-3" />
                        </div>
                      </span>
                    ))
                  )}
                </div>
                <ChevronDown className={clsx("w-4 h-4 transition-transform flex-shrink-0", deptDropdownOpen && "rotate-180")} />
              </button>

              {deptDropdownOpen && activeDepartments.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-lg bg-white shadow-lg z-10">
                  <div className="max-h-48 overflow-y-auto">
                    {activeDepartments.map((dept) => (
                      <label
                        key={dept.id}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.departments.includes(dept.id)}
                          onChange={() => toggleDepartment(dept.id)}
                          className="w-4 h-4 text-blue-500 rounded"
                        />
                        <span className="text-sm">{dept.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <small className="text-gray-500 mt-2 block">{t("form.departmentsPlaceholder")}</small>
          </div>

          {/* Groups */}
          <div>
            <label className="block text-sm font-medium mb-3">{t("form.selectGroups")}</label>
            
            <div className="relative" ref={groupDropdownRef}>
              <button
                onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-between hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 bg-white min-h-[40px] text-left"
              >
                <div className="flex flex-wrap gap-2 flex-1">
                  {formData.groups.length === 0 ? (
                    <span className="text-gray-500">{t("form.selectGroups")}</span>
                  ) : (
                    formData.groups.map((groupId) => (
                      <span
                        key={groupId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                      >
                        {getGroupName(groupId)}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            removeGroup(groupId);
                          }}
                          className="hover:text-blue-900 transition-colors flex-shrink-0 cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              removeGroup(groupId);
                            }
                          }}
                        >
                          <X className="w-3 h-3" />
                        </div>
                      </span>
                    ))
                  )}
                </div>
                <ChevronDown className={clsx("w-4 h-4 transition-transform flex-shrink-0", groupDropdownOpen && "rotate-180")} />
              </button>

              {groupDropdownOpen && activeGroups.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-lg bg-white shadow-lg z-10">
                  <div className="max-h-48 overflow-y-auto">
                    {activeGroups.map((group) => (
                      <label
                        key={group.id}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.groups.includes(group.id)}
                          onChange={() => toggleGroup(group.id)}
                          className="w-4 h-4 text-blue-500 rounded"
                        />
                        <span className="text-sm">{group.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
              {formData.manualUsers.map((user) => (
                <span
                  key={user.id}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {user.firstName} {user.lastName}
                  <div
                    onClick={() => onChange("manualUsers", formData.manualUsers.filter((u) => u.id !== user.id))}
                    className="hover:text-blue-900 cursor-pointer transition-colors"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onChange("manualUsers", formData.manualUsers.filter((u) => u.id !== user.id));
                      }
                    }}
                  >
                    ×
                  </div>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
