import { useState, useCallback, useTransition, useMemo } from 'react' 
import { useNavigate } from 'react-router-dom'
import { m, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion'
import { useAuth } from '../context/useAuth'
import { useStore } from '../store/useStore'
import { ONBOARDING_QUESTIONS } from '../data/onboardingData'
import { 
  CaretLeft, 
  Check,
  Calendar,
  Heart,
  Brain,
  Lightbulb,
  FlowerLotus
} from '@phosphor-icons/react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { cn } from '../lib/utils'

import { type DashboardSnapshot } from '../lib/dashboardStorage'

export function OnboardingView() {
  const [currentStep, setCurrentStep] = useState(0)
  const [, startTransition] = useTransition()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const { completeOnboarding, openAuthModal, isAuthenticated } = useAuth()
  const { updateUser, updateDashboard } = useStore()
  const navigate = useNavigate()

  const question = ONBOARDING_QUESTIONS[currentStep]

  const activeQuestions = useMemo(() => {
    const selectedRole = answers.role || '';
    return ONBOARDING_QUESTIONS.filter((q) => {
      if (q.id === 'intro') return false;
      if (selectedRole === 'partner') {
        if (['goal', 'energy_consistency', 'symptoms', 'activity_level'].includes(q.id)) {
          return false;
        }
      } else {
        if (q.id === 'partner_code') {
          return false;
        }
      }
      return true;
    });
  }, [answers.role]);

  const activeStepIndex = useMemo(() => {
    const currentQuestion = ONBOARDING_QUESTIONS[currentStep];
    const idx = activeQuestions.findIndex((q) => q.id === currentQuestion.id);
    return idx >= 0 ? idx + 1 : 1;
  }, [currentStep, activeQuestions]);

  const progress = useMemo(() => {
    return (activeStepIndex / activeQuestions.length) * 100;
  }, [activeStepIndex, activeQuestions.length]);

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'calendar':
        return <Calendar size={32} />
      case 'heart':
        return <Heart size={32} />
      case 'brain':
        return <Brain size={32} />
      case 'lightbulb':
        return <Lightbulb size={32} />
      default:
        return null
    }
  }

  const finishOnboarding = useCallback(() => {
    const patch: any = {}
    if (typeof answers.name === 'string' && answers.name) {
      patch.name = answers.name
    }
    if (typeof answers.access_level === 'string' && answers.access_level) {
      patch.accessLevel = answers.access_level
    }
    if (typeof answers.role === 'string' && answers.role) {
      patch.role = answers.role
    }
    if (Object.keys(patch).length > 0) {
      updateUser(patch)
    }

    if (answers.role === 'partner' && typeof answers.partner_code === 'string' && answers.partner_code.trim()) {
      sessionStorage.setItem('mf_partner_code', answers.partner_code.trim())
    } else {
      sessionStorage.removeItem('mf_partner_code')
    }
    
    // Map onboarding answers to dashboard state if the user is a lady
    if (answers.role !== 'partner') {
      const newDashboard: Partial<DashboardSnapshot> = {
        // Start their tracking cycle from today
        lastPeriodStart: new Date().toISOString().slice(0, 10)
      }

      if (Array.isArray(answers.symptoms) && answers.symptoms.length > 0) {
         const labels = answers.symptoms.reduce<string[]>((acc, s) => {
           if (s !== 'none') {
             if (s === 'fatigue') acc.push('Fatigue')
             else if (s === 'fog') acc.push('Brain fog')
             else if (s === 'stress') acc.push('High stress')
             else if (s === 'mood') acc.push('Mood swings')
             else if (s === 'sleep') acc.push('Poor sleep')
             else acc.push(s)
           }
           return acc
         }, [])
         if (labels.length > 0) {
           newDashboard.bodySignals = labels.join(', ')
         } else {
           newDashboard.bodySignals = 'Balanced'
         }
      }

      if (answers.goal === 'track') {
         newDashboard.guidanceLines = ['Focus on energy tracking', 'Monitor your sleep cycle', 'Keep a daily journal']
      } else if (answers.goal === 'health') {
         newDashboard.guidanceLines = ['Prioritize hydration', 'Aim for 30m exercise daily', 'Establish a morning routine']
      } else if (answers.goal === 'symptoms') {
         newDashboard.guidanceLines = ['Track your triggers', 'Practice mindfulness', 'Maintain a regular schedule']
      } else if (answers.goal === 'learn') {
         newDashboard.guidanceLines = ['Read the daily insights', 'Listen to your body', 'Focus on holistic wellness']
      }

      if (answers.energy_consistency === 'irregular') {
          newDashboard.hormoneTrend = 'Fluctuating energy'
      } else if (answers.energy_consistency === 'regular') {
          newDashboard.hormoneTrend = 'Stable energy'
      } else if (answers.energy_consistency === 'mostly') {
          newDashboard.hormoneTrend = 'Consistent rhythm'
      }

      updateDashboard(newDashboard)
    }

    completeOnboarding()
    if (isAuthenticated) {
      navigate('/dashboard')
    } else {
      openAuthModal()
      navigate('/')
    }
  }, [answers.name, answers.role, answers.partner_code, answers.symptoms, answers.goal, answers.energy_consistency, updateDashboard, completeOnboarding, isAuthenticated, navigate, openAuthModal, updateUser])

  const handleNext = useCallback(() => {
    if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
      let nextStep = currentStep + 1;
      const selectedRole = answers.role || '';
      
      if (selectedRole === 'partner') {
        // Skip cycle tracking questions: goal, energy_consistency, symptoms, activity_level
        if (ONBOARDING_QUESTIONS[nextStep] && ['goal', 'energy_consistency', 'symptoms', 'activity_level'].includes(ONBOARDING_QUESTIONS[nextStep].id)) {
          nextStep = ONBOARDING_QUESTIONS.findIndex(q => q.id === 'name');
        }
      } else if (selectedRole === 'lady') {
        // Skip partner code
        if (ONBOARDING_QUESTIONS[nextStep] && ONBOARDING_QUESTIONS[nextStep].id === 'partner_code') {
          nextStep = ONBOARDING_QUESTIONS.findIndex(q => q.id === 'goal');
        }
      }
      
      setCurrentStep(nextStep >= 0 ? nextStep : currentStep + 1);
    } else {
      startTransition(() => {
        setIsAnalyzing(true)
        setTimeout(() => {
          finishOnboarding()
        }, 2500)
      })
    }
  }, [currentStep, answers.role, finishOnboarding, startTransition])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      let prevStep = currentStep - 1;
      const selectedRole = answers.role || '';
      
      if (selectedRole === 'partner') {
        // From name, go back to partner_code
        if (ONBOARDING_QUESTIONS[currentStep].id === 'name') {
          prevStep = ONBOARDING_QUESTIONS.findIndex(q => q.id === 'partner_code');
        }
      } else if (selectedRole === 'lady') {
        // From goal, go back to role
        if (ONBOARDING_QUESTIONS[currentStep].id === 'goal') {
          prevStep = ONBOARDING_QUESTIONS.findIndex(q => q.id === 'role');
        }
      }
      
      setCurrentStep(prevStep >= 0 ? prevStep : currentStep - 1);
    }
  }, [currentStep, answers.role])

  const handleNoThanks = useCallback(() => {
    completeOnboarding()
    openAuthModal()
    navigate('/')
  }, [completeOnboarding, navigate, openAuthModal])

  const selectOption = (value: string) => {
    if (question.type === 'single-choice') {
      setAnswers((prev) => ({ ...prev, [question.id]: value }))
    } else if (question.type === 'multi-choice') {
      const raw = answers[question.id]
      const currentAnswers: string[] = Array.isArray(raw) ? raw : []
      const nextAnswers = currentAnswers.includes(value)
        ? currentAnswers.filter((v) => v !== value)
        : [...currentAnswers, value]
      setAnswers((prev) => ({ ...prev, [question.id]: nextAnswers }))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
  }

  const isStepValid = () => {
    const answer = answers[question.id]
    if (question.id === 'partner_code') return true // Partner code is optional
    if (question.type === 'single-choice') return !!answer
    if (question.type === 'multi-choice') return Array.isArray(answer) && answer.length > 0
    if (question.type === 'input') return typeof answer === 'string' && answer.trim().length > 0
    return false
  }

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
            className="onboarding-container"
          >
            <div className="onboarding-inner onboarding-inner--mobile-responsive">
              <OnboardingHeader
                rawStep={currentStep}
                displayStep={activeStepIndex}
                totalSteps={activeQuestions.length}
                progress={progress}
                handleBack={handleBack}
                handleNext={handleNext}
                onOpenAuth={openAuthModal}
              />

              <main className="onboarding-main">
                <AnimatePresence mode="wait">
                  <m.div
                    key={currentStep}
                    initial={{ opacity: 0, x: currentStep === 0 ? 0 : -20, y: currentStep === 0 ? 20 : 0 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: currentStep === 0 ? 0 : 20, y: currentStep === 0 ? -20 : 0 }}
                    transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
                    className={cn(
                      "onboarding-question-card",
                      currentStep === 0 && "onboarding-question-card--intro"
                    )}
                  >
                    {currentStep === 0 && (
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
                      <p className="onboarding-description text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis px-2 max-w-full">
                        {question.description}
                      </p>
                    )}

                    <div className="onboarding-options-grid onboarding-options-grid--mobile-responsive">
                      {question.type === 'input' ? (
                        <div className="onboarding-input-wrap onboarding-input-wrap--mobile">
                          <Input
                            value={answers[question.id] || ''}
                            onChange={handleInputChange}
                            className="onboarding-text-input onboarding-text-input--mobile"
                            onKeyDown={(e) => e.key === 'Enter' && isStepValid() && handleNext()}
                          />
                        </div>
                      ) : (
                        question.options?.map((option) => {
                          const isSelected = question.type === 'single-choice'
                            ? answers[question.id] === option.value
                            : (answers[question.id] || []).includes(option.value)

                          return (
                            <button
                              key={option.value}
                              onClick={() => selectOption(option.value)}
                              className={cn(
                                "onboarding-option-btn onboarding-option-btn--mobile",
                                isSelected && "onboarding-option-btn--selected"
                              )}
                            >
                              <div className="onboarding-option-content onboarding-option-content--mobile">
                                {option.img ? (
                                  <div className="size-6 shrink-0 rounded-full overflow-hidden mr-2">
                                    <img src={option.img} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ) : option.icon ? (
                                  <span className="onboarding-option-icon onboarding-option-icon--mobile">
                                    {getIcon(option.icon as string)}
                                  </span>
                                ) : null}
                                <span className="onboarding-option-label onboarding-option-label--mobile">
                                  {option.label}
                                </span>
                              </div>
                              <div className="onboarding-check-wrap onboarding-check-wrap--mobile">
                                {isSelected && <Check size={14} />}
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </m.div>
                </AnimatePresence>
              </main>

              <OnboardingFooter
                currentStep={currentStep}
                isStepValid={isStepValid()}
                handleNext={handleNext}
                handleNoThanks={handleNoThanks}
              />
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  )
}

interface OnboardingHeaderProps {
  rawStep: number
  displayStep: number
  totalSteps: number
  progress: number
  handleBack: () => void
  handleNext: () => void
  onOpenAuth: () => void
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
              className="rounded-full"
            >
              <CaretLeft size={24} weight="bold" />
            </Button>
            
            <div className="onboarding-brand hidden sm:flex">
              <FlowerLotus size={28} weight="duotone" className="text-primary" />
              <span className="onboarding-brand-text">MensFlow</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={onOpenAuth}
              className="text-xs font-semibold text-primary hover:text-primary/90"
            >
              Log in
            </Button>
            <Button
              variant="ghost"
              onClick={handleNext}
              className="onboarding-skip-btn"
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
  )
}

interface OnboardingFooterProps {
  currentStep: number
  isStepValid: boolean
  handleNext: () => void
  handleNoThanks: () => void
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
          className="onboarding-next-btn"
        >
          {currentStep === 0 
            ? 'Yes, fine by me' 
            : (currentStep === ONBOARDING_QUESTIONS.length - 1 ? 'Finish' : 'Next')}
        </Button>
        {currentStep === 0 && (
          <button 
            type="button"
            className="onboarding-secondary-btn" 
            onClick={handleNoThanks}
          >
            No, thanks
          </button>
        )}
      </div>
    </footer>
  )
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
          Creating your custom health dashboard based on your goals and symptoms.
        </m.p>
      </div>
    </m.div>
  )
}
