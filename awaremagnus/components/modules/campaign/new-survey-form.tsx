"use client";

import type { SupportedLanguageId } from "@/utils/supportedLanguages";
import type { Department, Group } from "@/services/suiteSuiteService";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker } from "@heroui/date-picker";
import { today, getLocalTimeZone, type DateValue } from "@internationalized/date";
import { Spinner } from "@heroui/spinner";
import { Checkbox, CheckboxGroup } from "@heroui/checkbox";
import clsx from "clsx";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Users,
  HelpCircle,
  CalendarDays,
} from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useCreateSurvey, useSurveyQuestions } from "@/hooks/useSurvey";
import { useCategories } from "@/hooks/useSuiteAwm";
import { suiteSuiteService } from "@/services/suiteSuiteService";
import { surveyService } from "@/services/surveyService";
import { SUPPORTED_LANGUAGES, LANGUAGE_FLAGS } from "@/utils/supportedLanguages";

const STEPS = [
  { id: 1, label: "Survey Details", icon: FileText },
  { id: 2, label: "Target Audience", icon: Users },
  { id: 3, label: "Add Questions by Category", icon: HelpCircle },
];

const QUIZ_TYPES = [
  { id: 1, name: "True/False", description: "Simple true or false questions" },
  { id: 2, name: "Single Choice", description: "One correct answer from multiple options" },
  { id: 3, name: "Multiple Answers", description: "Multiple correct answers allowed" },
];

