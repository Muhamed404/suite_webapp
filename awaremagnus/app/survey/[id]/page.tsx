"use client";

import { useState, useEffect, useMemo, use } from "react";
import { Button } from "@heroui/button";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { useAuthStore } from "@/hooks/useAuthStore";
import { isOrgUser } from "@/utils/roles";
import { surveyService } from "@/services/surveyService";
import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";

// This page is completely public, meaning anyone with the link can view and fill out the survey.
export default function SurveyFillingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const surveyId = parseInt(id, 10);
    const router = useRouter();
    const { user } = useAuthStore();

    const { data: survey, isLoading: surveyLoading } = useQuery({
        queryKey: ["survey", surveyId],
        queryFn: () => surveyService.getSurveyById(surveyId),
        enabled: !!surveyId,
    });

    const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (typeof window !== "undefined") {
            const submitted = localStorage.getItem(`survey_completed_${surveyId}`);
            if (submitted === "true") {
                setIsAlreadySubmitted(true);
            }
        }
    }, [surveyId]);

    const categoryIds = useMemo(() => {
        if (!survey || !survey.selectedCategories) return [];
        return survey.selectedCategories.map((c) => c.category_id);
    }, [survey]);

    const { data: questions, isLoading: questionsLoading } = useQuery({
        queryKey: ["survey-questions", surveyId, categoryIds],
        queryFn: async () => {
            if (categoryIds.length === 0) return [];
            const promises = categoryIds.map((cid) =>
                surveyService.getSurveyQuestions({ category_id: cid })
            );
            const results = await Promise.all(promises);
            const allQuestions = results.flat();

            // If max_questions is set on the survey, slice the questions array
            if (survey?.max_questions && survey.max_questions > 0) {
                return allQuestions.slice(0, survey.max_questions);
            }
            return allQuestions;
        },
        enabled: categoryIds.length > 0,
    });

    const quizData = useMemo(() => {
        if (!questions) return [];
        return questions.map((q, idx) => ({
            lesson: idx + 1,
            id: q.id,
            question: q.question,
            options: (q.answers ?? []).map((a) => a.answer),
            optionsMap: (q.answers ?? []).map((a) => a),
            quizTypeName: q.questType?.name ?? "Single Choice",
        }));
    }, [questions]);

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number[] }>({});
    const [savedAnswers, setSavedAnswers] = useState<{ [key: number]: number[] }>({});
    const [showCompletion, setShowCompletion] = useState(false);
    const [answerStatusMsg, setAnswerStatusMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setCurrentQuestion(0);
        setSelectedAnswers({});
        setSavedAnswers({});
        setShowCompletion(false);
        setAnswerStatusMsg("");
        setIsSubmitting(false);
    }, [quizData.length]);

    const quiz = quizData[currentQuestion];
    const isSingleChoice = quiz ? !quiz.quizTypeName.toLowerCase().includes("multiple") : true;
    const progressPercentage = quizData.length > 0 ? ((currentQuestion + 1) / quizData.length) * 100 : 0;

    const hasAnswer = selectedAnswers[currentQuestion]?.length > 0;
    const isSaved = savedAnswers[currentQuestion]?.length > 0;

    const toggleAnswer = (index: number) => {
        setSelectedAnswers((prev) => {
            const current = prev[currentQuestion] || [];
            if (isSingleChoice) {
                return { ...prev, [currentQuestion]: current[0] === index ? [] : [index] };
            }
            if (current.includes(index)) {
                return { ...prev, [currentQuestion]: current.filter((i) => i !== index) };
            } else {
                return { ...prev, [currentQuestion]: [...current, index] };
            }
        });
    };

    const saveAnswer = () => {
        if (selectedAnswers[currentQuestion]?.length > 0) {
            setSavedAnswers((prev) => ({
                ...prev,
                [currentQuestion]: [...selectedAnswers[currentQuestion]],
            }));
            setAnswerStatusMsg(
                '<span class="text-green-600 font-semibold">Answer saved successfully!</span>'
            );
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
            setAnswerStatusMsg(
                '<span class="text-red-600 font-semibold">Please save your answer first!</span>'
            );
            return;
        }

        if (currentQuestion < quizData.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setAnswerStatusMsg("");
            return;
        }

        const allAnswered = quizData.every((_, index) => savedAnswers[index]?.length > 0);
        if (!allAnswered) {
            setAnswerStatusMsg(
                '<span class="text-red-600 font-semibold">Please answer all questions before submitting!</span>'
            );
            return;
        }

        submitSurvey();
    };

    const submitSurvey = async () => {
        setIsSubmitting(true);
        try {
            const answers = quizData.map((q, index) => {
                const savedAnswerIndices = savedAnswers[index] || [];
                return {
                    question_id: q.id,
                    selected_answers: savedAnswerIndices.map((idx) => q.optionsMap[idx].id),
                };
            });

            const payload = {
                user_id: user?.id || null, // Optional if not logged in
                answers,
            };

            // Ensure your backend supports this endpoint or equivalent!
            await surveyService.submitSurveyAnswers(surveyId, payload);
            if (typeof window !== "undefined") {
                localStorage.setItem(`survey_completed_${surveyId}`, "true");
            }
            setShowCompletion(true);
        } catch (error) {
            console.error("Failed to submit survey:", error);
            setAnswerStatusMsg(
                '<span class="text-red-600 font-semibold">Failed to submit survey. Please try again.</span>'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = surveyLoading || questionsLoading;

    const renderContent = () => {
        if (!isClient) return null; // Avoid hydration mismatch on localStorage

        if (isLoading) {
            return (
                <div className={clsx("flex items-center justify-center bg-[#F1F5F8]", user ? "min-h-[calc(100vh-64px)]" : "h-screen")}>
                    <div className="flex flex-col items-center">
                        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                        <p className="text-gray-500 font-medium">Loading Survey...</p>
                    </div>
                </div>
            );
        }

        if (!survey) {
            return (
                <div className={clsx("flex items-center justify-center bg-[#F1F5F8]", user ? "min-h-[calc(100vh-64px)]" : "h-screen")}>
                    <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-lg">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Survey Not Found</h2>
                        <p className="text-sm text-gray-500 mb-6">The survey you are looking for does not exist or has been removed.</p>
                        <Button color="primary" onClick={() => router.push("/")}>Go to Home</Button>
                    </div>
                </div>
            );
        }

        if (isAlreadySubmitted) {
            return (
                <div className={clsx("flex items-center justify-center bg-[#F1F5F8]", user ? "min-h-[calc(100vh-64px)]" : "h-screen")}>
                    <style jsx>{`
            @keyframes ringWave {
              0% { opacity: 0.3; transform: scale(0.96); }
              50% { opacity: 0.6; transform: scale(1.02); }
              100% { opacity: 0.3; transform: scale(0.96); }
            }
            @keyframes checkDraw {
              0% { stroke-dashoffset: 60; }
              100% { stroke-dashoffset: 0; }
            }
            .completion-ring {
              transform-origin: 50% 50%;
              animation: ringWave 1.6s ease-in-out infinite;
            }
            .completion-ring.delay { animation-delay: 0.2s; }
            .completion-check {
              stroke-dasharray: 60;
              stroke-dashoffset: 60;
              animation: checkDraw 0.9s ease-out forwards;
            }
          `}</style>
                    <div className="bg-white rounded-2xl shadow-sm p-10 min-h-[400px] flex flex-col items-center justify-center text-center">
                        <div className="relative w-28 h-28 mb-6">
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 120">
                                <circle className="completion-ring" cx="60" cy="60" fill="none" r="55" stroke="#D1E9F6" strokeWidth="3" />
                                <circle className="completion-ring delay" cx="60" cy="60" fill="none" r="45" stroke="#99D5E8" strokeWidth="2" />
                                <circle cx="60" cy="60" fill="#10B981" r="35" />
                                <path className="completion-check" d="M 43 62 L 55 72 L 78 50" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Already Submitted!</h2>
                        <p className="text-gray-500 mb-10 max-w-sm text-lg mx-auto leading-relaxed">
                            You have already submitted a response for this survey. Thank you for your feedback!
                        </p>
                        <Button color="primary" variant="bordered" className="px-10 py-6 text-base font-semibold rounded-full hover:bg-gray-50 border-2" onClick={() => router.push("/")}>
                            Return to Home
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <div className={clsx("bg-[#F1F5F8] flex flex-col", user ? "min-h-[calc(100vh-64px)]" : "min-h-screen")}>
                <style jsx>{`
            @keyframes softPop {
              0% { box-shadow: 0 0 0 rgba(59, 130, 246, 0); }
          60% { box-shadow: 0 8px 14px rgba(59, 130, 246, 0.2); }
          100% { box-shadow: 0 4px 10px rgba(59, 130, 246, 0.15); }
        }
        @keyframes ringWave {
          0% { opacity: 0.3; transform: scale(0.96); }
          50% { opacity: 0.6; transform: scale(1.02); }
          100% { opacity: 0.3; transform: scale(0.96); }
        }
        @keyframes checkDraw {
          0% { stroke-dashoffset: 30; }
          100% { stroke-dashoffset: 0; }
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
        .option-check.is-radio { border-radius: 9999px; }
        .option-check.is-checkbox { border-radius: 4px; }
        .option-check.is-checked {
          border-color: #3b82f6;
          background: #3b82f6;
          animation: softPop 0.35s ease;
        }
        .option-check svg { transition: opacity 0.2s ease; }
        .completion-ring {
          transform-origin: 50% 50%;
          animation: ringWave 1.6s ease-in-out infinite;
        }
        .completion-ring.delay { animation-delay: 0.2s; }
        .completion-check {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: checkDraw 0.9s ease-out forwards;
        }
      `}</style>

                {/* Header wrapper for aesthetic consistency */}
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
                        Survey: {survey.name}
                    </div>
                </div>

                <div className="flex-1 w-full max-w-6xl mx-auto px-4 pb-12">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                        {/* Main Survey Area */}
                        <div className="md:col-span-8 lg:col-span-9">
                            {quizData.length === 0 ? (
                                <div className="bg-white rounded-2xl shadow-sm p-8 flex items-center justify-center min-h-[400px]">
                                    <p className="text-gray-500">No questions available for this survey.</p>
                                </div>
                            ) : !showCompletion ? (
                                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 w-full">
                                    <div className="flex items-center gap-3 mb-4">
                                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                                            Question {quiz.lesson} of {quizData.length}
                                        </p>
                                        <p className="text-xs text-gray-300">|</p>
                                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                                            {quiz.quizTypeName}
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
                                        {quiz.options.map((option, index) => {
                                            const isChecked = selectedAnswers[currentQuestion]?.includes(index) || false;
                                            const shapeClass = isSingleChoice ? "is-radio" : "is-checkbox";

                                            return (
                                                <label
                                                    key={index}
                                                    className={clsx(
                                                        "w-full flex items-center gap-4 cursor-pointer p-4 rounded-xl border-2 transition-all duration-200",
                                                        isChecked
                                                            ? "border-blue-500 bg-blue-50/50 shadow-sm"
                                                            : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                                                    )}
                                                >
                                                    <span className={clsx("option-check flex-shrink-0", shapeClass, isChecked && "is-checked")}>
                                                        {isSingleChoice ? (
                                                            <span className={clsx("block rounded-full bg-white transition-all duration-200", isChecked ? "w-[6px] h-[6px] opacity-100" : "w-0 h-0 opacity-0")} />
                                                        ) : (
                                                            <svg className={clsx(isChecked ? "opacity-100" : "opacity-0")} fill="none" height="12" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" width="12" xmlns="http://www.w3.org/2000/svg">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        )}
                                                    </span>
                                                    <input
                                                        checked={isChecked}
                                                        className="hidden"
                                                        name={`question-${currentQuestion}`}
                                                        type={isSingleChoice ? "radio" : "checkbox"}
                                                        value={index}
                                                        onChange={() => toggleAnswer(index)}
                                                    />
                                                    <div className="flex-1">
                                                        <span className={clsx("text-base", isChecked ? "text-blue-900 font-medium" : "text-gray-700")}>{option}</span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>

                                    {/* Save Answer Button Row */}
                                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-100">
                                        <p dangerouslySetInnerHTML={{ __html: answerStatusMsg }} className="text-sm h-6" />
                                        <Button
                                            color={isSaved ? "success" : "primary"}
                                            className={clsx("px-8 font-medium rounded-full", isSaved && "text-white")}
                                            isDisabled={!hasAnswer}
                                            onClick={saveAnswer}
                                        >
                                            {isSaved ? "✓ Answer Saved" : "Save Answer"}
                                        </Button>
                                    </div>

                                    {/* Navigation Buttons */}
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
                                            isLoading={isSubmitting}
                                            onClick={goToNextQuestion}
                                        >
                                            {currentQuestion === quizData.length - 1 ? "Submit Survey" : "Next Question"}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* Completion Screen */
                                <div className="bg-white rounded-2xl shadow-sm p-10 min-h-[400px] flex flex-col items-center justify-center text-center">
                                    <div className="relative w-28 h-28 mb-6">
                                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 120">
                                            <circle className="completion-ring" cx="60" cy="60" fill="none" r="55" stroke="#D1E9F6" strokeWidth="3" />
                                            <circle className="completion-ring delay" cx="60" cy="60" fill="none" r="45" stroke="#99D5E8" strokeWidth="2" />
                                            <circle cx="60" cy="60" fill="#10B981" r="35" />
                                            <path className="completion-check" d="M 43 62 L 55 72 L 78 50" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
                                        </svg>
                                    </div>

                                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Survey Completed!</h2>
                                    <p className="text-gray-600 mb-10 max-w-sm mx-auto text-lg leading-relaxed">
                                        Thank you for completing this survey. Your responses have been successfully recorded.
                                    </p>

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
                                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Survey Status</h3>
                                <div className="text-center py-6 bg-gray-50/80 rounded-xl border border-gray-100">
                                    <p className="text-4xl font-bold text-gray-900">
                                        {String(currentQuestion + 1).padStart(2, "0")}<span className="text-gray-300 font-light mx-1">/</span><span className="text-2xl text-gray-500">{String(quizData.length).padStart(2, "0")}</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-3 font-medium">
                                        Question <span className="text-gray-800 font-bold">{currentQuestion + 1}</span> active
                                    </p>
                                </div>
                            </div>

                            {/* Survey Info Card */}
                            <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-50">
                                <h4 className="text-base font-bold text-gray-900 mb-2 leading-tight">{survey.name}</h4>
                                <hr className="my-3 border-gray-100" />
                                {survey.description ? (
                                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                        {survey.description}
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No description available for this survey.</p>
                                )}
                            </div>
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
