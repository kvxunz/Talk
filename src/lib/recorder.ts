import EventEmitter from './event-emitter'

const MIN_DECIBELS = -45

export class Recorder extends EventEmitter {
  private mediaRecorder: MediaRecorder | null = null
  private stream: MediaStream | null = null

  async startRecording() {
    this.stopRecording()

    try {
      const stream = (this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: 'default',
        },
        video: false,
      }))

      const mediaRecorder = (this.mediaRecorder = new MediaRecorder(stream, {
        audioBitsPerSecond: 128e3,
      }))

      let audioChunks: Blob[] = []
      let startTime = Date.now()

      mediaRecorder.onstart = () => {
        startTime = Date.now()
        this.emit('record-start')
        const stopAnalysing = this.analyseAudio(stream)
        this.once('destroy', stopAnalysing)
      }

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const duration = Date.now() - startTime
        const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType })
        this.emit('record-end', blob, duration)
        audioChunks = []
      }

      mediaRecorder.start()
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        throw new Error('麦克风访问被拒绝。请在浏览器设置中允许访问麦克风，然后重试。')
      } else if (error instanceof DOMException && error.name === 'NotFoundError') {
        throw new Error('未找到麦克风设备。请确保您的设备有可用的麦克风。')
      } else {
        console.error('录音错误:', error)
        throw new Error('启动录音时出现错误。请确保您的浏览器支持录音功能，并且麦克风可用。')
      }
    }
  }

  stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop()
      this.mediaRecorder = null
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }

    this.emit('destroy')
  }

  private analyseAudio(stream: MediaStream) {
    let processFrameTimer: number | null = null

    const audioContext = new AudioContext()
    const audioStreamSource = audioContext.createMediaStreamSource(stream)

    const analyser = audioContext.createAnalyser()
    analyser.minDecibels = MIN_DECIBELS
    audioStreamSource.connect(analyser)

    const bufferLength = analyser.frequencyBinCount
    const domainData = new Uint8Array(bufferLength)
    const timeDomainData = new Uint8Array(analyser.fftSize)

    const animate = (fn: () => void) => {
      processFrameTimer = requestAnimationFrame(fn)
    }

    const detectSound = () => {
      const processFrame = () => {
        analyser.getByteTimeDomainData(timeDomainData)
        analyser.getByteFrequencyData(domainData)

        // Calculate RMS level
        let sum = 0
        for (let i = 0; i < timeDomainData.length; i++) {
          sum += Math.pow((timeDomainData[i] - 128) / 128, 2)
        }
        const rms = Math.sqrt(sum / timeDomainData.length)

        this.emit('visualizer-data', rms)
        animate(processFrame)
      }

      animate(processFrame)
    }

    detectSound()

    return () => {
      processFrameTimer && cancelAnimationFrame(processFrameTimer)
      audioStreamSource.disconnect()
      audioContext.close()
    }
  }
}
