"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";

import { useTranslations } from "@/i18n/useTranslations";
import { suiteSuiteService, type User } from "@/services/suiteSuiteService";
import { useAuthStore } from "@/hooks/useAuthStore";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (users: User[]) => void;
  selectedUserIds: number[];
}

export function UserModal({ isOpen, onClose, onSave, selectedUserIds }: UserModalProps) {
  const t = useTranslations("campaigns");
  const { user } = useAuthStore();
  const [selectedIds, setSelectedIds] = useState<number[]>(selectedUserIds);
  const [availableSelection, setAvailableSelection] = useState<number[]>([]);
  const [selectedSelection, setSelectedSelection] = useState<number[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const orgId = user?.organization_id || user?.org_id;
      if (!orgId || !isOpen) return;

      try {
        setLoading(true);
        const fetchedUsers = await suiteSuiteService.getUnassignedUsers(orgId);
        setUsers(fetchedUsers || []);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user?.organization_id, user?.org_id, isOpen]);

  const availableUsers = users.filter((u) => !selectedIds.includes(u.id));
  const selectedUsers = users.filter((u) => selectedIds.includes(u.id));

  const handleAdd = () => {
    setSelectedIds([...selectedIds, ...availableSelection]);
    setAvailableSelection([]);
  };

  const handleRemove = () => {
    setSelectedIds(selectedIds.filter((id) => !selectedSelection.includes(id)));
    setSelectedSelection([]);
  };

  const handleSave = () => {
    const selectedUserObjects = users.filter((u) => selectedIds.includes(u.id));
    onSave(selectedUserObjects);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl">
      <ModalContent>
        <ModalHeader>{t("form.manuallyAddUsers")}</ModalHeader>
        <ModalBody>
          <div className="flex gap-4 items-center">
            {/* Available Users */}
            <div className="flex-1">
              <h6 className="text-sm font-medium mb-2">{t("form.availableUsers")}</h6>
              <select
                multiple
                value={availableSelection.map(String)}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, (option) => parseInt(option.value));

                  setAvailableSelection(values);
                }}
                className="w-full border border-gray-300 rounded-lg p-2 h-64 focus:ring-2 focus:ring-blue-500"
              >
                {loading ? (
                  <option disabled>Loading users...</option>
                ) : availableUsers.length === 0 ? (
                  <option disabled>No users available</option>
                ) : (
                  availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleAdd}
                isDisabled={availableSelection.length === 0}
                className="bg-blue-500 text-white"
              >
                →
              </Button>
              <Button
                onClick={handleRemove}
                isDisabled={selectedSelection.length === 0}
                className="bg-red-500 text-white"
              >
                ←
              </Button>
            </div>

            {/* Selected Users */}
            <div className="flex-1">
              <h6 className="text-sm font-medium mb-2">{t("form.selectedUsers")}</h6>
              <select
                multiple
                value={selectedSelection.map(String)}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, (option) => parseInt(option.value));

                  setSelectedSelection(values);
                }}
                className="w-full border border-gray-300 rounded-lg p-2 h-64 focus:ring-2 focus:ring-blue-500"
              >
                {selectedUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} variant="bordered">
            {t("wizard.cancel")}
          </Button>
          <Button onClick={handleSave} className="bg-blue-500 text-white">
            {t("form.done")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
