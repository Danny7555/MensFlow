import { useState } from 'react'
import { ArrowRight, Check } from '@phosphor-icons/react'
import { useStore } from '../../store/useStore'
import { toast } from 'sonner'

interface TranslationResult {
  biologicalContext: string
  coreNeed: string
  actions: string[]
  quickReply: string
}

interface PhaseStyle {
  accentColor: string
  accentBg: string
  borderColor: string
  badgeText: string
}

const getPhaseStyle = (phase: string): PhaseStyle => {
  const normalized = (phase || '').toLowerCase()
  if (normalized.includes('menstrual')) {
    return {
      accentColor: 'text-rose-500',
      accentBg: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      badgeText: 'Menstrual Decode'
    }
  }
  if (normalized.includes('follicular')) {
    return {
      accentColor: 'text-amber-500',
      accentBg: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      badgeText: 'Follicular Decode'
    }
  }
  if (normalized.includes('ovulatory') || normalized.includes('fertile') || normalized.includes('window')) {
    return {
      accentColor: 'text-teal-500',
      accentBg: 'bg-teal-500/10',
      borderColor: 'border-teal-500/20',
      badgeText: 'Ovulatory Decode'
    }
  }
  return {
    accentColor: 'text-pink-500',
    accentBg: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    badgeText: 'Luteal Decode'
  }
}

