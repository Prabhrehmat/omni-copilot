import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Plus, Clock, Users, Video, Sparkles,
  X, Send, Loader2, CheckCircle, AlertCircle, Mail
} from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, isSameDay, addMonths, subMonths, parseISO
} from 'date-fns'
import { cn } from '../utils/cn'
import { getEvents, scheduleMeeting, createEvent } from '../utils/api'
import toast from 'react-hot-toast'

const TYPE_ICONS = { meet: '🎥', zoom: '📹', teams: '👥', in_person: '📍', default: '📅' }
const EVENT_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-yellow-500']

function ScheduleMeetingModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    participants: '',
    duration_minutes: 60,
    preferred_date: '',
    description: '',
    send_invites: true,
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.participants) {
      toast.error('Title and participants are required')
      return
    }
    setLoading(true)
    try {
      const emails = form.participants.split(',').map(s => s.trim()).filter(Boolean)
      const res = await scheduleMeeting({
        title: form.title,
        participants: emails,
        duration_minutes: Number(form.duration_minutes),
        preferred_date: form.preferred_date || undefined,
        description: form.description || undefined,
        send_invites: form.send_invites,
      })
      setResult(res.data)
      toast.success('Meeting scheduled!')
      onSuccess?.()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to schedule meeting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass rounded-2xl w-full max-w-lg p-6 border border-primary/30"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <h2 className="text-base font-semibold text-text">Schedule Meeting with AI</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-all">
            <X size={16} />
          </button>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle size={18} />
              <span className="text-sm font-medium">Meeting Scheduled!</span>
            </div>
            <div className="glass rounded-xl p-4 space-y-2 text-sm">
              <p className="font-medium text-text">{result.event?.summary || form.title}</p>
              <p className="text-muted">Start: {result.scheduled_start}</p>
              <p className="text-muted">End: {result.scheduled_end}</p>
              {result.ai_reason && <p className="text-muted italic text-xs">"{result.ai_reason}"</p>}
            </div>
            {result.invites_sent?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted uppercase tracking-wide">Invites</p>
                {result.invites_sent.map((inv) => (
                  <div key={inv.email} className="flex items-center gap-2 text-xs">
                    {inv.status === 'sent'
                      ? <CheckCircle size={12} className="text-green-400" />
                      : <AlertCircle size={12} className="text-red-400" />}
                    <span className="text-muted">{inv.email}</span>
                    <span className={inv.status === 'sent' ? 'text-green-400' : 'text-red-400'}>{inv.status}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={onClose} className="btn-primary w-full">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Meeting Title *</label>
              <input
                className="input-field w-full"
                placeholder="e.g. Product Sync, 1:1 with John"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Participants (emails, comma-separated) *</label>
              <input
                className="input-field w-full"
                placeholder="alice@example.com, bob@example.com"
                value={form.participants}
                onChange={e => setForm(f => ({ ...f, participants: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Duration (minutes)</label>
                <select
                  className="input-field w-full"
                  value={form.duration_minutes}
                  onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                >
                  {[15, 30, 45, 60, 90, 120].map(d => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Preferred Date (optional)</label>
                <input
                  type="date"
                  className="input-field w-full"
                  value={form.preferred_date}
                  onChange={e => setForm(f => ({ ...f, preferred_date: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Description (optional)</label>
              <textarea
                className="input-field w-full resize-none"
                rows={2}
                placeholder="What's this meeting about?"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.send_invites}
                onChange={e => setForm(f => ({ ...f, send_invites: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-text flex items-center gap-1.5">
                <Mail size={13} className="text-primary" />
                Auto-send email invites to participants
              </span>
            </label>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-border text-sm text-muted hover:text-text transition-all">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 btn-primary flex items-center justify-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {loading ? 'Scheduling...' : 'Schedule with AI'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showScheduler, setShowScheduler] = useState(false)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startPad = startOfMonth(currentMonth).getDay()

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const res = await getEvents({ max_results: 50 })
      setEvents(res.data.events || [])
    } catch {
      // silently fail — user may not have calendar connected
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  const eventsForDate = (date) =>
    events.filter(e => {
      if (!e.start) return false
      try {
        const d = parseISO(e.start)
        return isSameDay(d, date)
      } catch { return false }
    })

  const selectedEvents = eventsForDate(selectedDate)

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold gradient-text mb-1">Calendar</h1>
            <p className="text-muted text-sm">Schedule meetings and manage your calendar with AI</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowScheduler(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/30 transition-all"
            >
              <Sparkles size={14} />
              Schedule Meeting
            </motion.button>
            <button onClick={fetchEvents} className="btn-primary">
              <Plus size={14} />
              Refresh
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-text">{format(currentMonth, 'MMMM yyyy')}</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl text-muted hover:text-text hover:bg-surface transition-all">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 rounded-xl text-xs font-medium text-primary hover:bg-primary/10 transition-all">
                    Today
                  </button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl text-muted hover:text-text hover:bg-surface transition-all">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted py-2">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
                {days.map((day) => {
                  const dayEvents = eventsForDate(day)
                  const isSelected = isSameDay(day, selectedDate)
                  const isCurrentDay = isToday(day)
                  return (
                    <motion.button
                      key={day.toISOString()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        'relative aspect-square flex flex-col items-center justify-start pt-1.5 rounded-xl text-sm transition-all',
                        isSelected && 'bg-primary text-white',
                        isCurrentDay && !isSelected && 'bg-primary/20 text-primary font-semibold',
                        !isSelected && !isCurrentDay && 'text-text hover:bg-surface',
                        !isSameMonth(day, currentMonth) && 'opacity-30'
                      )}
                    >
                      <span className="text-xs font-medium">{format(day, 'd')}</span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {dayEvents.slice(0, 3).map((e, i) => (
                            <div key={e.id || i} className={cn('w-1 h-1 rounded-full', isSelected ? 'bg-white/70' : EVENT_COLORS[i % EVENT_COLORS.length])} />
                          ))}
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Events Panel */}
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-text mb-1">
                {isToday(selectedDate) ? "Today's Events" : format(selectedDate, 'MMMM d')}
              </h3>
              <p className="text-xs text-muted mb-4">{selectedEvents.length} events</p>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-primary" />
                </div>
              ) : selectedEvents.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-2xl mb-2">📭</p>
                  <p className="text-xs text-muted">No events scheduled</p>
                  <button onClick={() => setShowScheduler(true)} className="mt-3 text-xs text-primary hover:text-primary/80 transition-colors">
                    + Schedule a meeting
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map((event, i) => (
                    <motion.div key={event.id || i} whileHover={{ x: 2 }} className="glass rounded-xl p-3 cursor-pointer hover:border-primary/30 transition-all">
                      <div className="flex items-start gap-2">
                        <div className={cn('w-2 min-h-[40px] rounded-full flex-shrink-0', EVENT_COLORS[i % EVENT_COLORS.length])} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">{event.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-xs text-muted">
                              <Clock size={10} />
                              {event.start ? format(parseISO(event.start), 'HH:mm') : ''}
                            </div>
                            {event.participants?.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted">
                                <Users size={10} />
                                {event.participants.length}
                              </div>
                            )}
                          </div>
                          {event.meeting_link && (
                            <a href={event.meeting_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 mt-1.5 text-xs text-primary hover:underline">
                              <Video size={10} />
                              Join meeting
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming */}
            {events.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-text mb-3">Upcoming</h3>
                <div className="space-y-2">
                  {events.slice(0, 5).map((event, i) => (
                    <div key={event.id || i} className="flex items-center gap-3 py-1">
                      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', EVENT_COLORS[i % EVENT_COLORS.length])} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text truncate">{event.title}</p>
                        <p className="text-xs text-muted">
                          {event.start ? format(parseISO(event.start), 'MMM d · HH:mm') : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick schedule CTA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowScheduler(true)}
              className="w-full glass rounded-2xl p-4 border border-primary/20 hover:border-primary/40 transition-all text-left"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-primary" />
                <span className="text-sm font-medium text-text">AI Meeting Scheduler</span>
              </div>
              <p className="text-xs text-muted">Let AI find the best time, create the event, and send invites automatically.</p>
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showScheduler && (
          <ScheduleMeetingModal
            onClose={() => setShowScheduler(false)}
            onSuccess={() => { fetchEvents(); setTimeout(() => setShowScheduler(false), 2000) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
