import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Send, Inbox, RefreshCw, Loader2, Sparkles, X,
  ChevronRight, Reply, Star, Circle, CheckCircle, AlertCircle, Pencil
} from 'lucide-react'
import { cn } from '../utils/cn'
import { getEmails, getEmail, sendEmail, composeEmail, generateReply, summarizeEmail } from '../utils/api'
import toast from 'react-hot-toast'

function ComposeModal({ onClose, replyTo = null }) {
  const [form, setForm] = useState({
    to: replyTo?.from || '',
    subject: replyTo ? `Re: ${replyTo.subject}` : '',
    body: '',
    context: '',
  })
  const [mode, setMode] = useState('manual') // 'manual' | 'ai'
  const [drafting, setDrafting] = useState(false)
  const [sending, setSending] = useState(false)

  const handleAIDraft = async () => {
    if (!form.to || !form.subject) { toast.error('Fill in To and Subject first'); return }
    setDrafting(true)
    try {
      const res = await composeEmail({ to: form.to, subject: form.subject, context: form.context, tone: 'professional' })
      setForm(f => ({ ...f, body: res.data.draft }))
      setMode('manual')
      toast.success('Draft ready — review and send!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'AI draft failed')
    } finally {
      setDrafting(false)
    }
  }

  const handleSend = async () => {
    if (!form.to || !form.subject || !form.body) { toast.error('Fill in all fields'); return }
    setSending(true)
    try {
      await sendEmail({ to: form.to, subject: form.subject, body: form.body })
      toast.success(`Email sent to ${form.to}`)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="glass rounded-2xl w-full max-w-xl border border-primary/30"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Pencil size={15} className="text-primary" />
            <span className="text-sm font-semibold text-text">{replyTo ? 'Reply' : 'New Email'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode(mode === 'ai' ? 'manual' : 'ai')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                mode === 'ai' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted hover:text-text hover:bg-surface'
              )}
            >
              <Sparkles size={12} />
              AI Draft
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-all">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <input
            className="input-field w-full"
            placeholder="To: email@example.com"
            value={form.to}
            onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
          />
          <input
            className="input-field w-full"
            placeholder="Subject"
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
          />

          {mode === 'ai' ? (
            <div className="space-y-3">
              <textarea
                className="input-field w-full resize-none"
                rows={3}
                placeholder="Describe what you want to say (e.g. 'Follow up on the proposal we discussed, ask for a decision by Friday')"
                value={form.context}
                onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
              />
              <button onClick={handleAIDraft} disabled={drafting} className="btn-primary w-full flex items-center justify-center gap-2">
                {drafting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {drafting ? 'Drafting...' : 'Generate Draft'}
              </button>
            </div>
          ) : (
            <textarea
              className="input-field w-full resize-none"
              rows={8}
              placeholder="Write your message..."
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            />
          )}
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-border text-sm text-muted hover:text-text transition-all">
            Discard
          </button>
          <button onClick={handleSend} disabled={sending || mode === 'ai'} className="flex-1 btn-primary flex items-center justify-center gap-2">
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function EmailDetail({ email, onReply, onClose }) {
  const [summary, setSummary] = useState(null)
  const [aiReply, setAiReply] = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingReply, setLoadingReply] = useState(false)

  const handleSummarize = async () => {
    setLoadingSummary(true)
    try {
      const res = await summarizeEmail(email.id)
      setSummary(res.data.summary)
    } catch { toast.error('Could not summarize') }
    finally { setLoadingSummary(false) }
  }

  const handleGenerateReply = async () => {
    setLoadingReply(true)
    try {
      const res = await generateReply(email.id)
      setAiReply(res.data.reply)
    } catch { toast.error('Could not generate reply') }
    finally { setLoadingReply(false) }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onClose} className="flex items-center gap-1 text-xs text-muted hover:text-text transition-all">
          <ChevronRight size={14} className="rotate-180" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleSummarize} disabled={loadingSummary} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted hover:text-text hover:bg-surface transition-all">
            {loadingSummary ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Summarize
          </button>
          <button onClick={handleGenerateReply} disabled={loadingReply} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted hover:text-text hover:bg-surface transition-all">
            {loadingReply ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            AI Reply
          </button>
          <button onClick={() => onReply(email)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all">
            <Reply size={12} />
            Reply
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-text mb-2">{email.subject}</h2>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>From: {email.from}</span>
            <span>·</span>
            <span>{email.date}</span>
          </div>
        </div>

        {summary && (
          <div className="glass rounded-xl p-4 border border-primary/20">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={12} className="text-primary" />
              <span className="text-xs font-medium text-primary">AI Summary</span>
            </div>
            <p className="text-sm text-text">{summary}</p>
          </div>
        )}

        {aiReply && (
          <div className="glass rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-green-400" />
                <span className="text-xs font-medium text-green-400">AI Draft Reply</span>
              </div>
              <button
                onClick={() => onReply({ ...email, aiDraft: aiReply })}
                className="text-xs text-primary hover:underline"
              >
                Use this reply
              </button>
            </div>
            <p className="text-sm text-text whitespace-pre-wrap">{aiReply}</p>
          </div>
        )}

        <div className="glass rounded-xl p-4">
          <p className="text-sm text-text whitespace-pre-wrap leading-relaxed">
            {email.body || email.snippet}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function EmailPage() {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [selectedEmailDetail, setSelectedEmailDetail] = useState(null)
  const [showCompose, setShowCompose] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const fetchEmails = async () => {
    setLoading(true)
    try {
      const res = await getEmails({ limit: 30, unread_only: unreadOnly })
      setEmails(res.data.emails || [])
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not load emails')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEmails() }, [unreadOnly])

  const handleSelectEmail = async (email) => {
    setSelectedEmail(email)
    setLoadingDetail(true)
    try {
      const res = await getEmail(email.id)
      setSelectedEmailDetail(res.data)
    } catch {
      setSelectedEmailDetail(email)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleReply = (email) => {
    setReplyTo(email)
    setShowCompose(true)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold gradient-text">Email</h1>
          <p className="text-xs text-muted">Read, summarize, and send emails with AI</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              unreadOnly ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted hover:text-text hover:bg-surface'
            )}
          >
            Unread only
          </button>
          <button onClick={fetchEmails} disabled={loading} className="p-2 rounded-xl text-muted hover:text-text hover:bg-surface transition-all">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { setReplyTo(null); setShowCompose(true) }} className="btn-primary flex items-center gap-2">
            <Pencil size={14} />
            Compose
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Email List */}
        <div className={cn('flex flex-col border-r border-border overflow-y-auto', selectedEmail ? 'w-80 flex-shrink-0' : 'flex-1')}>
          {loading ? (
            <div className="flex items-center justify-center flex-1 py-16">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 text-center px-6">
              <Inbox size={40} className="text-muted mb-3 opacity-50" />
              <p className="text-sm text-muted">No emails found</p>
              <p className="text-xs text-muted mt-1">Connect Gmail in Data Sources to see your inbox</p>
            </div>
          ) : (
            emails.map((email) => (
              <motion.button
                key={email.id}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                onClick={() => handleSelectEmail(email)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-border/50 transition-all',
                  selectedEmail?.id === email.id && 'bg-primary/10 border-l-2 border-l-primary'
                )}
              >
                <div className="flex items-start gap-2">
                  {email.unread
                    ? <Circle size={8} className="text-primary mt-1.5 flex-shrink-0 fill-primary" />
                    : <Circle size={8} className="text-transparent mt-1.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className={cn('text-xs truncate', email.unread ? 'font-semibold text-text' : 'text-muted')}>
                        {email.from?.split('<')[0].trim() || email.from}
                      </p>
                      <p className="text-xs text-muted flex-shrink-0">{email.date?.split(' ').slice(1, 4).join(' ')}</p>
                    </div>
                    <p className={cn('text-xs truncate mb-0.5', email.unread ? 'font-medium text-text' : 'text-muted')}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-muted truncate">{email.snippet}</p>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>

        {/* Email Detail */}
        {selectedEmail && (
          <div className="flex-1 overflow-hidden">
            {loadingDetail ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : (
              <EmailDetail
                email={selectedEmailDetail || selectedEmail}
                onReply={handleReply}
                onClose={() => { setSelectedEmail(null); setSelectedEmailDetail(null) }}
              />
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCompose && (
          <ComposeModal
            onClose={() => { setShowCompose(false); setReplyTo(null) }}
            replyTo={replyTo}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
