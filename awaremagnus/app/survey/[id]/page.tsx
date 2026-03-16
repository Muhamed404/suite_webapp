"use client";

import {
  useState,
  useEffect,
  useMemo,
  use,
  useCallback,
  Suspense,
} from "react";
import { Button } from "@heroui/button";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  LinkIcon,
} from "lucide-react";
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuthStore } from "@/hooks/useAuthStore";
import {
  usePublicSurvey,
  usePublicSurveyStatus,
  useSubmitPublicSurvey,
} from "@/hooks/useSurvey";
import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import type { PublicSurveySubmissionAnswer } from "@/types/survey";

export default function PublicSurveyPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center bg-[#F1F5F8] h-screen">
          <div className="flex flex-col items-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="text-gray-500 font-medium">Loading Survey...</p>
          </div>
        </div>
      }
    >
      <PublicSurveyPage params={params} />
    </Suspense>
  );
}

function PublicSurveyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawSurveyId } = use(params);
  const surveyId = parseInt(rawSurveyId, 10);

  const searchParams = useSearchParams();
  const invitationIdParam = searchParams.get("invitation_id") || "";
  const surveyCode = searchParams.get("survey_code") || "";
  const invitationId = invitationIdParam ? parseInt(invitationIdParam, 10) : NaN;

  const router = useRouter();
  const { user } = useAuthStore();

  const hasValidParams = !!surveyId && !!invitationId && !!surveyCode;

  const {
    data: surveyData,
    isLoading: surveyLoading,
    error: surveyError,
  } = usePublicSurvey(surveyId, invitationId, surveyCode, hasValidParams);

  const {
    data: statusData,
    isLoading: statusLoading,
  } = usePublicSurveyStatus(surveyId, invitationId, surveyCode, hasValidParams);

  const submitMutation = useSubmitPublicSurvey();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number[]>
  >({});
  const [savedAnswers, setSavedAnswers] = useState<Record<number, number[]>>({});
  const [showCompletion, setShowCompletion] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    correct_answers: number;
    incorrect_answers: number;
    skipped_answers: number;
    accuracy: number;
  } | null>(null);
  const [answerStatusMsg, setAnswerStatusMsg] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isAlreadyFilled = surveyData?.completion_status === "filled";
  const surveyStatus = surveyData?.survey?.status;
  const statusValue = statusData?.status;

  const isSurveyActive =
    surveyStatus === "active" || statusValue === "active";
  const isSurveyInactive =
    !isSurveyActive &&
    (surveyStatus === "expired" ||
      surveyStatus === "closed" ||
      surveyStatus === "not_started" ||
      statusValue === "expired" ||
      statusValue === "closed" ||
      statusValue === "not_started");

  const questions = useMemo(() => surveyData?.questions ?? [], [surveyData]);

  const quizData = useMemo(() => {
    return questions.map((q, idx) => ({
      lesson: idx + 1,
      id: q.question_id,
      question: q.question_text,
      questionType: q.question_type,
      answers: q.answers,
    }));
  }, [questions]);

  useEffect(() => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setSavedAnswers({});
    setShowCompletion(false);
    setAnswerStatusMsg("");
  }, [quizData.length]);

  const quiz = quizData[currentQuestion];
  const isSingleChoice = quiz
    ? !quiz.questionType.toLowerCase().includes("multiple")
    : true;
  const progressPercentage =
    quizData.length > 0
      ? ((currentQuestion + 1) / quizData.length) * 100
      : 0;

  const hasAnswer = (selectedAnswers[currentQuestion]?.length ?? 0) > 0;
  const isSaved = (savedAnswers[currentQuestion]?.length ?? 0) > 0;

  const toggleAnswer = useCallback(
    (answerId: number) => {
      setSelectedAnswers((prev) => {
        const current = prev[currentQuestion] || [];
        if (isSingleChoice) {
          return {
            ...prev,
            [currentQuestion]: current[0] === answerId ? [] : [answerId],
          };
        }
        if (current.includes(answerId)) {
          return {
            ...prev,
            [currentQuestion]: current.filter((id) => id !== answerId),
          };
        }
        return { ...prev, [currentQuestion]: [...current, answerId] };
      });
    },
    [currentQuestion, isSingleChoice],
  );

  const saveAnswer = useCallback(() => {
    if ((selectedAnswers[currentQuestion]?.length ?? 0) > 0) {
      setSavedAnswers((prev) => ({
        ...prev,
        [currentQuestion]: [...selectedAnswers[currentQuestion]],
      }));
      setAnswerStatusMsg("saved");
    }
  }, [currentQuestion, selectedAnswers]);

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setAnswerStatusMsg("");
    }
  }, [currentQuestion]);

  const goToNextQuestion = useCallback(() => {
    if (
      !savedAnswers[currentQuestion] ||
      savedAnswers[currentQuestion].length === 0
    ) {
      setAnswerStatusMsg("save_first");
      return;
    }

    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setAnswerStatusMsg("");
      return;
    }

    const allAnswered = quizData.every(
      (_, index) => (savedAnswers[index]?.length ?? 0) > 0,
    );
    if (!allAnswered) {
      setAnswerStatusMsg("answer_all");
      return;
    }

    submitSurvey();
  }, [currentQuestion, savedAnswers, quizData]);

  const submitSurvey = async () => {
    const answers: PublicSurveySubmissionAnswer[] = quizData.map(
      (q, index) => {
        const answerIds = savedAnswers[index] || [];
        if (answerIds.length === 1) {
          return { question_id: q.id, selected_answer_id: answerIds[0] };
        }
        return { question_id: q.id, selected_answer_ids: answerIds };
      },
    );

    try {
      const result = await submitMutation.mutateAsync({
        surveyId,
        invitationId,
        surveyCode,
        payload: {
          survey_id: surveyId,
          user_type: user ? "org_user" : "public",
          answers,
        },
      });
      setSubmissionResult(result?.statistics ?? null);
      setShowCompletion(true);
    } catch (error: any) {
      const msg =
        error?.message || "Failed to submit survey. Please try again.";
      setAnswerStatusMsg(msg);
    }
  };

  const isLoading = surveyLoading || statusLoading;

  const renderStatusMessage = () => {
    if (answerStatusMsg === "saved") {
      return (
        <span className="text-green-600 font-semibold text-sm">
          Answer saved successfully!
        </span>
      );
    }
    if (answerStatusMsg === "save_first") {
      return (
        <span className="text-red-600 font-semibold text-sm">
          Please save your answer first!
        </span>
      );
    }
    if (answerStatusMsg === "answer_all") {
      return (
        <span className="text-red-600 font-semibold text-sm">
          Please answer all questions before submitting!
        </span>
      );
    }
    if (answerStatusMsg) {
      return (
        <span className="text-red-600 font-semibold text-sm">
          {answerStatusMsg}
        </span>
      );
    }
    return <span className="text-sm h-6" />;
  };

  const renderContent = () => {
    if (!isClient) return null;

    // Missing parameters
    if (!hasValidParams) {
      return (
        <div
          className={clsx(
            "flex items-center justify-center bg-[#F1F5F8]",
            user ? "min-h-[calc(100vh-64px)]" : "h-screen",
          )}
        >
          <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <LinkIcon className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Invalid Survey Link
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              This survey link is invalid or incomplete. Please check the link
              and try again.
            </p>
            <Button color="primary" onClick={() => router.push("/")}>
              Go to Home
            </Button>
          </div>
        </div>
      );
    }

    // Loading state
    if (isLoading) {
      return (
        <div
          className={clsx(
            "flex items-center justify-center bg-[#F1F5F8]",
            user ? "min-h-[calc(100vh-64px)]" : "h-screen",
          )}
        >
          <div className="flex flex-col items-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="text-gray-500 font-medium">Loading Survey...</p>
          </div>
        </div>
      );
    }

    // Error / not found / invalid link
    if (surveyError || statusValue === "invalid_link" || !surveyData) {
      return (
        <div
          className={clsx(
            "flex items-center justify-center bg-[#F1F5F8]",
            user ? "min-h-[calc(100vh-64px)]" : "h-screen",
          )}
        >
          <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Survey Not Found
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              The survey you are looking for does not exist, has been removed,
              or the link is invalid.
            </p>
            <Button color="primary" onClick={() => router.push("/")}>
              Go to Home
            </Button>
          </div>
        </div>
      );
    }

    // Survey not started yet
    if (surveyStatus === "not_started" || statusValue === "not_started") {
      return (
        <div
          className={clsx(
            "flex items-center justify-center bg-[#F1F5F8]",
            user ? "min-h-[calc(100vh-64px)]" : "h-screen",
          )}
        >
          <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Survey Not Started
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              This survey has not started yet. Please check back later.
            </p>
            <Button
              color="primary"
              variant="bordered"
              onClick={() => router.push("/")}
            >
              Return to Home
            </Button>
          </div>
        </div>
      );
    }

    // Survey expired
    if (surveyStatus === "expired" || statusValue === "expired") {
      return (
        <div
          className={clsx(
            "flex items-center justify-center bg-[#F1F5F8]",
            user ? "min-h-[calc(100vh-64px)]" : "h-screen",
          )}
        >
          <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Survey Expired
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              This survey has passed its deadline and is no longer accepting
              responses.
            </p>
            <Button
              color="primary"
              variant="bordered"
              onClick={() => router.push("/")}
            >
              Return to Home
            </Button>
          </div>
        </div>
      );
    }

    // Survey closed
    if (surveyStatus === "closed" || statusValue === "closed") {
      return (
        <div
          className={clsx(
            "flex items-center justify-center bg-[#F1F5F8]",
            user ? "min-h-[calc(100vh-64px)]" : "h-screen",
          )}
        >
          <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Survey Closed
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              This survey has been closed and is no longer accepting responses.
            </p>
            <Button
              color="primary"
              variant="bordered"
              onClick={() => router.push("/")}
            >
              Return to Home
            </Button>
          </div>
        </div>
      );
    }

    // Already submitted
    if (isAlreadyFilled || statusValue === "completed") {
      return (
        <div
          className={clsx(
            "flex items-center justify-center bg-[#F1F5F8]",
            user ? "min-h-[calc(100vh-64px)]" : "h-screen",
          )}
        >
          <CompletionAnimation />
          <div className="bg-white rounded-2xl shadow-sm p-10 min-h-[400px] flex flex-col items-center justify-center text-center">
            <div className="relative w-28 h-28 mb-6">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 120">
                <circle
                  className="completion-ring"
                  cx="60"
                  cy="60"
                  fill="none"
                  r="55"
                  stroke="#D1E9F6"
                  strokeWidth="3"
                />
                <circle
                  className="completion-ring delay"
                  cx="60"
                  cy="60"
                  fill="none"
                  r="45"
                  stroke="#99D5E8"
                  strokeWidth="2"
                />
                <circle cx="60" cy="60" fill="#10B981" r="35" />
                <path
                  className="completion-check"
                  d="M 43 62 L 55 72 L 78 50"
                  fill="none"
                  stroke="white"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="5"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
              Already Submitted!
            </h2>
            <p className="text-gray-500 mb-10 max-w-sm text-lg mx-auto leading-relaxed">
              You have already submitted a response for this survey. Thank you
              for your feedback!
            </p>
            <Button
              color="primary"
              variant="bordered"
              className="px-10 py-6 text-base font-semibold rounded-full hover:bg-gray-50 border-2"
              onClick={() => router.push("/")}
            >
              Return to Home
            </Button>
          </div>
        </div>
      );
    }

    // Active survey - show the form
    return (
      <div
        className={clsx(
          "bg-[#F1F5F8] flex flex-col",
          user ? "min-h-[calc(100vh-64px)]" : "min-h-screen",
        )}
      >
        <SurveyFormStyles />

        {/* Header */}
        <div className="bg-white shadow-sm px-6 py-4 flex items-center mb-6">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Button>
          <div className="font-semibold text-gray-800 text-lg">
            Survey: {surveyData.survey.title}
          </div>
        </div>

        <div className="flex-1 w-full max-w-6xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Main Survey Area */}
            <div className="md:col-span-8 lg:col-span-9">
              {quizData.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-8 flex items-center justify-center min-h-[400px]">
                  <p className="text-gray-500">
                    No questions available for this survey.
                  </p>
                </div>
              ) : !showCompletion ? (
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                      Question {quiz.lesson} of {quizData.length}
                    </p>
                    <p className="text-xs text-gray-300">|</p>
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                      {quiz.questionType}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden mr-4">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-600 min-w-10 text-right">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                  </div>

                  {/* Question */}
                  <div className="mb-8">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">
                      {quiz.question}
                    </h3>
                  </div>

                  {/* Options */}
                  <div className="space-y-3 mb-10">
                    {quiz.answers.map((answer) => {
                      const isChecked =
                        selectedAnswers[currentQuestion]?.includes(
                          answer.answer_id,
                        ) || false;
                      const shapeClass = isSingleChoice
                        ? "is-radio"
                        : "is-checkbox";

                      return (
                        <label
                          key={answer.answer_id}
                          className={clsx(
                            "w-full flex items-center gap-4 cursor-pointer p-4 rounded-xl border-2 transition-all duration-200",
                            isChecked
                              ? "border-blue-500 bg-blue-50/50 shadow-sm"
                              : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50",
                          )}
                        >
                          <span
                            className={clsx(
                              "option-check flex-shrink-0",
                              shapeClass,
                              isChecked && "is-checked",
                            )}
                          >
                            {isSingleChoice ? (
                              <span
                                className={clsx(
                                  "block rounded-full bg-white transition-all duration-200",
                                  isChecked
                                    ? "w-[6px] h-[6px] opacity-100"
                                    : "w-0 h-0 opacity-0",
                                )}
                              />
                            ) : (
                              <svg
                                className={clsx(
                                  isChecked ? "opacity-100" : "opacity-0",
                                )}
                                fill="none"
                                height="12"
                                stroke="white"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                viewBox="0 0 24 24"
                                width="12"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </span>
                          <input
                            checked={isChecked}
                            className="hidden"
                            name={`question-${currentQuestion}`}
                            type={isSingleChoice ? "radio" : "checkbox"}
                            value={answer.answer_id}
                            onChange={() => toggleAnswer(answer.answer_id)}
                          />
                          <div className="flex-1">
                            <span
                              className={clsx(
                                "text-base",
                                isChecked
                                  ? "text-blue-900 font-medium"
                                  : "text-gray-700",
                              )}
                            >
                              {answer.answer_text}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Save Answer Row */}
                  <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-100">
                    {renderStatusMessage()}
                    <Button
                      color={isSaved ? "success" : "primary"}
                      className={clsx(
                        "px-8 font-medium rounded-full",
                        isSaved && "text-white",
                      )}
                      isDisabled={!hasAnswer}
                      onClick={saveAnswer}
                    >
                      {isSaved ? "✓ Answer Saved" : "Save Answer"}
                    </Button>
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-4 justify-between md:justify-end">
                    <Button
                      variant="bordered"
                      className="px-8 font-medium rounded-full border-2"
                      isDisabled={currentQuestion === 0}
                      onClick={goToPreviousQuestion}
                    >
                      Previous
                    </Button>
                    <Button
                      color="primary"
                      className="px-8 font-medium rounded-full shadow-md shadow-blue-500/20"
                      isLoading={submitMutation.isPending}
                      onClick={goToNextQuestion}
                    >
                      {currentQuestion === quizData.length - 1
                        ? "Submit Survey"
                        : "Next Question"}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Completion Screen */
                <div className="bg-white rounded-2xl shadow-sm p-10 min-h-[400px] flex flex-col items-center justify-center text-center">
                  <CompletionAnimation />
                  <div className="relative w-28 h-28 mb-6">
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 120 120"
                    >
                      <circle
                        className="completion-ring"
                        cx="60"
                        cy="60"
                        fill="none"
                        r="55"
                        stroke="#D1E9F6"
                        strokeWidth="3"
                      />
                      <circle
                        className="completion-ring delay"
                        cx="60"
                        cy="60"
                        fill="none"
                        r="45"
                        stroke="#99D5E8"
                        strokeWidth="2"
                      />
                      <circle cx="60" cy="60" fill="#10B981" r="35" />
                      <path
                        className="completion-check"
                        d="M 43 62 L 55 72 L 78 50"
                        fill="none"
                        stroke="white"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="5"
                      />
                    </svg>
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    Survey Completed!
                  </h2>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto text-lg leading-relaxed">
                    Thank you for completing this survey. Your responses have
                    been successfully recorded.
                  </p>

                  {submissionResult && (
                    <div className="bg-gray-50 rounded-xl p-6 mb-8 w-full max-w-sm">
                      <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">
                        Your Results
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {submissionResult.correct_answers}
                          </p>
                          <p className="text-gray-500">Correct</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-500">
                            {submissionResult.incorrect_answers}
                          </p>
                          <p className="text-gray-500">Incorrect</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-400">
                            {submissionResult.skipped_answers}
                          </p>
                          <p className="text-gray-500">Skipped</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {submissionResult.accuracy}%
                          </p>
                          <p className="text-gray-500">Accuracy</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    color="default"
                    variant="bordered"
                    className="px-10 py-6 text-base font-semibold rounded-full hover:bg-gray-50 border-2"
                    onClick={() => router.push("/")}
                  >
                    Return to Home
                  </Button>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="md:col-span-4 lg:col-span-3 hidden md:block space-y-4">
              {/* Survey Status Card */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
                  Survey Status
                </h3>
                <div className="text-center py-6 bg-gray-50/80 rounded-xl border border-gray-100">
                  <p className="text-4xl font-bold text-gray-900">
                    {String(currentQuestion + 1).padStart(2, "0")}
                    <span className="text-gray-300 font-light mx-1">/</span>
                    <span className="text-2xl text-gray-500">
                      {String(quizData.length).padStart(2, "0")}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-3 font-medium">
                    Question{" "}
                    <span className="text-gray-800 font-bold">
                      {currentQuestion + 1}
                    </span>{" "}
                    active
                  </p>
                </div>
              </div>

              {/* Survey Info Card */}
              <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-50">
                <h4 className="text-base font-bold text-gray-900 mb-2 leading-tight">
                  {surveyData.survey.title}
                </h4>
                <hr className="my-3 border-gray-100" />
                {surveyData.survey.description ? (
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    {surveyData.survey.description}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    No description available for this survey.
                  </p>
                )}
                <hr className="my-3 border-gray-100" />
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-600">
                    {surveyData.survey.total_questions} questions total
                  </span>
                </div>
              </div>

              {/* Question Navigator */}
              {quizData.length > 0 && !showCompletion && (
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">
                    Questions
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {quizData.map((_, idx) => {
                      const isAnswered =
                        (savedAnswers[idx]?.length ?? 0) > 0;
                      const isCurrent = idx === currentQuestion;
                      return (
                        <button
                          key={idx}
                          className={clsx(
                            "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                            isCurrent && "bg-blue-500 text-white shadow-md",
                            !isCurrent &&
                              isAnswered &&
                              "bg-green-100 text-green-700",
                            !isCurrent &&
                              !isAnswered &&
                              "bg-gray-100 text-gray-500 hover:bg-gray-200",
                          )}
                          onClick={() => {
                            setCurrentQuestion(idx);
                            setAnswerStatusMsg("");
                          }}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return user ? (
    <DashboardLayout>{renderContent()}</DashboardLayout>
  ) : (
    renderContent()
  );
}

function CompletionAnimation() {
  return (
    <style jsx global>{`
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
          stroke-dashoffset: 60;
        }
        100% {
          stroke-dashoffset: 0;
        }
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
  );
}

function SurveyFormStyles() {
  return (
    <style jsx global>{`
      @keyframes softPop {
        0% {
          box-shadow: 0 0 0 rgba(59, 130, 246, 0);
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
        transition:
          border-color 0.2s ease,
          background-color 0.2s ease;
      }
      .option-check.is-radio {
        border-radius: 9999px;
      }
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
  );
}
