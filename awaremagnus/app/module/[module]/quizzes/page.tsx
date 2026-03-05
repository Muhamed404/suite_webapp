"use client";

import { useState, useEffect, useRef, useMemo, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Search, ChevronRight, ChevronLeft, ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuthStore } from "@/hooks/useAuthStore";
import { isOrgUser } from "@/utils/roles";
import { useQuizzesByContent, useModule } from "@/hooks/useQuiz";
import { suiteAwmService } from "@/services/suiteAwmService";
import { quizService } from "@/services/quizService";
import { breadcrumbLinkClassName } from "@/components/modules/training-library/shared-styles";
import { getModuleAssetUrl } from "@/utils/contentAssetUrl";

export default function QuizzesPage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = use(params);
  const moduleName = module.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Convert slug to title
  const t = useTranslations("module");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read content_id from URL params
  const contentId = useMemo(() => {
    const cid = searchParams?.get('content_id');
    return cid ? parseInt(cid, 10) : 0;
  }, [searchParams]);

  // Read campaign_id from URL params
  const campaignId = useMemo(() => {
    const cid = searchParams?.get('campaign_id');
    return cid ? parseInt(cid, 10) : 0;
  }, [searchParams]);

  const { data: campaignRes } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => suiteAwmService.getCampaignById(campaignId),
    enabled: !!campaignId,
  });

  const { data: contentRes } = useQuery({
    queryKey: ['content', contentId],
    queryFn: () => quizService.getContentById(contentId),
    enabled: !!contentId,
  });

  const { data: attemptRes } = useQuery<any>({
    queryKey: ['quiz-attempt', campaignId, contentRes?.data?.mod_id, contentId],
    queryFn: () => suiteAwmService.getQuizAttemptDetail(
      campaignId,
      contentRes?.data?.mod_id!, 
      contentId
    ),
    enabled: !!campaignId && !!contentRes?.data?.mod_id && !!contentId,
  });

  // Fetch quizzes dynamically from the API
  const { data: quizzesRes, isLoading: quizzesLoading } = useQuizzesByContent(contentId, !!contentId);

  // Get module data for dynamic description
  // moduleId may be undefined initially; default to 0 so the hook always receives a number
  const moduleId = contentRes?.data?.mod_id ?? 0;
  const { data: moduleRes } = useModule(moduleId, !!moduleId);

  // Derive display values from the module's first translation (falling back gracefully)
  const moduleTranslation = moduleRes?.data?.translations?.[0];
  const triviaTitle = moduleTranslation?.name || moduleName;
  const triviaDescription = moduleTranslation?.description ?? moduleRes?.data?.description;
  const triviaBannerUrl = moduleTranslation?.logo_banner_url
    ? getModuleAssetUrl(moduleTranslation.logo_banner_url)
    : '/images/hero.svg';

  // Keep original quiz data for submission
  const originalQuizzes = useMemo(() => {
    if (!quizzesRes?.success || !Array.isArray(quizzesRes.data)) return [];
    return quizzesRes.data;
  }, [quizzesRes]);

  // Transform API data into the shape used by the UI
  const quizData = useMemo(() => {
    if (!quizzesRes?.success || !Array.isArray(quizzesRes.data)) return [];
    return quizzesRes.data.map((q, idx) => ({
      lesson: idx + 1,
      question: q.question,
      options: (q.answers ?? []).map((a) => a.answer_text),
      correct: (q.answers ?? []).findIndex((a) => a.is_correct),
      quizTypeName: q.quizType?.name ?? 'Single Choice',
      quizTypeId: q.quiz_type_id,
    }));
  }, [quizzesRes]);

 
  const threshold: number | null = (campaignRes as any)?.quiz_retry_threshold ?? null;

  const attemptsArr: any[] = Array.isArray(attemptRes) ? (attemptRes as any[]) : [];
  const attemptsMade = attemptsArr.length > 0 ? Math.max(...attemptsArr.map((q: any) => q.attempt_number || 0)) : 0;
  const attemptsLeft: number | null = threshold !== null ? Math.max(0, threshold - attemptsMade) : null;
  const noAttemptsLeft = attemptsLeft !== null && attemptsLeft <= 0;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number[] }>({});
  const [savedAnswers, setSavedAnswers] = useState<{ [key: number]: number[] }>({});
  const [showCompletion, setShowCompletion] = useState(false);
  const [answerStatusMsg, setAnswerStatusMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [moduleProgress, setModuleProgress] = useState<number | null>(null);

 
  useEffect(() => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setSavedAnswers({});
    setShowCompletion(false);
    setAnswerStatusMsg("");
    setIsSubmitting(false);
    setQuizResults([]);
    setModuleProgress(null);
  }, [quizData.length]);

  const quiz = quizData[currentQuestion];

  // Determine if the current question is single-choice (radio) or multi-choice (checkbox)
  const isSingleChoice = quiz
    ? !quiz.quizTypeName.toLowerCase().includes('multiple')
    : true;

  const progressPercentage = ((currentQuestion + 1) / quizData.length) * 100;

  const hasAnswer = selectedAnswers[currentQuestion]?.length > 0;
  const isSaved = savedAnswers[currentQuestion]?.length > 0;

  const toggleAnswer = (index: number) => {
    setSelectedAnswers(prev => {
      const current = prev[currentQuestion] || [];
      if (isSingleChoice) {
        // Radio behaviour: selecting a new option replaces the previous selection
        return { ...prev, [currentQuestion]: current[0] === index ? [] : [index] };
      }
      // Checkbox behaviour: toggle the option
      if (current.includes(index)) {
        return { ...prev, [currentQuestion]: current.filter(i => i !== index) };
      } else {
        return { ...prev, [currentQuestion]: [...current, index] };
      }
    });
  };

  const saveAnswer = () => {
    if (selectedAnswers[currentQuestion]?.length > 0) {
      setSavedAnswers(prev => ({ ...prev, [currentQuestion]: [...selectedAnswers[currentQuestion]] }));
      setAnswerStatusMsg('<span class="text-green-600 font-semibold">Answer saved successfully!</span>');
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setAnswerStatusMsg("");
    }
  };

  const goToNextQuestion = () => {
    if (!savedAnswers[currentQuestion] || savedAnswers[currentQuestion].length === 0) {
      setAnswerStatusMsg('<span class="text-red-600 font-semibold">Please save your answer first!</span>');
      return;
    }

    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setAnswerStatusMsg("");
      return;
    }

    // Check if all questions have been answered
    const allAnswered = quizData.every((_, index) => savedAnswers[index]?.length > 0);
    if (!allAnswered) {
      setAnswerStatusMsg('<span class="text-red-600 font-semibold">Please answer all questions before submitting!</span>');
      return;
    }

    // Check if no attempts left
    if (noAttemptsLeft) {
      setAnswerStatusMsg('<span class="text-red-600 font-semibold">You have no attempts left!</span>');
      return;
    }

    // Submit the quiz
    submitQuiz();
  };

  const goBackToQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setSavedAnswers({});
    setShowCompletion(false);
    setAnswerStatusMsg("");
    setIsSubmitting(false);
  };

  const handleCompletionGoBack = () => {
    if (user && isOrgUser(user.role_id)) {
      router.push('/dashboard/campaign-assignments');
    } else {
      goBackToQuiz();
    }
  };

  // Helper: Get quiz question text by quiz_id
  const getQuizQuestion = (quizId: number): string => {
    const quiz = originalQuizzes.find((q) => q.id === quizId);
    return quiz?.question || `Quiz ${quizId}`;
  };

  const submitQuiz = async () => {
    if (!contentRes?.data?.mod_id) {
      setAnswerStatusMsg('<span class="text-red-600 font-semibold">Module ID not found!</span>');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        campaign_id: campaignId,
        module_id: contentRes.data.mod_id,
        content_id: contentId,
        quizzes: originalQuizzes.map((quiz, index) => {
          const savedAnswerIndices = savedAnswers[index] || [];
          const answers = savedAnswerIndices.map(answerIndex => {
            const answer = quiz.answers?.[answerIndex];
            return {
              question_id: quiz.id, // Use the quiz id as question_id
              answer_id: answer?.id || 0
            };
          });
          return {
            quiz_id: quiz.id,
            answers
          };
        }).filter(quiz => quiz.answers.length > 0)
      };

      const response: any = await suiteAwmService.submitQuiz(payload);
     if (response?.quizResults) {
        setQuizResults(response.quizResults);
      } else {
        console.log('No quizResults found in response. Response structure:', response);
      }
      if (response?.moduleProgress) {
        console.log('Module Progress:', response.moduleProgress);
        setModuleProgress(parseFloat(response.moduleProgress));
      }
      setShowCompletion(true);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      setAnswerStatusMsg('<span class="text-red-600 font-semibold">Failed to submit quiz. Please try again.</span>');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flag-icons@6.7.0/css/flag-icons.min.css" />
        <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
        <style jsx>{`
          @keyframes softPop {
            0% {
              box-shadow: 0 0 0 rgba(59, 130, 246, 0.0);
            }
            60% {
              box-shadow: 0 8px 14px rgba(59, 130, 246, 0.2);
            }
            100% {
              box-shadow: 0 4px 10px rgba(59, 130, 246, 0.15);
            }
          }

          @keyframes ringWave {
            0% {
              opacity: 0.3;
              transform: scale(0.96);
            }
            50% {
              opacity: 0.6;
              transform: scale(1.02);
            }
            100% {
              opacity: 0.3;
              transform: scale(0.96);
            }
          }

          @keyframes checkDraw {
            0% {
              stroke-dashoffset: 30;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }

          .option-check {
            width: 16px;
            height: 16px;
            border: 1.5px solid #d1d5db;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: #fff;
            transition: border-color 0.2s ease, background-color 0.2s ease;
          }

          /* Single choice → circular (radio) */
          .option-check.is-radio {
            border-radius: 9999px;
          }

          /* Multiple choice → square (checkbox) */
          .option-check.is-checkbox {
            border-radius: 4px;
          }

          .option-check.is-checked {
            border-color: #3b82f6;
            background: #3b82f6;
            animation: softPop 0.35s ease;
          }

          .option-check svg {
            transition: opacity 0.2s ease;
          }

          .completion-ring {
            transform-origin: 50% 50%;
            animation: ringWave 1.6s ease-in-out infinite;
          }

          .completion-ring.delay {
            animation-delay: 0.2s;
          }

          .completion-check {
            stroke-dasharray: 60;
            stroke-dashoffset: 60;
            animation: checkDraw 0.9s ease-out forwards;
          }
        `}</style>
        <div className="flex-1 flex flex-col h-screen bg-[#F1F5F8] lg:m-2 lg:ml-0 overflow-hidden lg:rounded-r-3xl">

          <main className="flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3 p-3 pb-0">
              <Button isIconOnly variant="light" size="sm" onClick={() => router.back()} className="-mt-1">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <nav className={clsx("flex items-center text-xs text-gray-500 mb-2 gap-1.5 overflow-x-auto", isRtl && "flex-row-reverse")}>
                {isOrgUser(user?.role_id) ? (
                  <>
                    <Link href="/dashboard/campaign-assignments" className={breadcrumbLinkClassName}>
                      {t("moduleDetails.breadcrumbMyAssignments") ?? "My Assignments"}
                    </Link>
                    <span className="text-gray-400">›</span>
                    {campaignId && moduleId ? (
                      <Link href={`/module/${module}?campaign_id=${campaignId}`} className={breadcrumbLinkClassName}>
                        {triviaTitle}
                      </Link>
                    ) : (
                      <span>{triviaTitle}</span>
                    )}
                    <span className="text-gray-400">›</span>
                    <span className="font-semibold text-gray-900">{t("moduleDetails.quizzes") ?? "Quizzes"}</span>
                  </>
                ) : campaignId ? (
                  <>
                    <Link href="/dashboard/campaign-assignments" className={breadcrumbLinkClassName}>
                      {t("moduleDetails.breadcrumbAwarenessCampaign") ?? "Awareness Campaign"}
                    </Link>
                    <span className="text-gray-400">›</span>
                    <Link href={`/dashboard/campaign-assignments/${campaignId}`} className={breadcrumbLinkClassName}>
                      {campaignRes?.data?.name || 'Campaign'}
                    </Link>
                    <span className="text-gray-400">›</span>
                    <Link href={`/dashboard/campaign-assignments/${campaignId}/modules/${module}`} className={breadcrumbLinkClassName}>
                      {moduleName}
                    </Link>
                    {contentId ? (
                      <>
                        <span className="text-gray-400">›</span>
                        <Link href={`/dashboard/campaign-assignments/${campaignId}/modules/${module}/content/${contentId}`} className={breadcrumbLinkClassName}>
                          {contentRes?.data?.title || 'Content'}
                        </Link>
                      </>
                    ) : null}
                    <span className="text-gray-400">›</span>
                    <span className="font-semibold text-gray-900">{t("moduleDetails.quizzes") ?? "Quizzes"}</span>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard/training-library/my" className={breadcrumbLinkClassName}>
                      {t("moduleDetails.breadcrumbTrainingLibrary") ?? "Awareness Library"}
                    </Link>
                    <span className="text-gray-400">›</span>
                    <Link href={`/dashboard/training-library/my/${module}`} className={breadcrumbLinkClassName}>
                      {moduleName}
                    </Link>
                    <span className="text-gray-400">›</span>
                    <span className="font-semibold text-gray-900">{t("moduleDetails.quizzes") ?? "Quizzes"}</span>
                  </>
                )}
              </nav>
            </div>

            <div className="grid grid-cols-12 gap-2 p-3 pb-0">
              {/* Main Content */}
              <div className="col-span-9">
                {quizzesLoading ? (
                  <div className="bg-white rounded-2xl p-6 flex items-center justify-center min-h-[300px]">
                    <p className="text-sm text-gray-500">Loading quizzes...</p>
                  </div>
                ) : quizData.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 flex items-center justify-center min-h-[300px]">
                    <p className="text-sm text-gray-500">No quizzes available for this content.</p>
                  </div>
                ) : !showCompletion ? (
                  <div id="quizContainer" className="bg-white rounded-2xl p-3 w-full">
                    <div className="mb-2 flex items-center gap-3">
                      <p className="text-[10px] text-blue-500" id="lessonInfo">Lesson {quiz.lesson} Of {quizData.length}</p>
                      <p className="text-sm text-gray-300 font-light">|</p>
                      <p className="text-[10px] text-green-500">{quiz.quizTypeName}</p>
                    </div>

                    <h1 className="text-lg font-semibold text-gray-900 mb-3">{moduleName} Quiz</h1>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden mr-2">
                          <div className="progress-indicator h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                        <span className="text-xs font-semibold text-gray-700" id="progressText">{currentQuestion + 1}/{quizData.length}</span>
                      </div>
                    </div>

                    {/* Question */}
                    <div className="mb-4">
                      <p className="text-base text-gray-900">
                        <span className="font-semibold">Question :</span> <span id="questionText" className="text-gray-600">{quiz.question}</span>
                      </p>
                    </div>

                    {/* Options */}
                    <div className="space-y-2 mb-8" id="optionsContainer">
                      {quiz.options.map((option, index) => {
                        const isChecked = selectedAnswers[currentQuestion]?.includes(index) || false;
                        const shapeClass = isSingleChoice ? 'is-radio' : 'is-checkbox';
                        return (
                          <label key={index} className="flex items-center gap-2 cursor-pointer">
                            <span className={`option-check ${shapeClass} ${isChecked ? 'is-checked' : ''}`}>
                              {isSingleChoice ? (
                                // Radio inner dot
                                <span
                                  className={`block rounded-full bg-white transition-all duration-200 ${isChecked ? 'w-[6px] h-[6px] opacity-100' : 'w-0 h-0 opacity-0'}`}
                                />
                              ) : (
                                // Checkbox checkmark
                                <svg className={`${isChecked ? 'opacity-100' : 'opacity-0'}`} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </span>
                            <input
                              type={isSingleChoice ? 'radio' : 'checkbox'}
                              name={`question-${currentQuestion}`}
                              value={index}
                              checked={isChecked}
                              onChange={() => toggleAnswer(index)}
                              className="hidden"
                            />
                            <div className={`flex-1 border rounded-lg px-2 py-1.5 transition-colors duration-200 text-xs ${isChecked ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300 text-gray-700'}`}>
                              <span className="font-medium">{option}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {/* Save Answer Button */}
                    <div className="flex items-center justify-between mb-12">
                      <p id="answerStatusMsg" className="text-xs text-gray-500 h-4" dangerouslySetInnerHTML={{ __html: answerStatusMsg }}></p>
                      <button
                        className={`w-48 hover:opacity-90 text-white font-semibold px-12 py-2 text-xs rounded-full transition ${isSaved ? "bg-green-500 hover:bg-green-600" : hasAnswer ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-300 cursor-not-allowed"}`}
                        id="saveAnswerBtn"
                        disabled={!hasAnswer}
                        onClick={saveAnswer}
                      >
                        {isSaved ? "✓ Answer Saved" : "Save Answer"}
                      </button>
                    </div>

                    {/* Attempts Message */}
                    {noAttemptsLeft && (
                      <div className="mb-4 text-center">
                        <p className="text-red-600 font-semibold text-sm">You have no attempts left!</p>
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-2 justify-end mb-20">
                      <button
                        className="px-12 py-2 border border-gray-300 text-gray-700 font-medium text-xs rounded-full hover:bg-gray-100 transition"
                        id="prevBtn"
                        onClick={goToPreviousQuestion}
                        disabled={currentQuestion === 0}
                        style={{ opacity: currentQuestion === 0 ? 0.5 : 1 }}
                      >
                        Previous
                      </button>
                      <button
                        className={`flex items-center gap-1.5 px-12 py-2 rounded-full text-xs font-medium transition-all ${noAttemptsLeft ? 'bg-gray-300 border border-gray-300 text-gray-500 cursor-not-allowed' : 'bg-transparent border border-blue-500 text-blue-800 hover:bg-blue-600 hover:text-white'}`}
                        id="nextBtn"
                        onClick={goToNextQuestion}
                        disabled={isSubmitting || noAttemptsLeft}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Submitting...
                          </>
                        ) : (
                          currentQuestion === quizData.length - 1 ? (noAttemptsLeft ? "No Attempts Left" : "Submit Quiz") : "Next Quiz"
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Completion Screen */
                  <div id="completionContainer" className="bg-white rounded-2xl p-6 min-h-full flex flex-col items-center justify-center opacity-100 translate-y-0 transition-all duration-500 ease-out">
                    <div id="completionIcon" className="flex justify-center mb-4 transition-transform duration-500 ease-out scale-100">
                      <div className="relative w-24 h-24">
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 120">
                          <circle className="completion-ring" cx="60" cy="60" r="55" fill="none" stroke="#D1E9F6" strokeWidth="3" />
                          <circle className="completion-ring delay" cx="60" cy="60" r="45" fill="none" stroke="#99D5E8" strokeWidth="2" />
                          <circle cx="60" cy="60" r="35" fill="#10B981" />
                          <path className="completion-check" d="M 43 62 L 55 72 L 78 50" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>

                    <div id="completionText" className="transition-all duration-500 ease-out opacity-100 translate-y-0 text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">Congratulations!</h2>
                      <p className="text-xs text-gray-600 mb-4">You have passed the quiz test successfully</p>
                    </div>

                    {/* Quiz Results Summary */}
                    {quizResults.length > 0 && (
                      <div className="w-full mb-6 max-w-lg">
                        {/* Module Progress Header */}
                        {moduleProgress !== null && (
                          <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-gray-700">Module Progress</span>
                              <span className="text-sm font-bold text-green-600">{moduleProgress.toFixed(2)}%</span>
                            </div>
                            <div className="w-full h-3 bg-green-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500" style={{ width: `${Math.min(100, moduleProgress)}%` }} />
                            </div>
                          </div>
                        )}

                        {/* Performance Summary Header */}
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-900">Quiz Performance Summary</h3>
                          <div className="text-xs text-gray-500">Overall Score
                            <span className="ml-2 font-semibold text-gray-900">{Math.round((quizResults.reduce((s, r) => s + (Number(r.score) || 0), 0) / quizResults.length) || 0)}%</span>
                          </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div className="space-y-3">
                            {quizResults.map((result, idx) => (
                              <div key={idx} className={`flex items-center gap-3 rounded-lg p-3 border shadow-sm transition-all ${result.passed ? 'bg-white border-green-100' : 'bg-white border-red-100'}`}>
                              <div className={`${result.passed ? 'bg-green-50' : 'bg-red-50'} w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}> 
                                {result.passed ? (
                                  <svg className="w-5 h-5 text-green-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 6.293a1 1 0 00-1.414-1.414L8 12.172 4.707 8.879a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8z" clipRule="evenodd"/></svg>
                                ) : (
                                  <svg className="w-5 h-5 text-red-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 text-left">
                                  <p className="text-sm font-medium text-gray-800 truncate flex-1 text-left">{getQuizQuestion(result.quiz_id)}</p>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className={`text-sm font-semibold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>{result.score}%</div>
                                    <span className="text-[10px] text-gray-500 px-2 py-0.5 bg-gray-100 rounded">Threshold: {result.passing_threshold}%</span>
                                  </div>
                                </div>
                                <div className="mt-1 flex items-center justify-between text-xs text-gray-600">
                                  <div className="font-medium">{result.correct_answers}/{result.total_questions} correct</div>
                                  <div className="flex gap-3">
                                    <span>Attempt: <span className="font-semibold text-gray-800">{result.attempt_number}</span></span>
                                    <span>Remaining: <span className="font-semibold text-gray-800">{result.attempts_remaining}</span></span>
                                  </div>
                                </div>
                                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-full ${result.passed ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(100, Number(result.score) || 0)}%` }} />
                                </div>
                              </div>
                            </div>
                          ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div id="completionActions" className="flex flex-col gap-2 max-w-xs w-full transition-all duration-500 ease-out opacity-100 translate-y-0">
                      <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1.5 px-4 text-xs rounded-full transition" id="viewReportBtn" onClick={() => router.push('/dashboard/my-report-card')}>
                        View Report
                      </button>
                      <button className="border border-gray-300 text-gray-700 font-semibold py-1.5 px-4 text-xs rounded-full hover:bg-gray-50 transition" id="goBackBtn" onClick={handleCompletionGoBack}>
                        Go Back
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar */}
              <div className="col-span-3">
                {/* Quiz Status Card */}
                <div className="bg-white rounded-2xl p-4 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Status</h3>
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-3xl font-semibold text-gray-900">
                      <span id="statusCount">{String(currentQuestion + 1).padStart(2, "0")}</span>/<span id="totalCount">{String(quizData.length).padStart(2, "0")}</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      <span id="completedCount">{currentQuestion + 1}</span> out of <span id="totalQuizCount">{quizData.length}</span> quizzes are done
                    </p>
                    {threshold !== null && threshold > 0 && (
                      <p className={`text-sm mt-2 ${noAttemptsLeft ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                        Attempts left: {attemptsLeft}
                      </p>
                    )}
                  </div>
                </div>

                {/* Trivia Card */}
                <div className="bg-white rounded-2xl p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">{triviaTitle}</h4>
                  <img
                    src={triviaBannerUrl}
                    alt={triviaTitle}
                    className="w-full rounded-lg mb-4"
                    onError={(e) => { 
                      const img = e.currentTarget as HTMLImageElement;
                      if (!img.src.includes('data:image')) {
                        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="18" fill="%239ca3af"%3EImage Not Available%3C/text%3E%3C/svg%3E';
                      }
                    }}
                  />
                  {triviaDescription && (
                    <p className="text-[10px] text-gray-600 leading-relaxed">{triviaDescription}</p>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
        <script dangerouslySetInnerHTML={{
          __html: `
            if (window.lucide) {
              lucide.createIcons();
            }
          `
        }} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}