"use client";

import { useEffect, useRef, useState } from "react";
import { Users, ChevronDown, X } from "lucide-react";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";
import {
  suiteSuiteService,
  type Department,
  type Group,
  type User,
} from "@/services/suiteSuiteService";
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
  const [deptSearch, setDeptSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
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
      const orgId = user?.organization_id ?? user?.org_id;

      if (orgId === undefined || orgId === null) return;

      try {
        setLoading(true);
        setError(null);

        const [depts, grps, fetchedUsers] = await Promise.all([
          suiteSuiteService.getDepartments(orgId),
          suiteSuiteService.getGroups(orgId),
          suiteSuiteService.getUnassignedUsers(orgId),
        ]);

        console.log("Departments response:", depts);
        console.log("Groups response:", grps);
        console.log("Users response:", fetchedUsers);

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
    onChange(
      "departments",
      formData.departments.filter((d) => d !== id)
    );
  };

  const toggleGroup = (id: number) => {
    const newGroups = formData.groups.includes(id)
      ? formData.groups.filter((g) => g !== id)
      : [...formData.groups, id];

    onChange("groups", newGroups);
  };

  const removeGroup = (id: number) => {
    onChange(
      "groups",
      formData.groups.filter((g) => g !== id)
    );
  };

  const getDepartmentName = (id: number) => {
    return departments.find((d) => d.id === id)?.name || `Department ${id}`;
  };

  const getGroupName = (id: number) => {
    return groups.find((g) => g.id === id)?.name || `Group ${id}`;
  };

  const activeDepartments = departments.filter(
    (dept) => dept.is_Active !== false && dept.is_Deleted !== true
  );
  const activeGroups = groups.filter(
    (group) => group.is_Active !== false && group.is_Deleted !== true
  );

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-4">
        <Users className="w-4 h-4 text-blue-500" />
        <h2 className="text-sm font-semibold text-[#051226]">
          {t("wizard.step2")} <span className="text-red-500 text-[10px]">*</span>
        </h2>
      </div>

      {errors.targets && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs mb-3">
          {errors.targets}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs mb-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-xs">
          Loading departments and groups...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3">
            {/* Departments */}
            <div className="input-group">
              <label className="block font-medium text-gray-600 mb-3 text-sm">
                {t("form.selectDepartments")}
              </label>

              <div ref={deptDropdownRef} className="relative">
                <button
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-between hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 bg-white min-h-[40px] text-left"
                  onClick={() => setDeptDropdownOpen(!deptDropdownOpen)}
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
                            className="hover:text-blue-900 transition-colors flex-shrink-0 cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDepartment(deptId);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
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
                  <ChevronDown
                    className={clsx(
                      "w-4 h-4 transition-transform flex-shrink-0",
                      deptDropdownOpen && "rotate-180"
                    )}
                  />
                </button>

                {deptDropdownOpen && activeDepartments.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-lg bg-white shadow-lg z-10">
                    <div className="p-2 border-b border-gray-100">
                      <input
                        autoFocus
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                        placeholder="Search departments..."
                        type="text"
                        value={deptSearch}
                        onChange={(e) => setDeptSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {activeDepartments
                        .filter((d) => d.name.toLowerCase().includes(deptSearch.toLowerCase()))
                        .map((dept) => (
                          <label
                            key={dept.id}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                          >
                            <input
                              checked={formData.departments.includes(dept.id)}
                              className="w-4 h-4 text-blue-500 rounded"
                              type="checkbox"
                              onChange={() => toggleDepartment(dept.id)}
                            />
                            <span className="text-sm">{dept.name}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <small className="text-gray-500 mt-1 block text-[10px]">
                {t("form.departmentsPlaceholder")}
              </small>
            </div>

            {/* Groups */}
            <div className="input-group">
              <label className="block font-medium text-gray-600 mb-3 text-sm">
                {t("form.selectGroups")}
              </label>

              <div ref={groupDropdownRef} className="relative">
                <button
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-between hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 bg-white min-h-[40px] text-left"
                  onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
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
                            className="hover:text-blue-900 transition-colors flex-shrink-0 cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeGroup(groupId);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
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
                  <ChevronDown
                    className={clsx(
                      "w-4 h-4 transition-transform flex-shrink-0",
                      groupDropdownOpen && "rotate-180"
                    )}
                  />
                </button>

                {groupDropdownOpen && activeGroups.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-lg bg-white shadow-lg z-10">
                    <div className="p-2 border-b border-gray-100">
                      <input
                        autoFocus
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                        placeholder="Search groups..."
                        type="text"
                        value={groupSearch}
                        onChange={(e) => setGroupSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {activeGroups
                        .filter((g) => g.name.toLowerCase().includes(groupSearch.toLowerCase()))
                        .map((group) => (
                          <label
                            key={group.id}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                          >
                            <input
                              checked={formData.groups.includes(group.id)}
                              className="w-4 h-4 text-blue-500 rounded"
                              type="checkbox"
                              onChange={() => toggleGroup(group.id)}
                            />
                            <span className="text-sm">{group.name}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <small className="text-gray-500 mt-1 block text-[10px]">
                {t("form.groupsPlaceholder")}
              </small>
            </div>
          </div>
        </>
      )}

      {/* Manual Users */}
      <div>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-500 text-blue-500 rounded-full text-xs font-medium hover:bg-blue-500 hover:text-white transition-all"
          type="button"
          onClick={onOpenUserModal}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Add Users</span>
        </button>
        {formData.manualUsers.length > 0 && (
          <div className="mt-3" id="manualUsersList">
            <h4 className="text-xs font-medium text-gray-700 mb-1">Manually Added:</h4>
            <ul className="space-y-1">
              {formData.manualUsers.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center gap-2 px-2 py-1.5 bg-gray-200 border border-gray-300 rounded-md"
                >
                  <span className="text-xs text-gray-700 flex-1">
                    {user.firstName} {user.lastName}
                  </span>
                  <div
                    className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      onChange(
                        "manualUsers",
                        formData.manualUsers.filter((u) => u.id !== user.id)
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        onChange(
                          "manualUsers",
                          formData.manualUsers.filter((u) => u.id !== user.id)
                        );
                      }
                    }}
                  >
                    <X className="w-3 h-3" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
