import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import dayjs from 'dayjs'
import { ttsService } from '../lib/tts'
import { getCurrentLanguage } from '../lib/api'
import { detectLanguage } from '../lib/language-detector'

export function RecordingHistory() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const { recordings, loadRecordings, deleteRecording } = useStore()

  useEffect(() => {
    loadRecordings()
  }, [loadRecordings])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      audio.currentTime = 0
    }

    audio.addEventListener('ended', handleEnded)
    return () => {
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const playAudio = async (blob: Blob) => {
    if (audioRef.current) {
      const url = URL.createObjectURL(blob)
      audioRef.current.src = url
      await audioRef.current.play()
      // Clean up the URL after playback
      audioRef.current.onended = () => URL.revokeObjectURL(url)
    }
  }

  const playText = async (text: string, isOriginal: boolean) => {
    try {
      // 对于原文，使用检测到的语言；对于翻译文本，使用目标语言
      const lang = isOriginal ? detectLanguage(text) : getCurrentLanguage()
      console.log(`Playing ${isOriginal ? 'original' : 'translated'} text with language: ${lang}`)
      await ttsService.playText(text, lang)
    } catch (error) {
      console.error('Failed to play text:', error)
    }
  }

  // 复制文本到剪贴板的函数
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // 可以添加一个通知提示复制成功
      console.log('Text copied to clipboard')
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  if (recordings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <p className="text-lg">No recordings yet</p>
        <p className="text-sm mt-2">Start recording to see your history here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <audio ref={audioRef} className="hidden" />
      {recordings.map((recording) => (
        <div key={recording.id} className="bg-white/50 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          {/* 顶部信息栏和删除按钮 */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {dayjs(recording.timestamp).format('YYYY-MM-DD HH:mm:ss')} · {(recording.duration / 1000).toFixed(1)}s
            </div>
            <button 
              onClick={() => deleteRecording(recording.id)}
              className="text-red-500/70 hover:text-red-500 transition-colors"
              aria-label="Delete recording"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* 翻译文本和复制按钮 */}
          <div className="flex justify-between items-start mb-2">
            <div className="text-base text-gray-900 dark:text-white leading-relaxed break-words pr-2 flex-grow">
              {recording.text}
            </div>
            <button
              onClick={() => copyToClipboard(recording.text)}
              className="flex-shrink-0 text-gray-400 hover:text-blue-500 ml-2 mt-1 transition-colors"
              aria-label="Copy translation"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002-2h2a2 2 0 012 2M8 5a2 2 0 012 2h2a2 2 0 00-2-2m0 0h6a2 2 0 012 2v10a2 2 0 01-2 2h-6a2 2 0 01-2-2V7a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* 原文和复制按钮 */}
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 break-words pr-2 flex-grow">
              {recording.originalText}
            </div>
            <button
              onClick={() => copyToClipboard(recording.originalText)}
              className="flex-shrink-0 text-gray-400 hover:text-blue-500 ml-2 transition-colors"
              aria-label="Copy original text"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002-2h2a2 2 0 012 2M8 5a2 2 0 012 2h2a2 2 0 00-2-2m0 0h6a2 2 0 012 2v10a2 2 0 01-2 2h-6a2 2 0 01-2-2V7a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* 操作按钮组 */}
          <div className="grid grid-cols-3 gap-2 mt-auto">
            {recording.audioBlob && (
              <button
                onClick={() => playAudio(recording.audioBlob!)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-medium transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Audio</span>
              </button>
            )}
            <button
              onClick={() => playText(recording.text, false)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 text-xs font-medium transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>Translation</span>
            </button>
            <button
              onClick={() => playText(recording.originalText, true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-medium transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>Original</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