const TRANSLATIONS: Record<string, Record<number, TranslationResult>> = {
  menstrual: {
    0: {
      biologicalContext: "Estrogen and progesterone are at their absolute baseline minimums. Her body is actively working to shed the uterine lining, which consumes immense physical energy.",
      coreNeed: "Genuine physical rest and deep pain relief, free from any performance expectations.",
      actions: [
        "Warm up a heating pad or hot water bottle without being asked.",
        "Prepare a warm, soothing drink (like raspberry leaf or ginger tea).",
        "Quietly handle dinner prep and cleanup to let her lie down."
      ],
      quickReply: "I completely understand. Rest up, my love. I've taken care of the household chores today so you don't have to lift a finger. Let me know if I can bring you some warm tea! ❤️"
    },
    1: {
      biologicalContext: "Brain blood flow fluctuates slightly as estrogen starts its cycle. Severe low energy means making even trivial decisions feels like climbing a mountain.",
      coreNeed: "Decision relief. She literally does not have the cognitive bandwidth to choose.",
      actions: [
        "Take charge: Pick 2 simple warm food options (like soup or pasta).",
        "Present the options clearly: 'Would you prefer soup or noodles tonight? I'll get it ready.'",
        "Do not ask open-ended questions like 'What do you want?'"
      ],
      quickReply: "No worries at all, I'll take care of dinner. I can make some warm chicken noodle soup or order our favorite Italian. Just rest, and I'll let you know when it's ready! 🥣"
    },
    2: {
      biologicalContext: "Physical cramping and low hormone levels trigger the nervous system into a protective 'fight-or-flight' survival mode, making social interaction draining.",
      coreNeed: "Uninterrupted quiet space, coupled with the reassurance that you are not upset with her.",
      actions: [
        "Give her physical space immediately, but keep yourself available.",
        "Ensure the room is quiet and warm.",
        "Avoid hover-parenting or constantly checking 'Are you okay?'"
      ],
      quickReply: "Of course. Take all the quiet time you need to rest and recharge. I'm right here in the other room if you need anything at all. Love you! 🕯️"
    },
    3: {
      biologicalContext: "A rapid drop in all hormones changes neuro-chemical pathways, making physical discomfort translate directly into crying spells or sudden emotional vulnerability.",
      coreNeed: "Pure emotional safety. She needs to know her tears are safe and she isn't 'crazy.'",
      actions: [
        "Hold her close if she wants, or simply sit beside her quietly.",
        "Avoid trying to 'fix' the crying or finding logical reasons.",
        "Reassure her that crying is a completely natural physical release."
      ],
      quickReply: "I'm right here with you. It's completely okay to cry and let it all out. You don't have to explain why. I love you and I've got your back. ❤️"
    }
  },
  follicular: {
    0: {
      biologicalContext: "Estrogen is rising steadily, meaning she is starting to regain energy, but may still be recovering from menstrual fatigue.",
      coreNeed: "Gentle motivation and encouragement to ease back into active routines.",
      actions: [
        "Suggest a light, refreshing walk outside together.",
        "Ask how she is feeling energy-wise before planning heavy activities."
      ],
      quickReply: "I hear you, recovering from last week takes time! Let's take it easy today. How about a gentle evening stroll in the park to get some fresh air? 🌳"
    },
    1: {
      biologicalContext: "Rising estrogen sparks creativity and openness to novelty, but she wants to share the experience rather than lead it.",
      coreNeed: "Collaborative and exciting choices. She is open to new culinary ideas!",
      actions: [
        "Suggest trying that new restaurant or recipe you both talked about.",
        "Make it a fun mini-adventure."
      ],
      quickReply: "Perfect, let's try something new tonight! There's a new spot downtown we wanted to check out, or we could try cooking that new recipe together. What sounds more fun? 🌮"
    },
    2: {
      biologicalContext: "Estrogen makes her more social and outgoing. She might want to connect with friends or have focused alone time to organize.",
      coreNeed: "Support for her independent plans and social battery.",
      actions: [
        "Encourage her to book that coffee date with friends.",
        "Offer to give her uninterrupted time for her creative projects."
      ],
      quickReply: "Take all the time you need! You've been wanting to catch up on your reading/projects. Enjoy your solo time, and we can catch up later tonight. 😊"
    },
    3: {
      biologicalContext: "Estrogen levels are rising, so sudden emotional drops are less common, but could indicate stress or over-exertion.",
      coreNeed: "Empathetic listening to identify external stressors (work, sleep).",
      actions: [
        "Listen to what's on her mind without jumping to solve it.",
        "Validate her achievements and hard work."
      ],
      quickReply: "I'm so sorry you're feeling overwhelmed today. Let's sit down and talk about it. I'm here to listen, and we can figure out how to lighten your load together. ☕"
    }
  },
  ovulatory: {
    0: {
      biologicalContext: "Estrogen is at its absolute peak, and testosterone is elevated. She is highly active but might be experiencing ovulation fatigue or slight sensory overload.",
      coreNeed: "Acknowledge her hard work and offer restorative pampering.",
      actions: [
        "Offer a gentle shoulder rub to relieve physical tension.",
        "Encourage her to slow down and enjoy a relaxing bath."
      ],
      quickReply: "You've been giving 110% lately! It's completely natural to feel tired. Let me make you a warm bath, and I can give you a nice shoulder massage to help you unwind. 💆‍♀️"
    },
    1: {
      biologicalContext: "Peak estrogen drives highly confident, social, and adventurous moods. She wants to enjoy vibrant, premium experiences.",
      coreNeed: "Romantic connection, flirting, and highly engaged date activities.",
      actions: [
        "Plan a high-effort surprise date night at a beautiful spot.",
        "Dress up nicely and match her vibrant energy."
      ],
      quickReply: "Let's make tonight special! I'll reserve a table at that gorgeous restaurant we love. Wear that outfit you love, and let's have a wonderful romantic evening together! ✨"
    },
    2: {
      biologicalContext: "High hormones mean high mental focus and social confidence. She is highly self-sufficient and energized.",
      coreNeed: "Supportive autonomy. Reassure her of your connection while celebrating her independence.",
      actions: [
        "Encourage her individual goals, career plans, or social nights.",
        "Send an encouraging message during her busy day."
      ],
      quickReply: "Go shine! I know you're super focused and getting things done today. Have an absolute blast, and I'll be here cheering you on. Can't wait to hear all about it later! 🚀"
    },
    3: {
      biologicalContext: "Estrogen peaks can sometimes cause minor physical cramps (mittelschmerz) or quick emotional spikes due to high intensity.",
      coreNeed: "Reassurance and immediate physical warmth.",
      actions: [
        "Provide comforting words and a warm hug.",
        "Check if she is experiencing ovulation cramps."
      ],
      quickReply: "I'm right here. Sometimes having peak energy can be overwhelming. Come here for a warm hug, and let me know if you need anything at all. You're doing amazing. ❤️"
    }
  },
  luteal: {
    0: {
      biologicalContext: "Progesterone is peaking, which slows digestion and increases sleep needs. The body requires 100-300 extra calories a day, causing sluggishness.",
      coreNeed: "Reassurance that it is completely okay to sleep and be unproductive.",
      actions: [
        "Tuck her in with extra cozy blankets.",
        "Keep the bedroom temperature slightly cooler (progesterone raises body temp).",
        "Quietly handle everything so she doesn't feel guilty for resting."
      ],
      quickReply: "I hear you, progesterone is no joke today! Please go get some cozy rest. I'll make sure the house is quiet and handle everything. Sleep well, sweetheart. 🛌"
    },
    1: {
      biologicalContext: "Serotonin sensitivity changes under progesterone influence, leading to decision fatigue and intense, sudden cravings.",
      coreNeed: "Uncomplicated, simple comfort food without negotiation.",
      actions: [
        "Directly suggest a satisfying comfort option (e.g., burger, warm pasta, or chocolate).",
        "Handle ordering and delivery entirely on your own."
      ],
      quickReply: "I've got this! I know cravings can hit hard during this phase. I'm ordering some cozy comfort food right now. It'll be here in 30 minutes, just relax! 🍔"
    },
    2: {
      biologicalContext: "A sharp drop in estrogen and rising progesterone makes her highly sensitive to sensory overload, noise, and emotional pressure.",
      coreNeed: "Peace, quiet, and zero emotional pressure to perform or converse.",
      actions: [
        "Reassure her: 'I love you, take all the quiet time you need.'",
        "Dim the lights and reduce noise in the living areas.",
        "Avoid taking her quietness personally."
      ],
      quickReply: "I completely understand. Go cozy up and take all the quiet space you need. I'm going to watch a show in the other room. Let me know if you want me to bring you a snack later! 🕯️"
    },
    3: {
      biologicalContext: "The premenstrual drop in progesterone and estrogen triggers a sudden chemical shift in the brain, often causing mood crashes and crying spells without a concrete trigger.",
      coreNeed: "Absolute emotional safety, validation, and zero rationalization.",
      actions: [
        "Comfort her without trying to explain or analyze the situation.",
        "Bring her a comforting snack (like dark chocolate or ice cream).",
        "Quietly perform helpful tasks (chores, folding laundry)."
      ],
      quickReply: "I'm so sorry you're feeling this way, my love. Just let the tears flow—it's completely natural and safe. I'm right here holding you, and we don't need to explain anything. 🍫"
    }
  }
}

