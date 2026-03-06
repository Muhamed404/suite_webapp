"use client";

import { useState } from "react";
import { Calendar, GripVertical, Info, CalendarCheck } from "lucide-react";
import { DatePicker } from "@heroui/date-picker";
import { parseDate } from "@internationalized/date";

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
  modulesList: Array<{
    id: number;
    title?: string;
    name?: string;
    code?: string;
    translations?: Array<{ name?: string }>;
  }>;
}

export function WizardStep6({
  formData,
  onChange,
  onGenerateSchedule,
  modulesList,
}: WizardStep6Props) {
  const t = useTranslations("campaigns");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
    <div>
      <div className="flex items-center gap-1.5 mb-4">
        <Calendar className="w-4 h-4 text-blue-500" />
        <h2 className="text-sm font-semibold text-[#051226]">{t("wizard.step6")}</h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Info Alert */}
        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <p className="text-[10px] text-blue-700">
            Dates are set in Step 1. Optionally schedule modules below.
          </p>
        </div>

        {/* Schedule Button */}
        <div>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-full text-xs font-medium hover:bg-blue-600 transition-all"
            type="button"
            onClick={onGenerateSchedule}
          >
            <CalendarCheck className="w-3 h-3" />
            <span>Schedule</span>
          </button>
        </div>

        {/* Schedule List */}
        {formData.schedules.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Modules (drag to reorder):</h4>
            <ul className="space-y-1">
              {formData.schedules.map((schedule, index) => (
                <li
                  key={index}
                  draggable
                  className={`flex items-center justify-between px-3 py-2 border rounded-lg text-xs text-gray-700 transition-all ${
                    draggedIndex === index
                      ? "opacity-40 bg-blue-50 border-blue-300"
                      : "bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50/30"
                  } cursor-grab active:cursor-grabbing`}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragStart={() => handleDragStart(index)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">
                      {index + 1}. {getModuleName(schedule.module_id)}
                    </span>
                  </div>
                  <DatePicker
                    aria-label={`Module ${index + 1} Start Date`}
                    className="w-40"
                    classNames={{
                      selectorButton: "h-7 min-w-7",
                    }}
                    granularity="day"
                    maxValue={formData.endDate ? parseDate(formData.endDate) : undefined}
                    minValue={formData.startDate ? parseDate(formData.startDate) : undefined}
                    size="sm"
                    value={schedule.start_date ? parseDate(schedule.start_date) : null}
                    onChange={(date) => {
                      const newSchedules = [...formData.schedules];

                      newSchedules[index].start_date = date ? date.toString() : "";
                      onChange("schedules", newSchedules);
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
