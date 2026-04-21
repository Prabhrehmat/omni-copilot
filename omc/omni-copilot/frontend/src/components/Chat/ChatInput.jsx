import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TextareaAutosize from 'react-textarea-autosize'
import { useDropzone } from 'react-dropzone'
import {
  Send, Paperclip, Image, Code, Mic, MicOff, X, FileText, Globe
} from 'lucide-react'
import { cn } from '../../utils/cn'
import useAppStore from '../../store/useAppStore'
import toast from 'react-hot-toast'

const SUGGESTIONS = [
  'Summarize my emails from today',
  'What meetings do I have this week?',
  'Find documents about Q4 planning',
  'Summarize my Slack messages',
  'Create a calendar event for tomorrow',
]

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('')
  const [attachments, setAttachments] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const textareaRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const { integrations } = useAppStore()
  const connectedCount = Object.values(integrations).filter(Boolean).length

  const onDrop = useCallback((files) => {
    const newAtts = files.map((f) => ({
      id: Date.now() + Math.random(),
      file: f,
      name: f.name,
      type: f.type.startsWith('image/') ? 'image' : f.name.match(/\.(py|js|ts|java|cpp|c|go|rs)$/) ? 'code' : 'file',
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
    }))
    setAttachments((prev) => [...prev, ...newAtts])
  }, [])

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: {
      'image/*': [],
      'application/pdf': [],
      'text/*': [],
      'application/vnd.openxmlformats-officedocument.*': [],
    },
  })

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed && attachments.length === 0) return
    onSend({ content: trimmed, attachments })
    setValue('')
    setAttachments([])
    setShowSuggestions(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        toast.success('Voice recorded — transcription coming soon')
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch {
      toast.error('Microphone access denied')
    }
  }

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="relative">
      {/* Suggestions */}
      <AnimatePresence>
        {showSuggestions && value === '' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-full mb-2 left-0 right-0 glass rounded-2xl p-2 space-y-1"
          >
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => { setValue(s); setShowSuggestions(false); textareaRef.current?.focus() }}
                className="w-full text-left px-3 py-2 text-sm text-muted hover:text-text hover:bg-surface rounded-xl transition-all"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop zone wrapper */}
      <div
        {...getRootProps()}
        className={cn(
          'glass-strong rounded-2xl transition-all duration-200',
          isDragActive && 'border-primary/60 glow-primary'
        )}
      >
        <input {...getInputProps()} />

        {/* Attachments preview */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-wrap gap-2 px-4 pt-3"
            >
              {attachments.map((att) => (
                <div key={att.id} className="relative group">
                  {att.type === 'image' ? (
                    <img src={att.preview} alt={att.name} className="h-16 w-16 object-cover rounded-xl border border-border/50" />
                  ) : (
                    <div className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2 border border-border/50">
                      {att.type === 'code' ? <Code size={14} className="text-primary" /> : <FileText size={14} className="text-blue-400" />}
                      <span className="text-xs text-text max-w-[120px] truncate">{att.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={9} className="text-white" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <div className="flex items-end gap-2 p-3">
          {/* Left actions */}
          <div className="flex items-center gap-1 pb-0.5">
            <button
              onClick={openFilePicker}
              className="p-2 rounded-xl text-muted hover:text-text hover:bg-surface transition-all"
              title="Attach file"
            >
              <Paperclip size={16} />
            </button>
            <button
              onClick={openFilePicker}
              className="p-2 rounded-xl text-muted hover:text-text hover:bg-surface transition-all"
              title="Upload image"
            >
              <Image size={16} />
            </button>
            <button
              onClick={openFilePicker}
              className="p-2 rounded-xl text-muted hover:text-text hover:bg-surface transition-all"
              title="Upload code"
            >
              <Code size={16} />
            </button>
          </div>

          {/* Textarea */}
          <TextareaAutosize
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={isDragActive ? 'Drop files here...' : 'Ask OmniCopilot anything...'}
            minRows={1}
            maxRows={6}
            disabled={disabled}
            className="flex-1 bg-transparent text-sm text-text placeholder-muted resize-none outline-none leading-relaxed py-1.5"
          />

          {/* Right actions */}
          <div className="flex items-center gap-1 pb-0.5">
            <button
              onClick={toggleRecording}
              className={cn(
                'p-2 rounded-xl transition-all',
                isRecording
                  ? 'text-red-400 bg-red-400/10 animate-pulse'
                  : 'text-muted hover:text-text hover:bg-surface'
              )}
              title="Voice input"
            >
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={disabled || (!value.trim() && attachments.length === 0)}
              className={cn(
                'p-2.5 rounded-xl transition-all duration-200',
                value.trim() || attachments.length > 0
                  ? 'bg-primary text-white glow-primary'
                  : 'bg-surface text-muted cursor-not-allowed'
              )}
            >
              <Send size={15} />
            </motion.button>
          </div>
        </div>

        {/* Bottom hint */}
        <div className="px-4 pb-2 flex items-center justify-between">
          <span className="text-xs text-muted/50">Press Enter to send · Shift+Enter for new line</span>
          <div className="flex items-center gap-1 text-xs text-muted/50">
            <Globe size={10} />
            <span>Connected to {connectedCount} source{connectedCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