const PRESETS = [
  "\"I'm fine, just tired\"",
  "\"I don't care what we eat\"",
  "\"Can you just leave me alone?\"",
  "\"I feel like crying...\""
]

export function EmotionTranslator() {
  const { dashboard } = useStore()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const getPhaseKey = (phaseLabel: string): string => {
    const label = (phaseLabel || '').toLowerCase()
    if (label.includes('menstrual')) return 'menstrual'
    if (label.includes('follicular')) return 'follicular'
    if (label.includes('ovulatory') || label.includes('fertile')) return 'ovulatory'
    return 'luteal'
  }

  const phaseKey = getPhaseKey(dashboard.phaseLabel)
  const translation = selectedIndex !== null ? TRANSLATIONS[phaseKey]?.[selectedIndex] : null
  const theme = getPhaseStyle(dashboard.phaseLabel)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copied to clipboard!", {
      icon: '📋'
    })
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="flo-card flo-card--prominent relative overflow-hidden group transition-all duration-500 mb-8 border border-[var(--mf-border)] !shadow-none">
      <div className="relative z-10 flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`w-fit text-[9px] font-medium uppercase tracking-[0.12em] ${theme.accentBg} ${theme.accentColor} px-3 py-1 rounded-full border ${theme.borderColor}`}>
              {theme.badgeText}
            </span>
            <div className={`flex items-center gap-1.5 text-[10px] ${theme.accentColor} font-medium`}>
              <img src="/images/star.png" alt="Star" className="size-3.5 object-contain" />
              <span>Emotion Translator</span>
            </div>
          </div>
          <h3 className="text-lg font-medium text-[var(--mf-text-strong)] tracking-tight">
            Partner Emotion Translator
          </h3>
          <p className="text-[11px] text-[var(--mf-muted)] mt-1.5 leading-relaxed">
            Translate common phrases during the {dashboard.phaseLabel} Phase into biological context, core needs, and copyable empathetic replies.
          </p>
        </div>

        {/* Preset tags grid */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          {PRESETS.map((preset, idx) => (
            <button
              key={preset}
              onClick={() => setSelectedIndex(idx)}
              type="button"
              className={`text-center py-2.5 px-3 rounded-2xl text-[11px] font-medium transition-all duration-300 border !shadow-none ${
                selectedIndex === idx
                  ? 'bg-[var(--mf-accent)]/10 border-[var(--mf-accent)]/30 text-[var(--mf-accent)] scale-[1.02]'
                  : 'bg-[var(--mf-card)] border-[var(--mf-border)] hover:border-[var(--mf-accent)]/40 text-[var(--mf-text)]'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Translation details card */}
        {translation ? (
          <div className="mt-4 p-4 rounded-2xl bg-[var(--mf-composer-bg)]/80 border border-[var(--mf-border)] animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4 !shadow-none">
            
            {/* Decoded Bio Context */}
            <div className="space-y-1">
              <span className={`flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wider ${theme.accentColor}`}>
                <img src="/images/brain.png" alt="Brain" className="size-3.5 object-contain" /> Decoded Biological Context
              </span>
              <p className="text-[11.5px] text-[var(--mf-text-strong)] leading-relaxed font-normal">
                {translation.biologicalContext}
              </p>
            </div>

            {/* Core Need */}
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wider text-amber-500">
                <img src="/images/heart.png" alt="Heart" className="size-3.5 object-contain" /> Core Need
              </span>
              <p className="text-[11.5px] text-[var(--mf-text-strong)] leading-relaxed font-normal">
                {translation.coreNeed}
              </p>
            </div>

            {/* Recommended Action Checklist */}
            <div className="space-y-1.5 pt-1">
              <span className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wider text-emerald-500">
                <img src="/images/star.png" alt="Action" className="size-3.5 object-contain" /> Recommended Actions
              </span>
              <ul className="space-y-1">
                {translation.actions.map((act) => (
                  <li key={act} className="flex items-start gap-1.5 text-[11px] text-[var(--mf-text)] font-normal leading-relaxed">
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Copyable Empathetic Reply */}
            <div className="pt-3 border-t border-[var(--mf-border)]/50 space-y-2">
              <span className="block text-[9px] font-medium uppercase tracking-wider text-[var(--mf-muted)]">
                Recommended Empathetic Reply
              </span>
              <div className="p-3 rounded-xl bg-[var(--mf-card)] border border-[var(--mf-border)] flex items-center justify-between gap-4 !shadow-none">
                <p className="text-[11.5px] text-[var(--mf-text)] leading-relaxed italic select-all pr-2">
                  {translation.quickReply}
                </p>
                <button
                  onClick={() => handleCopy(translation.quickReply)}
                  type="button"
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                    copied 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : 'bg-pink-500 text-white border-pink-600 hover:opacity-95'
                  }`}
                >
                  {copied ? <Check size={10} weight="bold" /> : <ArrowRight size={10} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="mt-4 py-8 px-4 text-center rounded-2xl bg-[var(--mf-composer-bg)]/40 border border-dashed border-[var(--mf-border)]">
            <img src="/images/brain.png" alt="Brain" className="size-10 object-contain mx-auto opacity-55 mb-2" />
            <p className="text-[11.5px] text-[var(--mf-muted)]">
              Tap any of the common phrases above to decode their underlying message.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
