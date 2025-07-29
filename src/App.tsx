import { useEffect, useRef, useState } from 'react'
import { useStore } from './store'
import { RecordingHistory } from './components/RecordingHistory'
import { AudioVisualizer } from './components/AudioVisualizer'
import { transcribeAudio, postProcessTranscript } from './lib/api'
import { Recorder } from './lib/recorder'
import { PromptEditor } from './components/PromptEditor'
import { getCustomPrompt, setCustomPrompt } from './lib/api'

const VISUALIZER_BUFFER_LENGTH = 50

export default function App() {
  const [visualizerData, setVisualizerData] = useState<number[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false)
  const recorderRef = useRef<Recorder | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { addRecording } = useStore()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' && !isRecording) {
        startRecording()
      } else if (e.key === '/' && e.ctrlKey && !isRecording) {
        startRecording()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' && isRecording) {
        stopRecording()
      } else if (e.key === '/' && e.ctrlKey && isRecording) {
        stopRecording()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isRecording])

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const startRecording = async () => {
    if (!recorderRef.current) {
      recorderRef.current = new Recorder()
      
      recorderRef.current.on('record-start', () => {
        setIsRecording(true)
      })

      recorderRef.current.on('visualizer-data', (rms: number) => {
        setVisualizerData(prev => {
          const newData = [...prev, rms]
          if (newData.length > VISUALIZER_BUFFER_LENGTH) {
            newData.shift()
          }
          return newData
        })
      })
    }

    try {
      await recorderRef.current.startRecording()
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  const stopRecording = async () => {
    if (!recorderRef.current) return

    try {
      setIsProcessing(true)
      recorderRef.current.stopRecording()
      
      // Wait for the record-end event
      const { blob: audioBlob, duration } = await new Promise<{ blob: Blob, duration: number }>((resolve) => {
        recorderRef.current?.once('record-end', (blob: Blob, duration: number) => {
          resolve({ blob, duration })
        })
      })

      setIsRecording(false)
      setVisualizerData([])

      const originalText = await transcribeAudio(audioBlob)
      const text = await postProcessTranscript(originalText)
      
      addRecording({
        id: Date.now().toString(),
        text,
        originalText,
        duration,
        audioBlob,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to stop recording:', error)
    } finally {
      setIsProcessing(false)
      recorderRef.current = null
    }
  }

  return (
    <div className="min-h-screen p-8 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold dark:text-white">IELTS TALK</h1>
          
          {/* 下拉菜单按钮 */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-2xl font-medium text-black dark:text-white hover:opacity-70 transition-opacity"
            >
              {isMenuOpen ? '×' : '+'}
            </button>

            {/* 下拉菜单 */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false)
                    if (!isRecording && !isProcessing) {
                      startRecording()
                    }
                  }}
                  disabled={isProcessing || isRecording}
                >
                  开始录音
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false)
                    setIsPromptEditorOpen(true)
                  }}
                >
                  Edit Prompt
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false)
                  }}
                >
                  设置
                </button>
              </div>
            )}
          </div>

          {/* Prompt 编辑器 */}
          <PromptEditor
            isOpen={isPromptEditorOpen}
            onClose={() => setIsPromptEditorOpen(false)}
            onSave={(prompt) => {
              setCustomPrompt(prompt)
            }}
            initialPrompt={getCustomPrompt()}
          />
        </div>

        {/* 录音区域 */}
        <div className="p-8 mb-8 rounded-3xl bg-white/50 dark:bg-gray-800/30 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-lg transition-all duration-300">
          <div className="flex flex-col items-center justify-center p-4 space-y-6">
            <button
              onClick={handleRecordClick}
              disabled={isProcessing}
              className={`
                w-full max-w-md px-8 py-4 rounded-2xl text-xl font-medium
                transition-all duration-300 relative overflow-hidden
                ${isRecording 
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20' 
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
              `}
            >
              {isProcessing ? 'Processing...' : isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>

            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <kbd className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 shadow-sm">Ctrl</kbd>
                <span className="text-gray-400">or</span>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 shadow-sm">Ctrl</kbd>
                  <span className="text-gray-400">+</span>
                  <kbd className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 shadow-sm">/</kbd>
                </div>
              </div>
              <span className="text-sm text-gray-400">Press and hold to record</span>
            </div>

            {isRecording && (
              <div className="w-full max-w-md pt-4">
                <AudioVisualizer data={visualizerData} />
              </div>
            )}
          </div>
        </div>

        {/* 历史记录 */}
        <div className="mt-8 space-y-4">
          <RecordingHistory />
        </div>
      </div>
    </div>
  )
}
