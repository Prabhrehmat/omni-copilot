import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, User, Copy, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'

function parseContent(content) {
  const parts = []
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'code', lang: match[1] || 'text', content: match[2].trim() })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) })
  }

  return parts.length > 0 ? parts : [{ type: 'text', content }]
}

function parseInline(text) {
  // Parse inline markdown: **bold**, *italic*, `code`
  const parts = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
  let last = 0
  let match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: 'plain', content: text.slice(last, match.index) })
    if (match[0].startsWith('**')) parts.push({ type: 'bold', content: match[2] })
    else if (match[0].startsWith('*')) parts.push({ type: 'italic', content: match[3] })
    else parts.push({ type: 'code', content: match[4] })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ type: 'plain', content: text.slice(last) })
  return parts.length > 0 ? parts : [{ type: 'plain', content: text }]
}

function InlineText({ text }) {
  const parts = parseInline(text)
  return (
    <>
      {parts.map((p, i) => {
        if (p.type === 'bold') return <strong key={i} className="font-semibold text-text">{p.content}</strong>
        if (p.type === 'italic') return <em key={i} className="italic">{p.content}</em>
        if (p.type === 'code') return <code key={i} className="bg-white/10 rounded px-1 font-mono text-xs">{p.content}</code>
        return <span key={i}>{p.content}</span>
      })}
    </>
  )
}

function TextContent({ text }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return <p key={i} className="font-semibold text-text text-base mt-1"><InlineText text={line.slice(4)} /></p>
        }
        if (line.startsWith('## ')) {
          return <p key={i} className="font-bold text-text text-base mt-1"><InlineText text={line.slice(3)} /></p>
        }
        if (line.startsWith('# ')) {
          return <p key={i} className="font-bold text-text text-lg mt-1"><InlineText text={line.slice(2)} /></p>
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="text-primary mt-1.5 text-xs">•</span>
              <span><InlineText text={line.slice(2)} /></span>
            </div>
          )
        }
        if (line.match(/^\d+\. /)) {
          const num = line.match(/^(\d+)\. /)[1]
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="text-primary font-mono text-xs mt-0.5 w-4">{num}.</span>
              <span><InlineText text={line.replace(/^\d+\. /, '')} /></span>
            </div>
          )
        }
        if (line === '') return <div key={i} className="h-2" />
        return <p key={i}><InlineText text={line} /></p>
      })}
    </div>
  )
}

export default function ChatMessage({ message, isLast }) {
  const isUser = message.role === 'user'
  const parts = parseContent(message.content)

  const copyMessage = () => {
    navigator.clipboard.writeText(message.content)
    toast.success('Copied to clipboard')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('flex gap-3 group', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1',
        isUser
          ? 'bg-gradient-primary'
          : 'bg-primary/20 border border-primary/30'
      )}>
        {isUser
          ? <User size={14} className="text-white" />
          : <Sparkles size={14} className="text-primary" />
        }
      </div>

      {/* Bubble */}
      <div className={cn('max-w-[75%] space-y-2', isUser ? 'items-end' : 'items-start')}>
        <div className={cn(
          'px-4 py-3 text-sm leading-relaxed',
          isUser ? 'chat-bubble-user text-white' : 'chat-bubble-ai text-text'
        )}>
          {/* Attachments */}
          {message.attachments?.map((att, i) => (
            <div key={i} className="mb-3">
              {att.type === 'image' && (
                <img src={att.url} alt={att.name} className="max-w-xs rounded-xl mb-1" />
              )}
              {att.type === 'file' && (
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-xs mb-1">
                  <span>📄</span>
                  <span className="truncate">{att.name}</span>
                </div>
              )}
            </div>
          ))}

          {/* Content */}
          <div className="space-y-2">
            {parts.map((part, i) =>
              part.type === 'code' ? (
                <div key={i} className="rounded-xl overflow-hidden border border-border/50 text-xs">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-surface/80 border-b border-border/30">
                    <span className="text-muted font-mono">{part.lang}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(part.content); toast.success('Code copied') }}
                      className="text-muted hover:text-text transition-colors"
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                  <SyntaxHighlighter
                    language={part.lang}
                    style={oneDark}
                    customStyle={{ margin: 0, background: 'transparent', padding: '12px', fontSize: '12px' }}
                  >
                    {part.content}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <TextContent key={i} text={part.content} />
              )
            )}
          </div>
        </div>

        {/* Actions (AI only) */}
        {!isUser && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
            <button onClick={copyMessage} className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-all">
              <Copy size={12} />
            </button>
            <button className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-surface transition-all">
              <ThumbsUp size={12} />
            </button>
            <button className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-surface transition-all">
              <ThumbsDown size={12} />
            </button>
            <button className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-all">
              <RotateCcw size={12} />
            </button>
            <span className="text-xs text-muted/50 ml-1">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
