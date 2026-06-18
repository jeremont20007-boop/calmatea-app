'use client'

/**
 * Web Audio API engine para generar sonidos relajantes proceduralmente.
 * No requiere archivos MP3 — funciona completamente offline.
 */

export type SoundType = 'rain' | 'ocean' | 'white_noise' | 'brown_noise' | 'forest'

interface AudioNodes {
  ctx: AudioContext
  masterGain: GainNode
  sources: AudioNode[]
  stop: () => void
}

let currentNodes: AudioNodes | null = null

// ─── Generadores de ruido base ──────────────────────────────────────────────

function createWhiteNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = sampleRate * seconds
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}

function createBrownNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = sampleRate * seconds
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)
  let lastOut = 0
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    lastOut = (lastOut + 0.02 * white) / 1.02
    data[i] = lastOut * 3.5
  }
  return buffer
}

function loopBuffer(ctx: AudioContext, buffer: AudioBuffer, gain: GainNode): AudioBufferSourceNode {
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true
  source.connect(gain)
  source.start()
  return source
}

// ─── Sonido: Lluvia ─────────────────────────────────────────────────────────

function startRain(ctx: AudioContext, masterGain: GainNode): AudioNode[] {
  const nodes: AudioNode[] = []

  // Ruido base (lluvia continua)
  const noiseGain = ctx.createGain()
  noiseGain.gain.value = 0.35
  noiseGain.connect(masterGain)
  nodes.push(noiseGain)

  const buffer = createWhiteNoiseBuffer(ctx, 3)
  const source = loopBuffer(ctx, buffer, noiseGain)
  nodes.push(source)

  // Filtro paso-alto para textura de lluvia
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 1800
  filter.Q.value = 0.5

  const filteredGain = ctx.createGain()
  filteredGain.gain.value = 0.15
  filteredGain.connect(masterGain)
  nodes.push(filteredGain)
  nodes.push(filter)

  const source2 = ctx.createBufferSource()
  source2.buffer = createWhiteNoiseBuffer(ctx, 2)
  source2.loop = true
  source2.connect(filter)
  filter.connect(filteredGain)
  source2.start()
  nodes.push(source2)

  // Gotas ocasionales (LFO sobre ganancia)
  const lfo = ctx.createOscillator()
  lfo.type = 'sawtooth'
  lfo.frequency.value = 7

  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.06
  lfo.connect(lfoGain)
  lfoGain.connect(noiseGain.gain)
  lfo.start()
  nodes.push(lfo, lfoGain)

  return nodes
}

// ─── Sonido: Mar / Océano ────────────────────────────────────────────────────

function startOcean(ctx: AudioContext, masterGain: GainNode): AudioNode[] {
  const nodes: AudioNode[] = []

  const buffer = createBrownNoiseBuffer(ctx, 4)

  // Olas — modulación lenta de amplitud
  for (let i = 0; i < 3; i++) {
    const waveGain = ctx.createGain()
    waveGain.gain.value = 0.0
    waveGain.connect(masterGain)

    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 0.08 + i * 0.03 // períodos distintos por ola
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.25
    lfo.connect(lfoGain)
    lfoGain.connect(waveGain.gain)
    lfo.start(ctx.currentTime + i * 2) // desfase entre olas

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 600 + i * 200

    source.connect(filter)
    filter.connect(waveGain)
    source.start()

    nodes.push(waveGain, lfo, lfoGain, source, filter)
  }

  // Espuma — ruido blanco con filtro de paso alto tenue
  const foamGain = ctx.createGain()
  foamGain.gain.value = 0.04
  foamGain.connect(masterGain)

  const foamFilter = ctx.createBiquadFilter()
  foamFilter.type = 'highpass'
  foamFilter.frequency.value = 3000

  const foamSource = ctx.createBufferSource()
  foamSource.buffer = createWhiteNoiseBuffer(ctx, 2)
  foamSource.loop = true
  foamSource.connect(foamFilter)
  foamFilter.connect(foamGain)
  foamSource.start()

  nodes.push(foamGain, foamFilter, foamSource)
  return nodes
}

// ─── Sonido: Ruido Blanco ────────────────────────────────────────────────────

function startWhiteNoise(ctx: AudioContext, masterGain: GainNode): AudioNode[] {
  const gain = ctx.createGain()
  gain.gain.value = 0.4
  gain.connect(masterGain)

  const source = loopBuffer(ctx, createWhiteNoiseBuffer(ctx, 3), gain)
  return [gain, source]
}

// ─── Sonido: Ruido Marrón ────────────────────────────────────────────────────

