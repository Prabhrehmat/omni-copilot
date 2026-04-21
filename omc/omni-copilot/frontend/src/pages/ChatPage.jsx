import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, PanelRight } from 'lucide-react'
import ChatMessage from '../components/Chat/ChatMessage'
import TypingIndicator from '../components/Chat/TypingIndicator'
import ChatInput from '../components/Chat/ChatInput'
import useAppStore from '../store/useAppStore'
import { sendMessage } from '../utils/api'
import toast from 'react-hot-toast'

const WELCOME_SUGGESTIONS = [
  { icon: '📧', label: 'Summarize my emails', prompt: 'Summarize my most important emails from today' },
  { icon: '📅', label: 'Today\'s schedule', prompt: 'What meetings and events do I have today?' },
  { icon: '🔍', label: 'Search all data', prompt: 'Search across all my connected platforms for...' },
  { icon: '📝', label: 'Notion notes', prompt: 'Summarize my recent Notion pages' },
  { icon: '💬', label: 'Slack summary', prompt: 'What are the key discussions in my Slack channels today?' },
  { icon: '📊', label: 'Productivity insights', prompt: 'Give me a productivity report for this week' },
]

export default function ChatPage() {
  const {
    conversations, activeConversationId, createConversation,
    addMessage, isTyping, setTyping, setRightPanelOpen, rightPanelOpen,
    integrations,
  } = useAppStore()

  const messagesEndRef = useRef(null)
  const [localTyping, setLocalTyping] = useState(false)

  const activeConv = conversations.find((c) => c.id === activeConversationId)
  const messages = activeConv?.messages || []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, localTyping])

  const handleSend = async ({ content, attachments }) => {
    let convId = activeConversationId
    if (!convId) {
      convId = createConversation()
    }

    // Add user message
    addMessage(convId, {
      role: 'user',
      content,
      attachments: attachments.map((a) => ({ name: a.name, type: a.type, url: a.preview })),
    })

    setLocalTyping(true)

    try {
      const formData = new FormData()
      formData.append('message', content)
      formData.append('conversation_id', convId)
      attachments.forEach((a) => formData.append('files', a.file))

      const res = await sendMessage({ message: content, conversation_id: convId, integrations })
      addMessage(convId, { role: 'assistant', content: res.data.response })
    } catch (err) {
      // Backend unreachable
      addMessage(convId, {
        role: 'assistant',
        content: '⚠️ Could not reach the backend. Make sure the backend server is running on port 8000.',
      })
    } finally {
      setLocalTyping(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
        <div>
          <h1 className="text-base font-semibold text-text">
            {activeConv?.title || 'OmniCopilot Chat'}
          </h1>
          <p className="text-xs text-muted mt-0.5">
            {messages.length > 0 ? `${messages.length} messages` : 'Start a conversation'}
          </p>
        </div>
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="p-2 rounded-xl text-muted hover:text-text hover:bg-surface transition-all"
        >
          <PanelRight size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestion={(prompt) => handleSend({ content: prompt, attachments: [] })} />
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatMessage key={msg.id} message={msg} isLast={i === messages.length - 1} />
            ))}
            <AnimatePresence>
              {localTyping && <TypingIndicator />}
            </AnimatePresence>
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-2">
        <ChatInput onSend={handleSend} disabled={localTyping} />
      </div>
    </div>
  )
}

function WelcomeScreen({ onSuggestion }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full min-h-[400px] text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-6 glow-primary"
      >
        <Sparkles size={28} className="text-primary" />
      </motion.div>

      <h2 className="text-2xl font-bold gradient-text mb-2">Good morning</h2>
      <p className="text-muted text-sm mb-8 max-w-md">
        I'm connected to all your productivity tools. Ask me anything about your emails, documents, meetings, or data.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
        {WELCOME_SUGGESTIONS.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSuggestion(s.prompt)}
            className="glass rounded-2xl p-4 text-left hover:border-primary/40 transition-all group"
          >
            <span className="text-xl mb-2 block">{s.icon}</span>
            <span className="text-sm text-muted group-hover:text-text transition-colors">{s.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}



