"use client";

import type { User } from "@/services/suiteSuiteService";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Info,
  Users,
  BookOpen,
  Award,
  BarChart,
  Calendar,
  CheckCircle,
} from "lucide-react";
import clsx from "clsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";
import { useModules } from "@/hooks/useQuiz";
import { CAMPAIGN_KEYS } from "@/hooks/useCampaigns";
import { suiteAwmService } from "@/services/suiteAwmService";
import { WizardStep1 } from "@/components/campaigns/wizard/WizardStep1";
import { WizardStep2 } from "@/components/campaigns/wizard/WizardStep2";
import { WizardStep3 } from "@/components/campaigns/wizard/WizardStep3";
import { WizardStep4 } from "@/components/campaigns/wizard/WizardStep4";
import { WizardStep5 } from "@/components/campaigns/wizard/WizardStep5";
import { WizardStep6 } from "@/components/campaigns/wizard/WizardStep6";
import { WizardStep7 } from "@/components/campaigns/wizard/WizardStep7";
import { UserModal } from "@/components/campaigns/wizard/UserModal";

interface FormData {
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
  enableVideoSkipping: boolean;
  visualInteractive: boolean;
  visualOthers: boolean;
  enableQuiz: boolean;
  enableCertificate: boolean;
  enableGames: boolean;
  enableMiscItems: boolean;
  enableDocuments: boolean;
  quizDependency: "short_videos" | "interactive_videos" | "custom";
  quizPassingThreshold: number;
  quizRetryThreshold: number;
  totalQuizzesPerModule: number;
  motionVideoWeight: number;
  interactiveContentWeight: number;
  documentWeight: number;
  gameWeight: number;
  miscWeight: number;
  brochureWeight: number;
  posterWeight: number;
  screensaverWeight: number;
  vrGameWeight: number;
  quizProgressWeight: number;
  schedules: Array<{ module_id: number; start_date: string }>;
}

interface CampaignDraftState {
  currentStep: number;
  formData: FormData;
}

const CAMPAIGN_DRAFT_STORAGE_KEY = "awaremagnus:create-campaign:draft";
const CAMPAIGN_DRAFT_PRESERVE_ONCE_KEY = "awaremagnus:create-campaign:draft:preserve-once";

