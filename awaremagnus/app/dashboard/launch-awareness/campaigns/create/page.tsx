"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { ArrowLeft, Info, Users, BookOpen, Award, BarChart, Calendar, CheckCircle } from "lucide-react";
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
  manualUsers: number[];
  modules: number[];
  visualShortVideos: boolean;
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

export default function CreateCampaignPage() {
  const router = useRouter();
  const t = useTranslations("campaigns");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

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

  const { data: modulesData } = useModules();
  const modules = modulesData?.success && Array.isArray(modulesData.data) ? modulesData.data : [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => suiteAwmService.createCampaign(payload),
    onSuccess: () => {
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
        if (!formData.campaignName.trim()) newErrors.campaignName = "Required";
        if (!formData.startDate) newErrors.startDate = "Required";
        if (!formData.endDate) newErrors.endDate = "Required";
        if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
          newErrors.endDate = "End date must be after start date";
        }
        break;
      case 2:
        if (formData.departments.length === 0 && formData.groups.length === 0 && formData.manualUsers.length === 0) {
          newErrors.targets = t("form.atleastOneTarget");
        }
        break;
      case 3:
        if (formData.modules.length === 0) newErrors.modules = t("form.atleastOneModule");
        if (!formData.visualShortVideos && !formData.visualInteractive && !formData.visualOthers) {
          newErrors.visualLearning = t("form.atleastOneVisual");
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
      if (currentStep === totalSteps) {
        handleSubmit();
      } else {
        setCurrentStep((s) => s + 1);
      }
    } else {
      console.error(t("form.validationError"));
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
      invitees: formData.manualUsers,
      schedules: formData.schedules.length > 0 ? formData.schedules : undefined,
    };

    createMutation.mutate(payload);
  };

  const generateSchedule = () => {
    if (!formData.startDate || !formData.endDate || formData.modules.length === 0) {
      console.error("Please set dates and select modules first");
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
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
        <div className={clsx("p-6", isRtl && "text-right")}>
          <div className="flex items-center gap-4 mb-6">
            <Button isIconOnly variant="light" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-semibold text-gray-800">{t("createNew")}</h1>
          </div>

          <Card className="rounded-3xl shadow">
            <CardBody className="p-8">
              {/* Progress */}
              <div className="flex justify-between mb-12 relative">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center flex-1 relative z-10">
                    {index < steps.length - 1 && (
                      <div
                        className={clsx(
                          "absolute top-4 left-1/2 h-1 -z-10 transition-all",
                          currentStep > step.id ? "bg-blue-500" : "bg-gray-200"
                        )}
                        style={{ width: "100%" }}
                      />
                    )}
                    <div
                      className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-all",
                        currentStep > step.id
                          ? "bg-green-500 text-white"
                          : currentStep === step.id
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-600"
                      )}
                    >
                      {currentStep > step.id ? "✓" : step.id}
                    </div>
                    <span
                      className={clsx(
                        "text-xs text-center max-w-[100px] transition-all",
                        currentStep >= step.id ? "text-blue-500 font-medium" : "text-gray-500"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <div className="min-h-[500px] mb-8">
                {currentStep === 1 && <WizardStep1 formData={formData} onChange={handleChange} errors={errors} />}
                {currentStep === 2 && (
                  <WizardStep2
                    formData={formData}
                    onChange={handleChange}
                    errors={errors}
                    onOpenUserModal={() => setShowUserModal(true)}
                  />
                )}
                {currentStep === 3 && <WizardStep3 formData={formData} onChange={handleChange} errors={errors} />}
                {currentStep === 4 && <WizardStep4 formData={formData} onChange={handleChange} />}
                {currentStep === 5 && <WizardStep5 formData={formData} onChange={handleChange} errors={errors} />}
                {currentStep === 6 && (
                  <WizardStep6
                    formData={formData}
                    onChange={handleChange}
                    onGenerateSchedule={generateSchedule}
                    modulesList={modules}
                  />
                )}
                {currentStep === 7 && <WizardStep7 formData={formData} modulesList={modules} />}
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t">
                <Button onClick={handlePrevious} isDisabled={currentStep === 1} variant="bordered" className="px-6">
                  {t("wizard.previous")}
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-blue-500 text-white px-8"
                  isLoading={createMutation.isPending && currentStep === totalSteps}
                >
                  {currentStep === totalSteps ? t("wizard.finish") : t("wizard.next")}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        <UserModal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          onSave={(userIds) => handleChange("manualUsers", userIds)}
          selectedUserIds={formData.manualUsers}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
