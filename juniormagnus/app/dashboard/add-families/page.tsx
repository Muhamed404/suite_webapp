"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { addToast } from "@heroui/toast";
import { useMutation, useQuery } from "@tanstack/react-query";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { createFamilyBatch } from "@/services/familyBatchService";
import { suiteSuiteService } from "@/services/suiteSuiteService";
import { useAuthStore } from "@/hooks/useAuthStore";

export default function AddFamiliesPage() {
  const orgId = useAuthStore((s) => s.user?.org_id ?? s.user?.organization_id) ?? 0;
  const [name, setName] = useState("Cybersafe Families");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const { data: departments } = useQuery({
    queryKey: ["suite-departments"],
    queryFn: () => suiteSuiteService.getDepartments(),
  });

  const { data: groups } = useQuery({
    queryKey: ["suite-groups", orgId],
    queryFn: () => suiteSuiteService.getGroups(orgId),
    enabled: orgId > 0,
  });

  const createMutation = useMutation({
    mutationFn: createFamilyBatch,
    onSuccess: () => {
      addToast({ title: "Family list queued", description: "Users are being imported and invitations will be sent.", color: "success" });
    },
    onError: (e: Error) => addToast({ title: "Failed", description: e.message, color: "danger" }),
  });

  const handleSubmit = () => {
    createMutation.mutate({
      name: name.trim(),
      department_ids: selectedDepartments.map((id) => Number(id)),
      group_ids: selectedGroups.map((id) => Number(id)),
    });
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-3">
          <div className="mx-auto max-w-3xl space-y-6 rounded-xl border border-[var(--strokeGray)] bg-white p-6 shadow-sm">
            <h1 className="text-base font-semibold text-[var(--mainblue)]">Add Cybersafe Families</h1>
            <p className="text-sm text-[var(--darkgray)]">
            Select departments and groups to bulk-add Cybersafe families. Invitations are sent through the Suite email service.
          </p>
          <Input label="Batch name" value={name} onValueChange={setName} />
          <Select
            label="Departments"
            selectionMode="multiple"
            selectedKeys={selectedDepartments}
            onSelectionChange={(keys) => setSelectedDepartments(Array.from(keys as Set<string>))}
          >
            {(departments ?? []).map((d: { id: number; name: string }) => (
              <SelectItem key={String(d.id)}>{d.name}</SelectItem>
            ))}
          </Select>
          <Select
            label="Groups"
            selectionMode="multiple"
            selectedKeys={selectedGroups}
            onSelectionChange={(keys) => setSelectedGroups(Array.from(keys as Set<string>))}
          >
            {(groups ?? []).map((g: { id: number; name: string }) => (
              <SelectItem key={String(g.id)}>{g.name}</SelectItem>
            ))}
          </Select>
          <div className="flex justify-end gap-3">
            <Button
              className="rounded-full bg-[var(--primary-color)] text-white font-medium"
              isLoading={createMutation.isPending}
              onPress={handleSubmit}
            >
              Add list &amp; send invitations
            </Button>
          </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
