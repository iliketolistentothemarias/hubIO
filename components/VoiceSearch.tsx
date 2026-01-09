'use client'

/**
 * Voice Search Component
 * 
 * Voice-activated search using Web Speech API
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, X } from 'lucide-react'

interface VoiceSearchProps {
  onResult: (query: string) => void
  onClose?: () => void
}

export default function VoiceSearch({ onResult, onClose }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Check for browser support
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || 
                               (window as any).webkitSpeechRecognition
      
      if (SpeechRecognition) {
        setIsSupported(true)
        const Recognition = new SpeechRecognition()
        Recognition.continuous = false
        Recognition.interimResults = true
        Recognition.lang = 'en-US'

        Recognition.onstart = () => {
          setIsListening(true)
          setError(null)
        }

        Recognition.onresult = (event: any) => {
          let interimTranscript = ''
          let finalTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' '
            } else {
              interimTranscript += transcript
            }
          }

          setTranscript(finalTranscript || interimTranscript)
          
          if (finalTranscript) {
            onResult(finalTranscript.trim())
            stopListening()
          }
        }

        Recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setError(getErrorMessage(event.error))
          setIsListening(false)
        }

        Recognition.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = Recognition
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onResult])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript('')
        setError(null)
        recognitionRef.current.start()
      } catch (err) {
        console.error('Error starting recognition:', err)
        setError('Failed to start voice recognition')
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'no-speech':
        return 'No speech detected. Please try again.'
      case 'audio-capture':
        return 'No microphone found. Please check your microphone settings.'
      case 'not-allowed':
        return 'Microphone permission denied. Please allow microphone access.'
      case 'network':
        return 'Network error. Please check your connection.'
      default:
        return 'An error occurred. Please try again.'
    }
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Voice search is not supported in your browser. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={stopListening}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500 flex items-center justify-center"
                >
                  <Mic className="w-12 h-12 text-white" />
                </motion.div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Listening...
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {transcript || 'Speak your search query'}
                </p>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}
                
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={stopListening}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg 
                             hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Stop
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={isListening ? stopListening : startListening}
        className={`p-3 rounded-full transition-all ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-400'
        }`}
        title="Voice Search"
      >
        {isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>
    </div>
  )
}

