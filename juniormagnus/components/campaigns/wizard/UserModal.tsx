"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Users,
  Search,
  UserCheck,
  UserPlus,
  ChevronRight,
  ChevronsRight,
  ChevronLeft,
  ChevronsLeft,
  Check,
} from "lucide-react";

import { suiteSuiteService, type User } from "@/services/suiteSuiteService";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useTranslations } from "@/i18n/useTranslations";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (users: User[]) => void;
  selectedUserIds: number[];
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-600",
  "bg-green-100 text-green-600",
  "bg-yellow-100 text-yellow-600",
  "bg-purple-100 text-purple-600",
  "bg-pink-100 text-pink-600",
  "bg-orange-100 text-orange-600",
  "bg-teal-100 text-teal-600",
];

function getInitials(firstName: string, lastName: string) {
  return `${(firstName?.[0] || "").toUpperCase()}${(lastName?.[0] || "").toUpperCase()}`;
}

function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function UserModal({ isOpen, onClose, onSave, selectedUserIds }: UserModalProps) {
  const t = useTranslations("campaigns");
  const { user } = useAuthStore();
  const [selectedIds, setSelectedIds] = useState<number[]>(selectedUserIds);
  const [availableHighlighted, setAvailableHighlighted] = useState<number[]>([]);
  const [selectedHighlighted, setSelectedHighlighted] = useState<number[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds(selectedUserIds);
    setAvailableHighlighted([]);
    setSelectedHighlighted([]);
    setSearchQuery("");

    const fetchUsers = async () => {
      const orgId = user?.organization_id ?? user?.org_id;

      if (orgId === undefined || orgId === null) return;
      try {
        setLoading(true);
        const fetched = await suiteSuiteService.getAllOrgUsers(orgId);

        setAllUsers(fetched || []);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen]);

  const availableUsers = useMemo(
    () =>
      allUsers
        .filter((u) => !selectedIds.includes(u.id))
        .filter((u) => {
          const name = `${u.firstName} ${u.lastName}`.toLowerCase();

          return name.includes(searchQuery.toLowerCase());
        }),
    [allUsers, selectedIds, searchQuery]
  );

  const selectedUsers = useMemo(
    () => allUsers.filter((u) => selectedIds.includes(u.id)),
    [allUsers, selectedIds]
  );

  const toggleAvailableHighlight = (id: number) => {
    setAvailableHighlighted((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectedHighlight = (id: number) => {
    setSelectedHighlighted((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    setSelectedIds((prev) => [...prev, ...availableHighlighted]);
    setAvailableHighlighted([]);
  };

  const handleAddAll = () => {
    setSelectedIds((prev) => [...prev, ...availableUsers.map((u) => u.id)]);
    setAvailableHighlighted([]);
  };

  const handleRemove = () => {
    setSelectedIds((prev) => prev.filter((id) => !selectedHighlighted.includes(id)));
    setSelectedHighlighted([]);
  };

  const handleRemoveAll = () => {
    setSelectedIds([]);
    setSelectedHighlighted([]);
  };

  const handleRemoveSingle = (id: number) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    setSelectedHighlighted((prev) => prev.filter((x) => x !== id));
  };

  const handleSave = () => {
    const selectedUserObjects = allUsers.filter((u) => selectedIds.includes(u.id));

    onSave(selectedUserObjects);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-500 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{t("userModal.title")}</h3>
                <p className="text-[10px] text-white/70">{t("userModal.subtitle")}</p>
              </div>
            </div>
            <button
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              type="button"
              onClick={onClose}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full ps-10 pe-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("userModal.searchPlaceholder")}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Users Lists */}
        <div className="p-4">
          <div className="flex items-stretch gap-4">
            {/* Available Users */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-gray-400" />
                  {t("userModal.availableUsers")}
                </h4>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {availableUsers.length}
                </span>
              </div>
              <div className="w-full h-52 rounded-lg bg-gray-50 overflow-y-auto p-2 space-y-1 border border-gray-200">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                    {t("userModal.loadingUsers")}
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                    {t("userModal.noUsersAvailable")}
                  </div>
                ) : (
                  availableUsers.map((u, idx) => (
                    <div
                      key={u.id}
                      className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all select-none ${
                        availableHighlighted.includes(u.id)
                          ? "border-blue-400 bg-blue-50 shadow-sm"
                          : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm"
                      }`}
                      onClick={() => toggleAvailableHighlight(u.id)}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${getAvatarColor(idx)}`}
                      >
                        {getInitials(u.firstName, u.lastName)}
                      </div>
                      <span className="text-xs text-gray-700 flex-1 truncate">
                        {u.firstName} {u.lastName}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col justify-center gap-2">
              <button
                className="p-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={availableHighlighted.length === 0}
                title={t("userModal.titleAddSelected")}
                type="button"
                onClick={handleAdd}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                className="p-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={availableUsers.length === 0}
                title={t("userModal.titleAddAll")}
                type="button"
                onClick={handleAddAll}
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
              <button
                className="p-2.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={selectedHighlighted.length === 0}
                title={t("userModal.titleRemoveSelected")}
                type="button"
                onClick={handleRemove}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className="p-2.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={selectedUsers.length === 0}
                title={t("userModal.titleRemoveAll")}
                type="button"
                onClick={handleRemoveAll}
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Selected / Added Users */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <UserCheck className="w-3 h-3 text-blue-500" />
                  {t("userModal.addedUsers")}
                </h4>
                <span className="text-[10px] text-white bg-blue-500 px-2 py-0.5 rounded-full">
                  {selectedUsers.length}
                </span>
              </div>
              <div className="w-full h-52 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50/50 overflow-y-auto p-2 space-y-1 transition-all">
                {selectedUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <UserPlus className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-[10px]">{t("userModal.hintSelectAndArrow")}</p>
                  </div>
                ) : (
                  selectedUsers.map((u, idx) => (
                    <div
                      key={u.id}
                      className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all select-none ${
                        selectedHighlighted.includes(u.id)
                          ? "border-sky-400 bg-sky-100"
                          : "bg-sky-50 border-sky-200 hover:border-sky-300"
                      }`}
                      onClick={() => toggleSelectedHighlight(u.id)}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${getAvatarColor(idx)}`}
                      >
                        {getInitials(u.firstName, u.lastName)}
                      </div>
                      <span className="text-xs text-gray-700 flex-1 truncate">
                        {u.firstName} {u.lastName}
                      </span>
                      <button
                        className="p-0.5 rounded hover:bg-red-100 hover:text-red-500 text-gray-400 transition-colors flex-shrink-0"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSingle(u.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-t border-gray-100">
          <p className="text-[10px] text-gray-500">
            {t("userModal.usersWillBeAdded", { count: selectedUsers.length })}
          </p>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-50 transition-all"
              type="button"
              onClick={onClose}
            >
              {t("wizard.cancel")}
            </button>
            <button
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-full text-xs font-medium hover:bg-blue-600 transition-all shadow-sm"
              type="button"
              onClick={handleSave}
            >
              <Check className="w-3 h-3" />
              {t("userModal.confirmSelection")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
