import { useState, useCallback, useTransition, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { m, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import { useAuth } from "../context/useAuth";
import { useStore } from "../store/useStore";
import { ONBOARDING_QUESTIONS } from "../data/onboardingData";
import { CaretLeft, Check, FlowerLotus } from "@phosphor-icons/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { cn } from "../lib/utils";
import { buildPersonalizationProfile, buildPersonalizedDashboard } from "../lib/personalization";

import { type ApiUser } from "../services/userService";

export function OnboardingView() {
  const [activeId, setActiveId] = useState<string>(() => {
    const first = ONBOARDING_QUESTIONS[0]?.id;
    return typeof first === "string" ? first : "intro";
  });
  const [, startTransition] = useTransition();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const { completeOnboarding, openAuthModal, isAuthenticated } = useAuth();
  const { updateUser, updateDashboard, updateSettings } = useStore();
  const navigate = useNavigate();

  const activeQuestions = useMemo(() => {
    const selectedRole = (answers.role as string) || "";
    const selectedPurpose = (answers.purpose as string) || "track_period";
    const trackPeriodIds = [
      "cycle_regularity",
      "cycle_length",
      "flow_description",
      "period_impact",
      "tracking_goal",
    ];
    const educationIds = [
      "education_purpose",
      "knowledge_level",
      "recommendation_topics",
      "learning_preference",
    ];
    return ONBOARDING_QUESTIONS.filter((q) => {
      if (["intro", "age_group", "role"].includes(q.id)) return true;
      if (selectedRole === "partner") {
        return ["referral_source", "name", "access_level"].includes(q.id);
      }
      if (q.id === "purpose") return true;
      if (!selectedPurpose) return false;
      if (q.id === "referral_source") return true;
      if (trackPeriodIds.includes(q.id))
        return selectedPurpose === "track_period";
      if (educationIds.includes(q.id)) return selectedPurpose === "education";
      return true;
    });
  }, [answers.role, answers.purpose]);

  const question =
    activeQuestions.find((q) => q.id === activeId) ||
    activeQuestions[0] ||
    ONBOARDING_QUESTIONS[0];

  const currentActiveIndex = useMemo(() => {
    const idx = activeQuestions.findIndex((q) => q.id === activeId);
    return idx >= 0 ? idx : 0;
  }, [activeId, activeQuestions]);

  const progress = useMemo(() => {
    if (activeQuestions.length <= 1) return 100;
    return (currentActiveIndex / (activeQuestions.length - 1)) * 100;
  }, [currentActiveIndex, activeQuestions.length]);

  const finishOnboarding = useCallback(async () => {
    const profile = buildPersonalizationProfile(answers);
    const patch: Partial<ApiUser> = {
      onboardingData: answers as Record<string, unknown>,
      role: profile.role,
      accessLevel: profile.accessLevel,
    };
    if (profile.name) {
      patch.name = profile.name;
    }
    if (Object.keys(patch).length > 0) {
      await updateUser(patch);
    }
    completeOnboarding();
    if (isAuthenticated) {
      const selectedPurpose = (answers.purpose as string) || "";
      if (selectedPurpose === "education") {
        navigate("/education");
      } else {
        updateDashboard(buildPersonalizedDashboard(answers));
        updateSettings({ cycleAvgLengthDays: profile.typicalCycleDays });
        navigate("/dashboard");
      }
    } else {
      openAuthModal("register");
      navigate("/");
    }
  }, [
    answers,
    updateUser,
    completeOnboarding,
    isAuthenticated,
    navigate,
    openAuthModal,
    updateDashboard,
    updateSettings,
  ]);

  const handleNext = useCallback(() => {
    if (currentActiveIndex < activeQuestions.length - 1) {
      setActiveId(activeQuestions[currentActiveIndex + 1].id);
      return;
    }
    startTransition(() => {
      setIsAnalyzing(true);
      setTimeout(() => {
        finishOnboarding();
      }, 2000);
    });
  }, [currentActiveIndex, activeQuestions, finishOnboarding, startTransition]);

  const handleBack = useCallback(() => {
    if (currentActiveIndex > 0) {
      setActiveId(activeQuestions[currentActiveIndex - 1].id);
    }
  }, [currentActiveIndex, activeQuestions]);

  const handleNoThanks = useCallback(() => {
    completeOnboarding();
    openAuthModal("register");
    navigate("/");
  }, [completeOnboarding, navigate, openAuthModal]);

  const selectOption = (value: string) => {
    if (question.type === "single-choice") {
      setAnswers((prev) => ({ ...prev, [question.id]: value }));
    } else if (question.type === "multi-choice") {
      const raw = answers[question.id];
      const currentAnswers: string[] = Array.isArray(raw) ? raw : [];
      const nextAnswers = currentAnswers.includes(value)
        ? currentAnswers.filter((v) => v !== value)
        : [...currentAnswers, value];
      setAnswers((prev) => ({ ...prev, [question.id]: nextAnswers }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }));
  };

  const isStepValid = () => {
    const answer = answers[question.id];
    if (question.id === "partner_code") return true;
    if (question.type === "single-choice") return !!answer;
    if (question.type === "multi-choice")
      return Array.isArray(answer) && answer.length > 0;
    if (question.type === "input")
      return typeof answer === "string" && answer.trim().length > 0;
    return false;
  };

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="wait">
        {isAnalyzing ? (
          <OnboardingAnalyzing />
        ) : (
           <m.div
             key="questions"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className={cn("onboarding-container", "font-sans")}
           >
            <div className="onboarding-inner">
              <OnboardingHeader
                rawStep={currentActiveIndex}
                displayStep={currentActiveIndex}
                totalSteps={activeQuestions.length - 1}
                progress={progress}
                handleBack={handleBack}
                handleNext={handleNext}
                onOpenAuth={openAuthModal}
              />

              <main className="onboarding-main">
                <AnimatePresence mode="wait">
                  <m.div
                    key={question.id}
                    initial={{
                      opacity: 0,
                      x: currentActiveIndex === 0 ? 0 : -20,
                      y: currentActiveIndex === 0 ? 20 : 0,
                    }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{
                      opacity: 0,
                      x: currentActiveIndex === 0 ? 0 : 20,
                      y: currentActiveIndex === 0 ? -20 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className={cn(
                      "onboarding-question-card",
                      currentActiveIndex === 0 &&
                        "onboarding-question-card--intro",
                    )}
                  >
                    {currentActiveIndex === 0 && (
                      <m.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="onboarding-illustration-wrap"
                      >
                        <img
                          src="/images/girl.png"
                          alt="Health illustration"
                          className="onboarding-illustration"
                        />
                      </m.div>
                    )}

                    <h1 className="onboarding-title">{question.question}</h1>
                    {question.description && (
                      <p className="onboarding-description">
                        {question.description}
                      </p>
                    )}

                    <div className="onboarding-options-grid">
                      {question.type === "input" ? (
                        <div className="onboarding-input-wrap">
                          <Input
                            value={answers[question.id] || ""}
                            onChange={handleInputChange}
                            className="onboarding-text-input"
                            onKeyDown={(e) =>
                              e.key === "Enter" && isStepValid() && handleNext()
                            }
                          />
                        </div>
                      ) : (
                        question.options?.map((option) => {
                          const isSelected =
                            question.type === "single-choice"
                              ? answers[question.id] === option.value
                              : (answers[question.id] || []).includes(
                                  option.value,
                                );

                          return (
                            <button
                              type="button"
                              key={option.value}
                              onClick={() => selectOption(option.value)}
                              className={cn(
                                "onboarding-option-btn",
                                isSelected && "onboarding-option-btn--selected",
                              )}
                            >
                              <div className="onboarding-option-content">
                                <span className="onboarding-option-label">
                                  {option.label}
                                </span>
                              </div>
                              <div className="onboarding-check-wrap">
                                {isSelected && <Check size={14} />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </m.div>
                </AnimatePresence>
              </main>

              <OnboardingFooter
                currentStep={currentActiveIndex}
                isStepValid={isStepValid()}
                handleNext={handleNext}
                handleNoThanks={handleNoThanks}
              />
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}

interface OnboardingHeaderProps {
  rawStep: number;
  displayStep: number;
  totalSteps: number;
  progress: number;
  handleBack: () => void;
  handleNext: () => void;
  onOpenAuth: () => void;
}

function OnboardingHeader({
  rawStep,
  displayStep,
  totalSteps,
  progress,
  handleBack,
  handleNext,
  onOpenAuth,
}: OnboardingHeaderProps) {
  return (
    <div className="onboarding-header">
      {rawStep > 0 ? (
        <div className="onboarding-nav-top flex items-center justify-between">
          <div className="flex items-center gap-2">
             <Button
               variant="ghost"
               size="icon"
               onClick={handleBack}
               className={cn("rounded-full", "p-2")}
             >
              <CaretLeft size={24} weight="bold" />
            </Button>

            <div className="onboarding-brand hidden sm:flex">
              <FlowerLotus
                size={28}
                weight="duotone"
                className="text-primary"
              />
              <span className="onboarding-brand-text">MensFlow</span>
            </div>
          </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={onOpenAuth}
                className={cn(
                  "text-sm font-semibold text-primary hover:text-primary/90",
                  "px-3 py-1"
                )}
              >
                Log in
              </Button>
              <Button
                variant="ghost"
                onClick={handleNext}
                className={cn("onboarding-skip-btn", "text-sm", "px-3 py-1")}
              >
                Skip
              </Button>
            </div>
        </div>
      ) : (
        <div className="onboarding-nav-top flex items-center justify-between w-full">
          <div className="onboarding-brand-centered !m-0 !p-0 flex items-center gap-2">
            <FlowerLotus size={32} weight="duotone" className="text-primary" />
            <span className="onboarding-brand-text-lg">MensFlow</span>
          </div>
          <Button
            variant="ghost"
            onClick={onOpenAuth}
            className="text-xs font-semibold text-primary hover:text-primary/90 bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-full cursor-pointer transition-all"
          >
            Log in
          </Button>
        </div>
      )}

      {rawStep > 0 && (
        <div className="flex flex-col gap-2 w-full mt-4">
          <div className="flex justify-center text-sm font-medium text-muted-foreground tracking-wide">
            {displayStep} / {totalSteps}
          </div>
          <div className="onboarding-progress-wrap !mt-0">
            <div
              className="onboarding-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface OnboardingFooterProps {
  currentStep: number;
  isStepValid: boolean;
  handleNext: () => void;
  handleNoThanks: () => void;
}

function OnboardingFooter({
  currentStep,
  isStepValid,
  handleNext,
  handleNoThanks,
}: OnboardingFooterProps) {
  return (
    <footer className="onboarding-footer">
      <div className="onboarding-footer-inner">
         <Button
           onClick={handleNext}
           disabled={currentStep !== 0 && !isStepValid}
           className={cn(
             "onboarding-next-btn",
             "w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
           )}
         >
          {currentStep === 0
            ? "Yes, fine by me"
            : currentStep === 0
              ? "Finish"
              : "Next"}
        </Button>
         {currentStep === 0 && (
           <button
             type="button"
             className={cn(
               "onboarding-secondary-btn",
               "w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
             )}
             onClick={handleNoThanks}
           >
             No, thanks
           </button>
         )}
      </div>
    </footer>
  );
}

function OnboardingAnalyzing() {
  return (
    <m.div
      key="analyzing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="onboarding-container onboarding-container--analyzing"
    >
      <div className="onboarding-analyzing-content">
        <div className="onboarding-loader-wrap">
          <div className="onboarding-loader-ring-outer" />
          <div className="onboarding-loader-ring-mid" />
          <m.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="onboarding-loader-circle"
          >
            <div className="onboarding-loader-inner" />
          </m.div>
        </div>
        <m.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="onboarding-analyzing-title"
        >
          Personalizing your experience…
        </m.h2>
        <m.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="onboarding-analyzing-sub"
        >
          Creating your custom health dashboard based on your goals and
          symptoms.
        </m.p>
      </div>
    </m.div>
  );
}
