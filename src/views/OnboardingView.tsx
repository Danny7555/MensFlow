import { useState, useCallback, useTransition } from 'react' 
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

export function OnboardingView() {
  const [currentStep, setCurrentStep] = useState(0)
  const [, startTransition] = useTransition()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const { completeOnboarding, openAuthModal, isAuthenticated } = useAuth()
  const { updateUser } = useStore()
  const navigate = useNavigate()

  const question = ONBOARDING_QUESTIONS[currentStep]
  const progress = ((currentStep + 1) / ONBOARDING_QUESTIONS.length) * 100

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
    if (typeof answers.name === 'string' && answers.name) {
      updateUser({ name: answers.name })
    }
    completeOnboarding()
    if (isAuthenticated) {
      navigate('/dashboard')
    } else {
      openAuthModal()
      navigate('/')
    }
  }, [answers.name, completeOnboarding, isAuthenticated, navigate, openAuthModal, updateUser])

  const handleNext = useCallback(() => {
    if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      startTransition(() => {
        setIsAnalyzing(true)
        setTimeout(() => {
          finishOnboarding()
        }, 2500)
      })
    }
  }, [currentStep, finishOnboarding, startTransition])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }, [currentStep])

  const handleNoThanks = useCallback(() => {
    openAuthModal()
    navigate('/')
  }, [navigate, openAuthModal])

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
    if (question.type === 'single-choice') return !!answer
    if (question.type === 'multi-choice') return Array.isArray(answer) && answer.length > 0
    if (question.type === 'input') return typeof answer === 'string' && answer.trim().length > 0
    return false
  }

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="wait">
        {isAnalyzing ? (
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
        ) : (
          <m.div 
            key="questions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="onboarding-container"
          >
            <div className="onboarding-inner onboarding-inner--mobile-responsive">
          <div className="onboarding-header">
            {currentStep > 0 && (
              <div className="onboarding-nav-top">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="rounded-full"
                >
                  <CaretLeft size={24} weight="bold" />
                </Button>
                
                <div className="onboarding-brand">
                  <FlowerLotus size={28} weight="duotone" className="text-primary" />
                  <span className="onboarding-brand-text">MensFlow</span>
                </div>

                <Button
                  variant="ghost"
                  onClick={handleNext}
                  className="onboarding-skip-btn"
                >
                  Skip
                </Button>
              </div>
            )}

            {currentStep === 0 && (
              <div className="onboarding-brand-centered">
                <FlowerLotus size={32} weight="duotone" className="text-primary" />
                <span className="onboarding-brand-text-lg">MensFlow</span>
              </div>
            )}
            
            {currentStep > 0 && (
              <div className="flex flex-col gap-2 w-full mt-4">
                <div className="flex justify-center text-sm font-medium text-muted-foreground tracking-wide">
                  {currentStep} / {ONBOARDING_QUESTIONS.length - 1}
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
                <p className="onboarding-description text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis px-2 max-w-full">{question.description}</p>
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
                              <span className="onboarding-option-icon onboarding-option-icon--mobile">{getIcon(option.icon as string)}</span>
                            ) : null}
                            <span className="onboarding-option-label onboarding-option-label--mobile">{option.label}</span>
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

          <footer className="onboarding-footer">
            <div className="onboarding-footer-inner">
              <Button
                onClick={handleNext}
                disabled={currentStep !== 0 && !isStepValid()}
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
          </div>
        </m.div>
      )}
      </AnimatePresence>
    </LazyMotion>
  )
}
