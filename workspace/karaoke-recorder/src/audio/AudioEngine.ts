export type RecordingOptions = {
  mimeType?: string
  audioBitsPerSecond?: number
}

export type RecordingResult = {
  blob: Blob
  url: string
}

export type InputDevice = {
  deviceId: string
  label: string
}

export class AudioEngine {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private micGain: GainNode | null = null
  private trackGain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private mixDestination: MediaStreamAudioDestinationNode | null = null

  private micStream: MediaStream | null = null
  private micSource: MediaStreamAudioSourceNode | null = null

  private trackElement: HTMLAudioElement | null = null
  // Keep a reference for lifecycle, even if not read directly
  private trackSource: MediaElementAudioSourceNode | null = null

  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []

  private levelBuffer: Float32Array | null = null

  async init(): Promise<void> {
    if (this.audioContext) return
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    this.masterGain = this.audioContext.createGain()
    this.masterGain.gain.value = 1

    this.micGain = this.audioContext.createGain()
    this.micGain.gain.value = 1

    this.trackGain = this.audioContext.createGain()
    this.trackGain.gain.value = 1

    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 2048

    this.mixDestination = this.audioContext.createMediaStreamDestination()

    // Connect master: master -> analyser -> destination
    this.masterGain.connect(this.analyser)
    this.analyser.connect(this.audioContext.destination)

    // Also route master to the mix destination for recording
    this.masterGain.connect(this.mixDestination)

    // Prime level buffer
    this.levelBuffer = new Float32Array(this.analyser.frequencyBinCount)
  }

  attachTrackElement(el: HTMLAudioElement): void {
    if (this.trackElement === el) return
    this.trackElement = el
    if (!this.audioContext) return
    if (!this.trackSource) {
      this.trackSource = this.audioContext.createMediaElementSource(el)
      this.trackSource.connect(this.trackGain!)
      this.trackGain!.connect(this.masterGain!)
    }
  }

  async setMicDevice(deviceId?: string): Promise<void> {
    await this.ensureContext()

    // Stop any existing tracks
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop())
      this.micStream = null
    }

    const constraints: MediaStreamConstraints = {
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
        channelCount: 1
      },
      video: false
    }

    this.micStream = await navigator.mediaDevices.getUserMedia(constraints)

    if (this.micSource) {
      try { this.micSource.disconnect() } catch {}
      this.micSource = null
    }

    this.micSource = this.audioContext!.createMediaStreamSource(this.micStream)
    this.micSource.connect(this.micGain!)
    this.micGain!.connect(this.masterGain!)
  }

  async listInputDevices(): Promise<InputDevice[]> {
    // Ensure at least one getUserMedia call happened for labels
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    } catch {}
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices
      .filter(d => d.kind === 'audioinput')
      .map(d => ({ deviceId: d.deviceId, label: d.label || 'Microphone' }))
  }

  setMicGain(value: number): void {
    if (this.micGain) this.micGain.gain.value = value
  }

  setTrackGain(value: number): void {
    if (this.trackGain) this.trackGain.gain.value = value
  }

  setMasterGain(value: number): void {
    if (this.masterGain) this.masterGain.gain.value = value
  }

  async startRecording(options?: RecordingOptions): Promise<void> {
    await this.ensureContext()
    if (!this.mixDestination) throw new Error('Audio engine not initialized')

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') return

    const mimeCandidates = [
      options?.mimeType,
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/webm',
    ].filter(Boolean) as string[]

    let mimeType: string | undefined
    for (const m of mimeCandidates) {
      if (m && MediaRecorder.isTypeSupported(m)) { mimeType = m; break }
    }

    const init: MediaRecorderOptions = {}
    if (mimeType) init.mimeType = mimeType
    if (options?.audioBitsPerSecond) init.audioBitsPerSecond = options.audioBitsPerSecond

    this.recordedChunks = []
    this.mediaRecorder = new MediaRecorder(this.mixDestination.stream, init)

    this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) this.recordedChunks.push(e.data)
    }

    this.mediaRecorder.start()
  }

  async stopRecording(): Promise<RecordingResult> {
    if (!this.mediaRecorder) throw new Error('No active recording')

    const done = new Promise<RecordingResult>((resolve) => {
      const recorder = this.mediaRecorder!
      recorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: recorder.mimeType || 'audio/webm' })
        const url = URL.createObjectURL(blob)
        resolve({ blob, url })
      }
    })

    this.mediaRecorder.stop()
    return done
  }

  isRecording(): boolean {
    return !!this.mediaRecorder && this.mediaRecorder.state === 'recording'
  }

  async ensureContext(): Promise<void> {
    await this.init()
    if (this.audioContext && this.audioContext.state !== 'running') {
      await this.audioContext.resume()
    }
  }

  getMixLevel(): number {
    if (!this.analyser) return 0
    const bufferLength = this.analyser.fftSize
    if (!this.levelBuffer || this.levelBuffer.length !== bufferLength) {
      this.levelBuffer = new Float32Array(bufferLength)
    }
    this.analyser.getFloatTimeDomainData(this.levelBuffer)
    let sumSquares = 0
    for (let i = 0; i < bufferLength; i++) {
      const v = this.levelBuffer[i]
      sumSquares += v * v
    }
    const rms = Math.sqrt(sumSquares / bufferLength)
    return Math.min(1, rms)
  }

  destroy(): void {
    try { if (this.micSource) this.micSource.disconnect() } catch {}
    try { if (this.trackSource) this.trackSource.disconnect() } catch {}
    try { if (this.masterGain) this.masterGain.disconnect() } catch {}
    try { if (this.analyser) this.analyser.disconnect() } catch {}

    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop())
    }
    if (this.audioContext) {
      this.audioContext.close()
    }

    this.audioContext = null
    this.masterGain = null
    this.micGain = null
    this.trackGain = null
    this.analyser = null
    this.mixDestination = null
    this.micStream = null
    this.micSource = null
    this.trackElement = null
    this.trackSource = null
    this.mediaRecorder = null
    this.recordedChunks = []
    this.levelBuffer = null
  }
}