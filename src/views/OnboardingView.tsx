import { useState, useCallback } from 'react' 
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/useAuth'
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
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const { isAuthenticated, completeOnboarding, openAuthModal } = useAuth()
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
    completeOnboarding()
    if (isAuthenticated) {
      navigate('/dashboard')
    } else {
      openAuthModal()
      navigate('/')
    }
  }, [completeOnboarding, isAuthenticated, navigate, openAuthModal])

  const handleNext = useCallback(() => {
    if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      setIsAnalyzing(true)
      setTimeout(() => {
        finishOnboarding()
      }, 2500)
    }
  }, [currentStep, finishOnboarding])

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
      const currentAnswers = answers[question.id] || []
      const nextAnswers = currentAnswers.includes(value)
        ? currentAnswers.filter((v: string) => v !== value)
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
    if (question.type === 'multi-choice') return answer && answer.length > 0
    if (question.type === 'input') return answer && answer.trim().length > 0
    return false
  }

  if (isAnalyzing) {
    return (
      <div className="onboarding-container onboarding-container--analyzing">
        <div className="onboarding-analyzing-content">
          <div className="onboarding-loader-wrap">
            <div className="onboarding-loader-ring-outer" />
            <div className="onboarding-loader-ring-mid" />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="onboarding-loader-circle"
            >
              <div className="onboarding-loader-inner" />
            </motion.div>
          </div>
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="onboarding-analyzing-title"
          >
            Personalizing your experience...
          </motion.h2>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="onboarding-analyzing-sub"
          >
            Creating your custom health dashboard based on your goals and symptoms.
          </motion.p>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-container">
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
            <div className="onboarding-progress-wrap">
              <div 
                className="onboarding-progress-bar" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          )}
        </div>

        <main className="onboarding-main">
          <AnimatePresence mode="wait">
            <motion.div
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
              <motion.div
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
              </motion.div>
            )}
            
            <h1 className="onboarding-title">{question.question}</h1>
            {question.description && (
              <p className="onboarding-description">{question.description}</p>
            )}

              <div className="onboarding-options-grid onboarding-options-grid--mobile-responsive">
                {question.type === 'input' ? (
                  <div className="onboarding-input-wrap onboarding-input-wrap--mobile">
                    <Input
                      value={answers[question.id] || ''}
                      onChange={handleInputChange}
                      className="onboarding-text-input onboarding-text-input--mobile"
                      autoFocus
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
                          {option.icon && (
                            <span className="onboarding-option-icon onboarding-option-icon--mobile">{getIcon(option.icon as string)}</span>
                          )}
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
            </motion.div>
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
    </div>
  )
}
