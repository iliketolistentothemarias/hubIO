'use client'

/**
 * AI Assistant Component (CiviBot)
 * 
 * Conversational AI assistant that helps users navigate the platform.
 * Provides intelligent recommendations and answers questions.
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X, Bot, Sparkles } from 'lucide-react'
import LiquidGlass from './LiquidGlass'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: any[]
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm CiviBot, your community assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input }),
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: data.data.message,
          timestamp: new Date(),
          suggestions: data.data.suggestions,
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-primary-600 to-secondary-600 
                   text-white rounded-full shadow-2xl flex items-center justify-center
                   hover:shadow-3xl transition-all duration-300"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 w-96 h-[600px] flex flex-col"
          >
            <LiquidGlass intensity="strong">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-white/20 dark:border-gray-700/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-400 to-secondary-400 
                                flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">CiviBot</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">AI Community Assistant</div>
                  </div>
                  <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400 ml-auto" />
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-3 ${
                          message.role === 'user'
                            ? 'bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18]'
                            : 'bg-white dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0]'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/20 dark:border-gray-700/30">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask me anything..."
                      className="flex-1 px-4 py-2 rounded-2xl bg-white/80 dark:bg-gray-800/80 
                               text-gray-900 dark:text-white border border-white/30 dark:border-gray-700/30
                               focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white 
                               rounded-2xl hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </LiquidGlass>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

