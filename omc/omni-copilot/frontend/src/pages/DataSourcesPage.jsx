import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, ExternalLink, RefreshCw, Zap, Shield, ChevronRight } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { cn } from '../utils/cn'
import toast from 'react-hot-toast'

const SOURCES = [
  {
    key: 'gmail',
    name: 'Gmail',
    description: 'Read, summarize, and reply to emails with AI',
    icon: '📧',
    color: 'from-red-500/20 to-orange-500/20',
    border: 'border-red-500/20',
    features: ['Inbox summarization', 'Smart replies', 'Task extraction', 'Thread analysis'],
    provider: 'Google OAuth',
  },
  {
    key: 'googleDrive',
    name: 'Google Drive',
    description: 'Search and summarize documents, spreadsheets, and presentations',
    icon: '📁',
    color: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/20',
    features: ['Document search', 'File summarization', 'Q&A on docs', 'Content extraction'],
    provider: 'Google OAuth',
  },
  {
    key: 'googleCalendar',
    name: 'Google Calendar',
    description: 'View, create, and manage calendar events with AI scheduling',
    icon: '📅',
    color: 'from-green-500/20 to-emerald-500/20',
    border: 'border-green-500/20',
    features: ['Event management', 'Smart scheduling', 'Conflict detection', 'Meeting prep'],
    provider: 'Google OAuth',
  },
  {
    key: 'googleForms',
    name: 'Google Forms',
    description: 'Analyze form responses and extract insights automatically',
    icon: '📊',
    color: 'from-purple-500/20 to-violet-500/20',
    border: 'border-purple-500/20',
    features: ['Response analysis', 'Trend detection', 'Summary reports', 'Data insights'],
    provider: 'Google OAuth',
  },
  {
    key: 'googleMeet',
    name: 'Google Meet',
    description: 'Access meeting transcripts and generate AI summaries',
    icon: '🎥',
    color: 'from-teal-500/20 to-green-500/20',
    border: 'border-teal-500/20',
    features: ['Meeting summaries', 'Action items', 'Transcript search', 'Follow-up creation'],
    provider: 'Google OAuth',
  },
  {
    key: 'slack',
    name: 'Slack',
    description: 'Summarize channels, extract decisions, and automate responses',
    icon: '💬',
    color: 'from-yellow-500/20 to-orange-500/20',
    border: 'border-yellow-500/20',
    features: ['Channel summaries', 'Decision extraction', 'Task detection', 'Smart replies'],
    provider: 'Slack OAuth',
  },
  {
    key: 'notion',
    name: 'Notion',
    description: 'Search and chat with your entire Notion workspace',
    icon: '📝',
    color: 'from-gray-500/20 to-slate-500/20',
    border: 'border-gray-500/20',
    features: ['Page search', 'Note summarization', 'Database queries', 'Content chat'],
    provider: 'Notion API',
  },
  {
    key: 'discord',
    name: 'Discord',
    description: 'Monitor servers, summarize channels, and extract key discussions',
    icon: '🎮',
    color: 'from-indigo-500/20 to-blue-500/20',
    border: 'border-indigo-500/20',
    features: ['Server monitoring', 'Channel summaries', 'Key discussions', 'Task extraction'],
    provider: 'Discord OAuth',
  },
  {
    key: 'oneDrive',
    name: 'OneDrive',
    description: 'Access and analyze Microsoft Office documents',
    icon: '☁️',
    color: 'from-blue-600/20 to-sky-500/20',
    border: 'border-blue-600/20',
    features: ['File access', 'Document analysis', 'Office integration', 'Search'],
    provider: 'Microsoft OAuth',
  },
  {
    key: 'teams',
    name: 'Microsoft Teams',
    description: 'Summarize team chats, meetings, and extract action items',
    icon: '👥',
    color: 'from-violet-500/20 to-purple-500/20',
    border: 'border-violet-500/20',
    features: ['Chat summaries', 'Meeting notes', 'Action items', 'Channel search'],
    provider: 'Microsoft OAuth',
  },
  {
    key: 'outlook',
    name: 'Outlook',
    description: 'Manage emails and calendar with Microsoft integration',
    icon: '📮',
    color: 'from-blue-500/20 to-indigo-500/20',
    border: 'border-blue-500/20',
    features: ['Email management', 'Calendar sync', 'Smart replies', 'Task creation'],
    provider: 'Microsoft OAuth',
  },
  {
    key: 'zoom',
    name: 'Zoom',
    description: 'Access recordings, transcripts, and meeting summaries',
    icon: '📹',
    color: 'from-blue-400/20 to-cyan-400/20',
    border: 'border-blue-400/20',
    features: ['Recording access', 'Transcript analysis', 'Meeting summaries', 'Action items'],
    provider: 'Zoom OAuth',
  },
]