export function NewSurveyForm() {
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const router = useRouter();
  const { user } = useAuthStore();
  const createSurvey = useCreateSurvey();

  const [currentStep, setCurrentStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isValidatingQuestions, setIsValidatingQuestions] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  // Step 1: Survey Details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [langId, setLangId] = useState<string>("1");
  const [startDate, setStartDate] = useState<DateValue | null>(null);
  const [deadline, setDeadline] = useState<DateValue | null>(null);
  const [maxQuestions, setMaxQuestions] = useState<string>("");

  // Step 2: Target Audience
  const [departments, setDepartments] = useState<Department[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // Step 3: Quiz Type
  const [quesTypeId, setQuesTypeId] = useState<number>(2);

  // Step 4: Categories
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Fetch questions for selected categories and quiz type to show preview
  const { data: previewQuestions = [], isLoading: previewQuestionsLoading } = useSurveyQuestions(
    {
      // We can only pass one category_id to the endpoint based on the hook signature,
      // but the user wants to see all questions for all selected categories.
      // Since the API might not support multiple category_ids or omitting category_id
      // to fetch all (and then filter locally), we will fetch them manually if needed,
      // or we'd just pass undefined to get all and filter locally.
      // Let's pass undefined for category_id to fetch all questions for the org and ques_type,
      // then filter them locally based on selectedCategoryIds.
      ques_type_id: quesTypeId,
      org_id: user?.organization_id ?? user?.org_id,
    },
    selectedCategoryIds.length > 0
  );

  // Filter questions based on selected categories
  const filteredPreviewQuestions = previewQuestions.filter(
    (q) => q.category_id && selectedCategoryIds.includes(String(q.category_id))
  );

  // Fetch departments and groups
  useEffect(() => {
    const orgId = user?.organization_id ?? user?.org_id;

    if (orgId === undefined || orgId === null) return;

    setLoadingDepts(true);
    suiteSuiteService
      .getDepartments(orgId)
      .then((data) => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => setDepartments([]))
      .finally(() => setLoadingDepts(false));

    setLoadingGroups(true);
    suiteSuiteService
      .getGroups(orgId)
      .then((data) => setGroups(Array.isArray(data) ? data : []))
      .catch(() => setGroups([]))
      .finally(() => setLoadingGroups(false));
  }, [user]);

  // Check if max questions limit is exceeded
  useEffect(() => {
    if (currentStep === 3 && maxQuestions && filteredPreviewQuestions.length > Number(maxQuestions)) {
      setLimitError(`Number of questions (${filteredPreviewQuestions.length}) exceeds the maximum limit (${maxQuestions}).`);
    } else {
      setLimitError(null);
    }
  }, [currentStep, maxQuestions, filteredPreviewQuestions.length]);

  // Validation
  const validateStep = useCallback(
    (step: number): boolean => {
      setFormError(null);
      switch (step) {
        case 1:
          if (!name.trim()) {
            setFormError("Survey name is required");

            return false;
          }

          return true;
        case 2:
          if (selectedDeptIds.length === 0 && selectedGroupIds.length === 0) {
            setFormError("Select at least one department or group");

            return false;
          }

          return true;
        case 3:
          if (selectedCategoryIds.length === 0) {
            setFormError("Select at least one category");

            return false;
          }

          return true;
        default:
          return true;
      }
    },
    [name, selectedDeptIds, selectedGroupIds, selectedCategoryIds]
  );

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, 3));
    }
  };

  const handleBack = () => {
    setFormError(null);
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    if (limitError) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setFormError(null);
    setFormSuccess(null);
    setIsValidatingQuestions(true);

    try {
      // Check if selected categories have questions for the selected quiz type
      let hasQuestions = false;

      // Iterate over selected categories to see if any contain questions for this quiz type
      for (const categoryId of selectedCategoryIds) {
        const questions = await surveyService.getSurveyQuestions({
          category_id: Number(categoryId),
          ques_type_id: quesTypeId,
        });

        if (questions && questions.length > 0) {
          hasQuestions = true;
          break;
        }
      }

      if (!hasQuestions) {
        setFormError(
          "No questions found for the selected categories and quiz type combination. Survey cannot be created."
        );
        setIsValidatingQuestions(false);

        return;
      }
      await createSurvey.mutateAsync({
        survey: {
          name: name.trim(),
          description: description.trim() || undefined,
          lang_id: Number(langId),
          ques_type_id: quesTypeId,
          start_date: startDate ? startDate.toString() : undefined,
          deadline: deadline ? deadline.toString() : undefined,
          max_questions: maxQuestions ? Number(maxQuestions) : undefined,
        },
        category_ids: selectedCategoryIds.map(Number),
        departments: selectedDeptIds.map(Number),
        groups: selectedGroupIds.map(Number),
      });

      setFormSuccess("Survey created successfully! Redirecting...");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: any) {
      setFormError(err?.message ?? "Failed to create survey");
      setIsValidatingQuestions(false);
    }
  };

  const isSubmitting = createSurvey.isPending || isValidatingQuestions;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-6 max-w-5xl mx-auto", isRtl && "text-right")}>
          {/* Back */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              isIconOnly
              as={Link}
              className="bg-white border border-gray-200"
              href="/dashboard/survey"
              radius="full"
              size="sm"
              variant="flat"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-bold text-gray-900">New Survey</h2>
          </div>

          {/* ── Stepper ─────────────────────────────────── */}
          <div className="flex items-center justify-center mb-8">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={clsx(
                        "w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                        isCompleted && "bg-green-500 text-white shadow-lg shadow-green-500/25",
                        isActive &&
                          "bg-blue-500 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-100",
                        !isCompleted && !isActive && "bg-gray-100 text-gray-400"
                      )}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span
                      className={clsx(
                        "text-[10px] mt-1.5 font-medium",
                        isActive
                          ? "text-blue-600"
                          : isCompleted
                            ? "text-green-600"
                            : "text-gray-400"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={clsx(
                        "w-20 h-0.5 mx-2 mt-[-16px] rounded-full transition-all duration-300",
                        isCompleted ? "bg-green-400" : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Error / Success */}
          {(formError || limitError) && (
            <div ref={errorRef} className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {formError || limitError}
            </div>
          )}
          {formSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600">
              {formSuccess}
            </div>
          )}

          {/* ── Step Content ────────────────────────────── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm min-h-[360px]">
            {/* STEP 1: Survey Details */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Survey Details</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Enter the basic information for your survey
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Survey Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      classNames={{
                        inputWrapper:
                          "h-10 bg-white border border-gray-200 rounded-xl hover:border-gray-300 focus-within:!border-blue-500",
                        input: "text-sm",
                      }}
                      placeholder="e.g. Security Awareness Assessment"
                      value={name}
                      onValueChange={setName}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Language</label>
                    <Select
                      aria-label="Language"
                      classNames={{
                        trigger:
                          "h-10 bg-white border border-gray-200 rounded-xl hover:border-gray-300",
                        value: "text-sm",
                      }}
                      selectedKeys={[langId]}
                      onSelectionChange={(keys) => {
                        const v = Array.from(keys as Set<string>)[0];

                        if (v) setLangId(v);
                      }}
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={String(lang.id)} textValue={lang.name}>
                          <span className="flex items-center gap-2">
                            <span>{LANGUAGE_FLAGS[lang.id as SupportedLanguageId]}</span>
                            <span>{lang.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Description
                  </label>
                  <Textarea
                    classNames={{
                      inputWrapper:
                        "bg-white border border-gray-200 rounded-xl hover:border-gray-300 focus-within:!border-blue-500",
                      input: "text-sm",
                    }}
                    minRows={3}
                    placeholder="Describe this survey..."
                    value={description}
                    onValueChange={setDescription}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" /> Start Date
                    </label>
                    <DatePicker
                      aria-label="Start Date"
                      className="w-full"
                      classNames={{
                        selectorButton: "h-8 min-w-8",
                      }}
                      granularity="day"
                      minValue={today(getLocalTimeZone()) as any}
                      value={startDate as any}
                      onChange={setStartDate as any}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" /> Deadline
                    </label>
                    <DatePicker
                      aria-label="Deadline"
                      className="w-full"
                      classNames={{
                        selectorButton: "h-8 min-w-8",
                      }}
                      granularity="day"
                      minValue={(startDate || today(getLocalTimeZone())) as any}
                      value={deadline as any}
                      onChange={setDeadline as any}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Max Questions
                    </label>
                    <Input
                      classNames={{
                        inputWrapper:
                          "h-10 bg-white border border-gray-200 rounded-xl hover:border-gray-300 focus-within:!border-blue-500",
                        input: "text-sm",
                      }}
                      placeholder="e.g. 20"
                      type="number"
                      value={maxQuestions}
                      onValueChange={setMaxQuestions}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Target Audience */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Target Audience</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Select departments and/or groups to target for this survey
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Departments */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" /> Departments
                    </h4>
                    <div className="border border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto space-y-2">
                      {loadingDepts ? (
                        <div className="flex items-center justify-center py-8">
                          <Spinner size="sm" />
                        </div>
                      ) : departments.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">
                          No departments found
                        </p>
                      ) : (
                        <CheckboxGroup value={selectedDeptIds} onChange={setSelectedDeptIds as any}>
                          {departments.map((dept) => (
                            <Checkbox
                              key={dept.id}
                              classNames={{
                                label: "text-xs text-gray-700",
                                wrapper: "before:border-gray-300",
                              }}
                              value={String(dept.id)}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{dept.name}</span>
                                {dept.user_count !== undefined && (
                                  <span className="text-[10px] text-gray-400 ml-2">
                                    {dept.user_count} users
                                  </span>
                                )}
                              </div>
                            </Checkbox>
                          ))}
                        </CheckboxGroup>
                      )}
                    </div>
                  </div>

                  {/* Groups */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-500" /> Groups
                    </h4>
                    <div className="border border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto space-y-2">
                      {loadingGroups ? (
                        <div className="flex items-center justify-center py-8">
                          <Spinner size="sm" />
                        </div>
                      ) : groups.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">No groups found</p>
                      ) : (
                        <CheckboxGroup
                          value={selectedGroupIds}
                          onChange={setSelectedGroupIds as any}
                        >
                          {groups.map((group) => (
                            <Checkbox
                              key={group.id}
                              classNames={{
                                label: "text-xs text-gray-700",
                                wrapper: "before:border-gray-300",
                              }}
                              value={String(group.id)}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{group.name}</span>
                                {group.user_count !== undefined && (
                                  <span className="text-[10px] text-gray-400 ml-2">
                                    {group.user_count} users
                                  </span>
                                )}
                              </div>
                            </Checkbox>
                          ))}
                        </CheckboxGroup>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <span className="text-xs text-gray-500">
                    Selected: {selectedDeptIds.length} departments, {selectedGroupIds.length} groups
                  </span>
                </div>
              </div>
            )}

            {/* STEP 3: Quiz Type & Categories */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Quiz Type</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Select the question type for this survey
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {QUIZ_TYPES.map((qt) => (
                      <button
                        key={qt.id}
                        className={clsx(
                          "p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md",
                          quesTypeId === qt.id
                            ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        )}
                        type="button"
                        onClick={() => setQuesTypeId(qt.id)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={clsx(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                              quesTypeId === qt.id ? "border-blue-500" : "border-gray-300"
                            )}
                          >
                            {quesTypeId === qt.id && (
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <span className="font-medium text-sm text-gray-800">{qt.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 ml-8">{qt.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Add Questions by Category
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Select categories to include questions from. Questions will be randomly selected
                    from these categories.
                  </p>

                  {categoriesLoading ? (
                    <div className="flex justify-center py-8">
                      <Spinner size="md" />
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-xl p-4 max-h-80 overflow-y-auto">
                      <CheckboxGroup
                        value={selectedCategoryIds}
                        onChange={setSelectedCategoryIds as any}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {(categories as any[]).map((cat: any) => (
                            <Checkbox
                              key={cat.id}
                              classNames={{
                                base: clsx(
                                  "p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all cursor-pointer max-w-full",
                                  selectedCategoryIds.includes(String(cat.id)) &&
                                    "bg-blue-50 border-blue-200"
                                ),
                                label: "text-xs text-gray-700 font-medium",
                                wrapper: "before:border-gray-300",
                              }}
                              value={String(cat.id)}
                            >
                              {cat.name}
                            </Checkbox>
                          ))}
                        </div>
                      </CheckboxGroup>
                    </div>
                  )}
                </div>

                {/* Preview Questions */}
                {selectedCategoryIds.length > 0 && (
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className={clsx("text-sm font-semibold text-gray-800 mb-2", !!limitError && "text-red-600")}>
                      Available Questions ({filteredPreviewQuestions.length})
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">
                      These questions belong to the selected categories and match the chosen quiz
                      type.
                    </p>

                    {previewQuestionsLoading ? (
                      <div className="flex justify-center py-4">
                        <Spinner size="sm" />
                      </div>
                    ) : filteredPreviewQuestions.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">
                        No questions found for the selected categories.
                      </p>
                    ) : (
                      <div className="border border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto space-y-3">
                        {filteredPreviewQuestions.map((q, idx) => (
                          <div
                            key={q.id}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                          >
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              {idx + 1}. {q.question}
                            </p>
                            {q.category && (
                              <span className="inline-block px-2 py-1 bg-gray-200 text-gray-600 text-[10px] rounded-md mt-1">
                                {q.category.name}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Navigation Buttons */}
          <div className="flex justify-between items-center mt-6">
            <Button
              className="border-gray-200 text-gray-600 px-6"
              isDisabled={currentStep === 1 || isSubmitting}
              radius="full"
              startContent={<ArrowLeft className="w-4 h-4" />}
              variant="bordered"
              onPress={handleBack}
            >
              Back
            </Button>

            {currentStep < 3 ? (
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white px-8"
                endContent={<ArrowRight className="w-4 h-4" />}
                radius="full"
                onPress={handleNext}
              >
                Next
              </Button>
            ) : (
              <Button
                className="bg-green-500 hover:bg-green-600 text-white px-8"
                isLoading={isSubmitting}
                radius="full"
                startContent={!isSubmitting && <Check className="w-4 h-4" />}
                onPress={handleSubmit}
              >
                {isValidatingQuestions
                  ? "Validating..."
                  : isSubmitting
                    ? "Creating Survey..."
                    : "Finish & Launch"}
              </Button>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
