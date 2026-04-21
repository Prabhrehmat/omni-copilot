import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Mail, Lightbulb, FileText, ChevronRight, Clock, User, Zap } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import { cn } from '../../utils/cn'

const mockMeetings = [
  { id: 1, title: 'Product Standup', time: '10:00 AM', duration: '30m', participants: 5 },
  { id: 2, title: 'Design Review', time: '2:00 PM', duration: '1h', participants: 3 },
  { id: 3, title: 'Client Call', time: '4:30 PM', duration: '45m', participants: 2 },
]

const mockEmails = [
  { id: 1, from: 'Sarah Chen', subject: 'Q4 Report Review', time: '9:15 AM', unread: true },
  { id: 2, from: 'Alex Kumar', subject: 'Sprint Planning Notes', time: '8:42 AM', unread: true },
  { id: 3, from: 'Marketing Team', subject: 'Campaign Results', time: 'Yesterday', unread: false },
]

const mockActions = [
  { id: 1, label: 'Summarize inbox', icon: Mail, color: 'text-blue-400' },
  { id: 2, label: 'Schedule meeting', icon: Calendar, color: 'text-green-400' },
  { id: 3, label: 'Review documents', icon: FileText, color: 'text-purple-400' },
  { id: 4, label: 'Get insights', icon: Lightbulb, color: 'text-yellow-400' },
]

export default function RightPanel() {
  const { setRightPanelOpen } = useAppStore()
  const [activeSection, setActiveSection] = useState('all')

  return (
    <motion.aside
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-72 flex flex-col h-full glass border-l border-border/50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border/30">
        <h3 className="text-sm font-semibold text-text">Smart Panel</h3>
        <button
          onClick={() => setRightPanelOpen(false)}
          className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-all"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* AI Summary */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
              <Lightbulb size={11} className="text-primary" />
            </div>
            <span className="text-xs font-semibold text-text uppercase tracking-wider">Today's Summary</span>
          </div>
          <div className="glass rounded-xl p-3 text-xs text-muted leading-relaxed">
            You have <span className="text-accent font-medium">3 meetings</span> today,{' '}
            <span className="text-primary font-medium">12 unread emails</span>, and{' '}
            <span className="text-yellow-400 font-medium">5 pending tasks</span>. Your productivity score is{' '}
            <span className="text-text font-semibold">87%</span>.
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-green-500/20 flex items-center justify-center">
                <Calendar size={11} className="text-green-400" />
              </div>
              <span className="text-xs font-semibold text-text uppercase tracking-wider">Upcoming</span>
            </div>
            <button className="text-xs text-primary hover:text-primary/80 transition-colors">View all</button>
          </div>
          <div className="space-y-2">
            {mockMeetings.map((meeting) => (
              <motion.div
                key={meeting.id}
                whileHover={{ x: 2 }}
                className="glass rounded-xl p-3 cursor-pointer hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text truncate">{meeting.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={10} className="text-muted" />
                      <span className="text-xs text-muted">{meeting.time} · {meeting.duration}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <User size={10} className="text-muted" />
                    <span className="text-xs text-muted">{meeting.participants}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Emails */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-blue-500/20 flex items-center justify-center">
                <Mail size={11} className="text-blue-400" />
              </div>
              <span className="text-xs font-semibold text-text uppercase tracking-wider">Emails</span>
            </div>
            <button className="text-xs text-primary hover:text-primary/80 transition-colors">View all</button>
          </div>
          <div className="space-y-2">
            {mockEmails.map((email) => (
              <motion.div
                key={email.id}
                whileHover={{ x: 2 }}
                className="glass rounded-xl p-3 cursor-pointer hover:border-primary/30 transition-all"
              >
                <div className="flex items-start gap-2">
                  {email.unread && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs truncate', email.unread ? 'font-semibold text-text' : 'text-muted')}>
                      {email.from}
                    </p>
                    <p className="text-xs text-muted truncate mt-0.5">{email.subject}</p>
                    <p className="text-xs text-muted/60 mt-0.5">{email.time}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Suggested Actions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-md bg-yellow-500/20 flex items-center justify-center">
              <Zap size={11} className="text-yellow-400" />
            </div>
            <span className="text-xs font-semibold text-text uppercase tracking-wider">Quick Actions</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {mockActions.map((action) => {
              const Icon = action.icon
              return (
                <motion.button
                  key={action.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="glass rounded-xl p-3 text-left hover:border-primary/30 transition-all group"
                >
                  <Icon size={16} className={cn(action.color, 'mb-2')} />
                  <p className="text-xs text-muted group-hover:text-text transition-colors leading-tight">
                    {action.label}
                  </p>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    </motion.aside>
  )
}


