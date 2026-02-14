"use client";

import { useState } from "react";
import { Calendar, GripVertical } from "lucide-react";
import { Button } from "@heroui/button";

import { useTranslations } from "@/i18n/useTranslations";

interface WizardStep6Props {
  formData: {
    modules: number[];
    startDate: string;
    endDate: string;
    schedules: Array<{ module_id: number; start_date: string }>;
  };
  onChange: (field: string, value: any) => void;
  onGenerateSchedule: () => void;
  modulesList: Array<{ id: number; title?: string; name?: string; code?: string; translations?: Array<{ name?: string }> }>;
}

export function WizardStep6({ formData, onChange, onGenerateSchedule, modulesList }: WizardStep6Props) {
  const t = useTranslations("campaigns");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const getModuleName = (moduleId: number) => {
    const module = modulesList.find((m) => m.id === moduleId);

    return module?.title || module?.name || module?.translations?.[0]?.name || module?.code || `Module ${moduleId}`;
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSchedules = [...formData.schedules];
    const draggedItem = newSchedules[draggedIndex];
    newSchedules.splice(draggedIndex, 1);
    newSchedules.splice(index, 0, draggedItem);
    
    onChange("schedules", newSchedules);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <Calendar className="w-6 h-6 text-blue-500" />
        <span>{t("wizard.step6")}</span>
      </h2>

      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
        <p className="text-sm">{t("form.campaignDates")}</p>
      </div>

      <div>
        <Button onClick={onGenerateSchedule} className="bg-blue-500 text-white">
          {t("form.scheduleModules")}
        </Button>
      </div>

      {formData.schedules.length > 0 && (
        <div>
          <h6 className="text-sm font-medium mb-3">Module Schedule (Drag to reorder)</h6>
          <div className="space-y-2">
            {formData.schedules.map((schedule, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
                  draggedIndex === index
                    ? "bg-blue-100 opacity-50 scale-95"
                    : "bg-gray-50 hover:bg-gray-100"
                } cursor-move`}
              >
                <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="flex-1 text-sm font-medium">
                  {index + 1}. {getModuleName(schedule.module_id)}
                </span>
                <input
                  type="date"
                  value={schedule.start_date}
                  onChange={(e) => {
                    const newSchedules = [...formData.schedules];

                    newSchedules[index].start_date = e.target.value;
                    onChange("schedules", newSchedules);
                  }}
                  min={formData.startDate}
                  max={formData.endDate}
                  className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