export default function DataSourcesPage() {
  const { integrations, setIntegration } = useAppStore()
  const [connecting, setConnecting] = useState(null)
  const [expandedCard, setExpandedCard] = useState(null)

  // Sync connection status from backend on mount and after OAuth redirect
  useEffect(() => {
    const syncStatus = async () => {
      try {
        const res = await fetch('/api/integrations/status')
        const status = await res.json()
        Object.entries(status).forEach(([key, val]) => setIntegration(key, val))

        // Show success toast if redirected back from OAuth
        const params = new URLSearchParams(window.location.search)
        const connected = params.get('connected')
        if (connected) {
          toast.success(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`)
          window.history.replaceState({}, '', '/sources')
        }
      } catch (err) {
        // backend may not be running
      }
    }
    syncStatus()
  }, [])

  const connectedCount = Object.values(integrations).filter(Boolean).length

  const handleConnect = async (key, name) => {
    setConnecting(key)
    try {
      const res = await fetch(`/api/integrations/${key}/connect`, { method: 'POST' })
      const data = await res.json()
      if (data.oauth_url) {
        // Navigate to backend OAuth endpoint — it will redirect to the provider
        window.location.href = data.oauth_url
      } else {
        toast.error(`Could not start OAuth for ${name}`)
        setConnecting(null)
      }
    } catch (err) {
      toast.error(`Failed to connect ${name}`)
      setConnecting(null)
    }
  }

  const handleDisconnect = async (key, name) => {
    try {
      await fetch(`/api/integrations/${key}`, { method: 'DELETE' })
      setIntegration(key, false)
      toast.success(`${name} disconnected`)
    } catch {
      setIntegration(key, false)
      toast.success(`${name} disconnected`)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold gradient-text mb-2">Data Sources</h1>
          <p className="text-muted text-sm">
            Connect your platforms to unlock AI-powered insights across all your data.
          </p>

          {/* Stats bar */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm text-text font-medium">{connectedCount} connected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted" />
              <span className="text-sm text-muted">{SOURCES.length - connectedCount} available</span>
            </div>
            <div className="h-1.5 flex-1 bg-surface rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(connectedCount / SOURCES.length) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>

        {/* Source Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SOURCES.map((source, i) => {
            const isConnected = integrations[source.key]
            const isConnecting = connecting === source.key
            const isExpanded = expandedCard === source.key

            return (
              <motion.div
                key={source.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                layout
                className={cn(
                  'glass rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer',
                  source.border,
                  isConnected && 'border-accent/30',
                  isExpanded && 'md:col-span-2'
                )}
                onClick={() => setExpandedCard(isExpanded ? null : source.key)}
              >
                <div className={cn('p-5 bg-gradient-to-br', source.color)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{source.icon}</span>
                      <div>
                        <h3 className="font-semibold text-text text-sm">{source.name}</h3>
                        <span className="text-xs text-muted">{source.provider}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <span className="status-connected">
                          <CheckCircle2 size={12} />
                          Connected
                        </span>
                      ) : (
                        <span className="status-disconnected">
                          <Circle size={12} />
                          Not connected
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted leading-relaxed mb-4">{source.description}</p>

                  {/* Features */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-4"
                      >
                        <p className="text-xs font-semibold text-text mb-2">Features</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {source.features.map((f) => (
                            <div key={f} className="flex items-center gap-1.5 text-xs text-muted">
                              <Zap size={10} className="text-primary flex-shrink-0" />
                              {f}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {isConnected ? (
                      <>
                        <button
                          onClick={() => handleDisconnect(source.key, source.name)}
                          className="flex-1 py-2 px-3 rounded-xl text-xs font-medium text-muted hover:text-red-400 hover:bg-red-400/10 border border-border/50 transition-all"
                        >
                          Disconnect
                        </button>
                        <button className="p-2 rounded-xl text-muted hover:text-text hover:bg-surface/50 border border-border/50 transition-all">
                          <RefreshCw size={13} />
                        </button>
                        <button className="p-2 rounded-xl text-muted hover:text-text hover:bg-surface/50 border border-border/50 transition-all">
                          <ExternalLink size={13} />
                        </button>
                      </>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleConnect(source.key, source.name)}
                        disabled={isConnecting}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-all flex items-center justify-center gap-2"
                      >
                        {isConnecting ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Shield size={12} />
                            Connect
                            <ChevronRight size={12} />
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Local Files Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 glass rounded-2xl p-6 border border-primary/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📂</span>
            <div>
              <h3 className="font-semibold text-text">Local Files</h3>
              <p className="text-xs text-muted">Upload PDF, DOCX, TXT, images, and code files directly</p>
            </div>
          </div>
          <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-primary/40 transition-all cursor-pointer group">
            <p className="text-3xl mb-2">📤</p>
            <p className="text-sm text-muted group-hover:text-text transition-colors">
              Drag & drop files here, or click to browse
            </p>
            <p className="text-xs text-muted/60 mt-1">PDF, DOCX, TXT, JPG, PNG, PY, JS, and more</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