function startBrownNoise(ctx: AudioContext, masterGain: GainNode): AudioNode[] {
  const gain = ctx.createGain()
  gain.gain.value = 0.6
  gain.connect(masterGain)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 400
  filter.connect(gain)

  const source = loopBuffer(ctx, createBrownNoiseBuffer(ctx, 4), filter)
  return [gain, filter, source]
}

// ─── Sonido: Bosque ──────────────────────────────────────────────────────────

function startForest(ctx: AudioContext, masterGain: GainNode): AudioNode[] {
  const nodes: AudioNode[] = []

  // Viento suave de fondo
  const windGain = ctx.createGain()
  windGain.gain.value = 0.1
  windGain.connect(masterGain)

  const windFilter = ctx.createBiquadFilter()
  windFilter.type = 'bandpass'
  windFilter.frequency.value = 400
  windFilter.Q.value = 0.3
  windFilter.connect(windGain)

  const windSource = ctx.createBufferSource()
  windSource.buffer = createWhiteNoiseBuffer(ctx, 4)
  windSource.loop = true
  windSource.connect(windFilter)
  windSource.start()

  // LFO para que el viento suba y baje
  const windLfo = ctx.createOscillator()
  windLfo.frequency.value = 0.12
  const windLfoGain = ctx.createGain()
  windLfoGain.gain.value = 0.07
  windLfo.connect(windLfoGain)
  windLfoGain.connect(windGain.gain)
  windLfo.start()

  nodes.push(windGain, windFilter, windSource, windLfo, windLfoGain)

  // Pájaros — tonos sintéticos breves y repetitivos
  const birdFreqs = [1800, 2400, 2000, 1600]
  birdFreqs.forEach((freq, i) => {
    scheduleBird(ctx, masterGain, freq, 3.5 + i * 1.8, nodes)
  })

  // Hojas — ruido de alta frecuencia tenue
  const leavesGain = ctx.createGain()
  leavesGain.gain.value = 0.04
  leavesGain.connect(masterGain)

  const leavesFilter = ctx.createBiquadFilter()
  leavesFilter.type = 'highpass'
  leavesFilter.frequency.value = 5000

  const leavesSource = ctx.createBufferSource()
  leavesSource.buffer = createWhiteNoiseBuffer(ctx, 2)
  leavesSource.loop = true
  leavesSource.connect(leavesFilter)
  leavesFilter.connect(leavesGain)
  leavesSource.start()

  nodes.push(leavesGain, leavesFilter, leavesSource)
  return nodes
}

function scheduleBird(
  ctx: AudioContext,
  dest: GainNode,
  freq: number,
  interval: number,
  nodes: AudioNode[]
) {
  const chirp = () => {
    if (!ctx || ctx.state === 'closed') return

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    gain.connect(dest)

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(freq * 1.3, ctx.currentTime + 0.1)
    osc.frequency.linearRampToValueAtTime(freq * 0.9, ctx.currentTime + 0.25)
    osc.connect(gain)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.35)

    nodes.push(gain, osc)

    // Jitter aleatorio para naturalidad
    const jitter = (Math.random() - 0.5) * interval * 0.4
    setTimeout(chirp, (interval + jitter) * 1000)
  }

  const initialDelay = Math.random() * interval * 1000
  setTimeout(chirp, initialDelay)
}

// ─── API pública ─────────────────────────────────────────────────────────────

export async function startSound(type: SoundType, volume = 0.7): Promise<() => void> {
  stopSound()

  const ctx = new AudioContext()
  await ctx.resume()

  const masterGain = ctx.createGain()
  masterGain.gain.value = volume
  masterGain.connect(ctx.destination)

  let sources: AudioNode[] = []

  switch (type) {
    case 'rain':        sources = startRain(ctx, masterGain); break
    case 'ocean':       sources = startOcean(ctx, masterGain); break
    case 'white_noise': sources = startWhiteNoise(ctx, masterGain); break
    case 'brown_noise': sources = startBrownNoise(ctx, masterGain); break
    case 'forest':      sources = startForest(ctx, masterGain); break
  }

  currentNodes = {
    ctx,
    masterGain,
    sources,
    stop: () => {
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)
      setTimeout(() => ctx.close(), 600)
    },
  }

  return () => stopSound()
}

export function stopSound() {
  if (currentNodes) {
    try { currentNodes.stop() } catch {}
    currentNodes = null
  }
}

export function setVolume(volume: number) {
  if (currentNodes) {
    currentNodes.masterGain.gain.linearRampToValueAtTime(
      volume,
      currentNodes.ctx.currentTime + 0.1
    )
  }
}
