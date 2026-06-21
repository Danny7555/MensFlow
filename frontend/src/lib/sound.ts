import { useStore } from '../store/useStore'

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioContextClass = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return null
  return new AudioContextClass()
}

export function playTickSound() {
  try {
    const enabled = useStore.getState().settings.soundEffectsEnabled
    if (!enabled) return
    
    const ctx = getAudioContext()
    if (!ctx) return
    
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.04)
    
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04)
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    osc.start()
    osc.stop(ctx.currentTime + 0.04)
  } catch (e) {
    console.warn("Tick sound failed to play:", e)
  }
}

export function playSuccessSound() {
  try {
    const enabled = useStore.getState().settings.soundEffectsEnabled
    if (!enabled) return
    
    const ctx = getAudioContext()
    if (!ctx) return
    
    const playNote = (freq: number, startTime: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, startTime)
      
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start(startTime)
      osc.stop(startTime + duration)
    }
    
    const now = ctx.currentTime
    // Ascending arpeggio (C major pentatonic style: C5 - E5 - G5 - C6)
    playNote(523.25, now, 0.4, 0.06)
    playNote(659.25, now + 0.08, 0.4, 0.06)
    playNote(783.99, now + 0.16, 0.4, 0.06)
    playNote(1046.50, now + 0.24, 0.5, 0.06)
  } catch (e) {
    console.warn("Success sound failed to play:", e)
  }
}

export function playFaceIDScanSound() {
  try {
    const enabled = useStore.getState().settings.soundEffectsEnabled
    if (!enabled) return
    
    const ctx = getAudioContext()
    if (!ctx) return
    
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.01)
    
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.001)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.01)
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    osc.start()
    osc.stop(ctx.currentTime + 0.015)
  } catch (e) {
    console.warn("Scan sound failed to play:", e)
  }
}

export function playFaceIDSuccessSound() {
  try {
    const enabled = useStore.getState().settings.soundEffectsEnabled
    if (!enabled) return
    
    const ctx = getAudioContext()
    if (!ctx) return
    
    const now = ctx.currentTime
    
    const playNote = (freq: number, start: number, dur: number, type: OscillatorType, vol: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, start)
      
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(vol, start + 0.08)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + dur)
    }
    
    // Apple-style modern double-tone unlock chime: E5 followed by A5
    playNote(659.25, now, 0.55, 'sine', 0.08)
    playNote(880.00, now + 0.08, 0.7, 'sine', 0.08)
    
    // Add warm supportive chord backing (Amaj9 feel)
    playNote(329.63, now, 0.6, 'triangle', 0.04) // E4
    playNote(440.00, now + 0.05, 0.65, 'triangle', 0.03) // A4
    playNote(554.37, now + 0.1, 0.7, 'sine', 0.02) // C#5
  } catch (e) {
    console.warn("FaceID success sound failed to play:", e)
  }
}

export function playNotificationSound() {
  try {
    const enabled = useStore.getState().settings.soundEffectsEnabled
    if (!enabled) return
    
    const ctx = getAudioContext()
    if (!ctx) return
    
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(frequency, startTime)
      
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start(startTime)
      osc.stop(startTime + duration)
    }
    
    const now = ctx.currentTime
    playNote(523.25, now, 0.3)
    playNote(659.25, now + 0.12, 0.4)
  } catch (e) {
    console.warn("Web Audio failed to play:", e)
  }
}