export default function CreateCampaignPage() {
  const router = useRouter();
  const t = useTranslations("campaigns");
  const tDashboard = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    campaignName: "",
    description: "",
    startDate: "",
    endDate: "",
    gamified: false,
    departments: [],
    groups: [],
    manualUsers: [],
    modules: [],
    visualShortVideos: false,
    enableVideoSkipping: false,
    visualInteractive: false,
    visualOthers: false,
    enableQuiz: false,
    enableCertificate: false,
    enableGames: false,
    enableMiscItems: false,
    enableDocuments: false,
    quizDependency: "custom",
    quizPassingThreshold: 70,
    quizRetryThreshold: 3,
    totalQuizzesPerModule: 5,
    motionVideoWeight: 0,
    interactiveContentWeight: 0,
    documentWeight: 0,
    gameWeight: 0,
    miscWeight: 0,
    brochureWeight: 0,
    posterWeight: 0,
    screensaverWeight: 0,
    vrGameWeight: 0,
    quizProgressWeight: 0,
    schedules: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUserModal, setShowUserModal] = useState(false);
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);

  const { data: modulesData } = useModules();
  const modules = modulesData?.success && Array.isArray(modulesData.data) ? modulesData.data : [];

  useEffect(() => {
    try {
      const savedDraft = window.sessionStorage.getItem(CAMPAIGN_DRAFT_STORAGE_KEY);

      if (!savedDraft) return;

      const parsed = JSON.parse(savedDraft) as Partial<CampaignDraftState>;

      if (parsed.formData) {
        setFormData((prev) => ({ ...prev, ...parsed.formData }));
      }

      if (typeof parsed.currentStep === "number" && parsed.currentStep >= 1 && parsed.currentStep <= totalSteps) {
        setCurrentStep(parsed.currentStep);
      }
    } catch {
      window.sessionStorage.removeItem(CAMPAIGN_DRAFT_STORAGE_KEY);
    } finally {
      setIsDraftHydrated(true);
    }
  }, [totalSteps]);

  useEffect(() => {
    if (!isDraftHydrated) return;

    const draft: CampaignDraftState = {
      currentStep,
      formData,
    };

    window.sessionStorage.setItem(CAMPAIGN_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [currentStep, formData, isDraftHydrated]);

  useEffect(() => {
    return () => {
      const shouldPreserveOnce =
        window.sessionStorage.getItem(CAMPAIGN_DRAFT_PRESERVE_ONCE_KEY) === "1";

      if (shouldPreserveOnce) {
        window.sessionStorage.removeItem(CAMPAIGN_DRAFT_PRESERVE_ONCE_KEY);

        return;
      }

      window.sessionStorage.removeItem(CAMPAIGN_DRAFT_STORAGE_KEY);
    };
  }, []);

  const createMutation = useMutation({
    mutationFn: (payload: any) => suiteAwmService.createCampaign(payload),
    onSuccess: () => {
      window.sessionStorage.removeItem(CAMPAIGN_DRAFT_STORAGE_KEY);
      queryClient.invalidateQueries({ queryKey: CAMPAIGN_KEYS.campaigns() });
      console.log(t("form.saveSuccess"));
      router.push("/dashboard/launch-awareness/campaigns");
    },
    onError: () => {
      console.error(t("form.saveError"));
    },
  });

  const totalWeight = useMemo(() => {
    let total = 0;

    if (formData.visualShortVideos) total += formData.motionVideoWeight;
    if (formData.visualInteractive) total += formData.interactiveContentWeight;
    if (formData.visualOthers) {
      if (formData.enableDocuments) total += formData.documentWeight;
      if (formData.enableGames) total += formData.gameWeight;
      if (formData.enableMiscItems) {
        total += formData.brochureWeight;
        total += formData.posterWeight;
        total += formData.screensaverWeight;
        total += formData.vrGameWeight;
      }
    }
    if (formData.enableQuiz) total += formData.quizProgressWeight;

    return total;
  }, [formData]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.campaignName.trim()) newErrors.campaignName = t("form.fieldRequired");
        if (!formData.startDate) newErrors.startDate = t("form.fieldRequired");
        if (!formData.endDate) newErrors.endDate = t("form.fieldRequired");
        if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
          newErrors.endDate = t("form.endDateAfterStart");
        }
        break;
      case 2:
        if (
          formData.departments.length === 0 &&
          formData.groups.length === 0 &&
          formData.manualUsers.length === 0
        ) {
          newErrors.targets = t("form.atleastOneTarget");
        }
        break;
      case 3:
        if (formData.modules.length === 0) newErrors.modules = t("form.atleastOneModule");
        if (!formData.visualShortVideos && !formData.visualInteractive && !formData.visualOthers) {
          newErrors.visualLearning = t("form.atleastOneVisual");
        }
        break;
      case 4:
        if (formData.enableQuiz) {
          if (!formData.totalQuizzesPerModule || formData.totalQuizzesPerModule <= 0) {
            newErrors.totalQuizzesPerModule = t("form.fieldRequired");
          }
          if (!formData.quizPassingThreshold || formData.quizPassingThreshold <= 0) {
            newErrors.quizPassingThreshold = t("form.fieldRequired");
          }
          if (!formData.quizRetryThreshold || formData.quizRetryThreshold <= 0) {
            newErrors.quizRetryThreshold = t("form.fieldRequired");
          }
        }
        break;
      case 5:
        if (totalWeight !== 100) {
          newErrors.weights = t("form.weightMustEqual100", { total: totalWeight });
        }
        break;
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // clear any previous validation banner
      setFormErrorMessage(null);

      if (currentStep === totalSteps) {
        handleSubmit();
      } else {
        setCurrentStep((s) => s + 1);
      }
    } else {
      // show a visible validation banner instead of logging to console
      const msg = t("form.validationError");

      setFormErrorMessage(msg);
      // auto-hide after 4s
      window.setTimeout(() => setFormErrorMessage(null), 4000);
    }
  };

  const handlePrevious = () => setCurrentStep((s) => s - 1);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = () => {
    const payload = {
      campaign: {
        name: formData.campaignName,
        description: formData.description,
        start_date: formData.startDate,
        end_date: formData.endDate,
        enable_gamification: formData.gamified,
        enable_quiz: formData.enableQuiz,
        enable_certificate: formData.enableCertificate,
        enable_games: formData.enableGames,
        enable_misc_items: formData.enableMiscItems,
        enable_motion_videos: formData.visualShortVideos,
        enable_video_skipping: formData.enableVideoSkipping ? 1 : 0,
        enable_interactive_ispring: formData.visualInteractive,
        enable_documents: formData.enableDocuments,
        motion_video_weight: formData.motionVideoWeight,
        interactive_content_weight: formData.interactiveContentWeight,
        document_weight: formData.documentWeight,
        game_weight: formData.gameWeight,
        misc_weight: formData.miscWeight,
        brochure_weight: formData.brochureWeight,
        poster_weight: formData.posterWeight,
        screensaver_weight: formData.screensaverWeight,
        vr_game_weight: formData.vrGameWeight,
        quiz_progress_weight: formData.quizProgressWeight,
        quiz_passing_threhold_percentage: formData.quizPassingThreshold,
        quiz_retry_threshold: formData.quizRetryThreshold,
        total_number_of_quizzes_per_module: formData.totalQuizzesPerModule,
      },
      modules: formData.modules,
      departments: formData.departments,
      groups: formData.groups,
      invitees: formData.manualUsers.map((user) => ({
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        department_id: null,
        group_id: null,
      })),
      schedules: formData.schedules.length > 0 ? formData.schedules : undefined,
    };

    createMutation.mutate(payload);
  };

  const generateSchedule = () => {
    if (!formData.startDate || !formData.endDate || formData.modules.length === 0) {
      console.error(t("form.generateScheduleMissing"));

      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const days = Math.max(
      1,
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
    const interval = Math.floor(days / formData.modules.length);

    const schedules = formData.modules.map((moduleId, i) => {
      const date = new Date(start);

      date.setDate(start.getDate() + i * interval);

      return { module_id: moduleId, start_date: date.toISOString().split("T")[0] };
    });

    setFormData((prev) => ({ ...prev, schedules }));
    console.log("Schedule generated!");
  };

  const steps = [
    { id: 1, label: t("wizard.details"), icon: <Info className="w-4 h-4" /> },
    { id: 2, label: t("wizard.targetUsers"), icon: <Users className="w-4 h-4" /> },
    { id: 3, label: t("wizard.topicVisuals"), icon: <BookOpen className="w-4 h-4" /> },
    { id: 4, label: t("wizard.quizCertificate"), icon: <Award className="w-4 h-4" /> },
    { id: 5, label: t("wizard.contents"), icon: <BarChart className="w-4 h-4" /> },
    { id: 6, label: t("wizard.schedule"), icon: <Calendar className="w-4 h-4" /> },
    { id: 7, label: t("wizard.summary"), icon: <CheckCircle className="w-4 h-4" /> },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-3", isRtl && "text-right")}>
          <nav
            aria-label={t("wizard.breadcrumbAria")}
            className="flex flex-wrap items-center text-xs text-gray-500 mb-6 gap-1.5"
          >
            <Link className="hover:text-gray-700 transition" href="/dashboard/launch-awareness">
              {tDashboard("menu.launchAwareness")}
            </Link>
            <span className="text-gray-400">›</span>
            <Link
              className="hover:text-gray-700 transition"
              href="/dashboard/launch-awareness/campaigns"
            >
              {t("title")}
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-semibold text-gray-900">{t("createNew")}</span>
          </nav>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-hidden">
            <div className="p-4">
              {/* Progress */}
              <div className="wizard-progress flex justify-between mb-5 relative">
                {steps.map((step, index) => {
                  const isActive = currentStep === step.id;
                  const isDone = currentStep > step.id;

                  return (
                    <div
                      key={step.id}
                      className={clsx(
                        "wizard-progress-step step flex-1 text-center relative",
                        isActive && "active",
                        isDone && "done"
                      )}
                    >
                      <div
                        className={clsx(
                          "circle w-6 h-6 rounded-full text-[10px] font-medium flex items-center justify-center mx-auto relative z-10 transition-all",
                          isDone
                            ? "bg-blue-500 text-white"
                            : isActive
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-600"
                        )}
                      >
                        {isDone ? "✓" : step.id}
                      </div>
                      <p className="text-[10px] text-gray-600 mt-1">{step.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Step Content */}
              {formErrorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {formErrorMessage}
                </div>
              )}
              <div className="min-h-[500px] mb-8">
                {currentStep === 1 && (
                  <WizardStep1 errors={errors} formData={formData} onChange={handleChange} />
                )}
                {currentStep === 2 && (
                  <WizardStep2
                    errors={errors}
                    formData={formData}
                    onChange={handleChange}
                    onOpenUserModal={() => setShowUserModal(true)}
                  />
                )}
                {currentStep === 3 && (
                  <WizardStep3 errors={errors} formData={formData} onChange={handleChange} />
                )}
                {currentStep === 4 && (
                  <WizardStep4 errors={errors} formData={formData} onChange={handleChange} />
                )}
                {currentStep === 5 && (
                  <WizardStep5 errors={errors} formData={formData} onChange={handleChange} />
                )}
                {currentStep === 6 && (
                  <WizardStep6
                    formData={formData}
                    modulesList={modules}
                    onChange={handleChange}
                    onGenerateSchedule={generateSchedule}
                  />
                )}
                {currentStep === 7 && <WizardStep7 formData={formData} modulesList={modules} />}
              </div>

              {/* Navigation Buttons */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2 justify-end">
                <button
                  className={clsx(
                    "flex items-center gap-1.5 px-12 py-2 bg-gray-100 text-gray-700 rounded-full text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                  )}
                  disabled={currentStep === 1}
                  type="button"
                  onClick={handlePrevious}
                >
                  {t("wizard.previous")}
                </button>
                <button
                  className="flex items-center gap-1.5 px-12 py-2 bg-blue-500 text-white rounded-full text-xs font-medium hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={createMutation.isPending && currentStep === totalSteps}
                  type="button"
                  onClick={handleNext}
                >
                  {currentStep === totalSteps ? (
                    <>
                      {createMutation.isPending && <span className="animate-spin">⟳</span>}
                      {t("wizard.finish")}
                    </>
                  ) : (
                    t("wizard.next")
                  )}
                </button>
              </div>
            </div>
          </div>

          <UserModal
            isOpen={showUserModal}
            selectedUserIds={formData.manualUsers.map((u) => u.id)}
            onClose={() => setShowUserModal(false)}
            onSave={(users) => handleChange("manualUsers", users)}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
