import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Plus, Play, Pause, Trash2, ChevronRight, Mail, Calendar, MessageSquare, FileText, Bell, GitBranch } from 'lucide-react'
import { cn } from '../utils/cn'
import toast from 'react-hot-toast'

const AUTOMATION_TEMPLATES = [
  {
    id: 'email-to-task',
    name: 'Email → Task',
    description: 'Auto-extract tasks from emails and add to your task list',
    trigger: 'New email received',
    action: 'Create task',
    icon: Mail,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    active: true,
    runs: 47,
  },
  {
    id: 'meeting-summary',
    name: 'Meeting → Summary',
    description: 'Auto-generate AI summaries after every meeting ends',
    trigger: 'Meeting ends',
    action: 'Generate summary + action items',
    icon: Calendar,
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    active: true,
    runs: 23,
  },
  {
    id: 'slack-digest',
    name: 'Slack Daily Digest',
    description: 'Get a morning summary of all important Slack messages',
    trigger: 'Every day at 8:00 AM',
    action: 'Send digest to chat',
    icon: MessageSquare,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    active: false,
    runs: 12,
  },
  {
    id: 'doc-summary',
    name: 'Document → Summary',
    description: 'Auto-summarize new documents added to Google Drive',
    trigger: 'New file in Drive',
    action: 'Summarize + tag',
    icon: FileText,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    active: true,
    runs: 89,
  },
  {
    id: 'deadline-reminder',
    name: 'Smart Reminders',
    description: 'AI detects deadlines in emails and creates calendar reminders',
    trigger: 'Email with deadline detected',
    action: 'Create calendar event',
    icon: Bell,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    active: false,
    runs: 31,
  },
  {
    id: 'form-insights',
    name: 'Form → Insights',
    description: 'Auto-analyze Google Form responses and generate reports',
    trigger: 'New form response',
    action: 'Update insights dashboard',
    icon: GitBranch,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    active: true,
    runs: 156,
  },
]

const WORKFLOW_STEPS = [
  { id: 'trigger', label: 'Trigger', options: ['New email', 'Meeting ends', 'New file', 'Schedule', 'Form response', 'Slack message'] },
  { id: 'condition', label: 'Condition (optional)', options: ['Contains keyword', 'From specific sender', 'Has attachment', 'Priority: High', 'Any'] },
  { id: 'action', label: 'Action', options: ['Create task', 'Send summary', 'Create calendar event', 'Send notification', 'Generate report', 'Draft reply'] },
]

export default function AutomationsPage() {
  const [automations, setAutomations] = useState(AUTOMATION_TEMPLATES)
  const [showBuilder, setShowBuilder] = useState(false)
  const [builderStep, setBuilderStep] = useState({})

  const toggleAutomation = (id) => {
    setAutomations((prev) =>
      prev.map((a) => a.id === id ? { ...a, active: !a.active } : a)
    )
    const auto = automations.find((a) => a.id === id)
    toast.success(`${auto.name} ${auto.active ? 'paused' : 'activated'}`)
  }

  const deleteAutomation = (id) => {
    setAutomations((prev) => prev.filter((a) => a.id !== id))
    toast.success('Automation deleted')
  }

  const activeCount = automations.filter((a) => a.active).length
  const totalRuns = automations.reduce((sum, a) => sum + a.runs, 0)

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold gradient-text mb-1">Automations</h1>
            <p className="text-muted text-sm">Set up AI-powered workflows to automate your productivity</p>
          </div>
          <button
            onClick={() => setShowBuilder(!showBuilder)}
            className="btn-primary"
          >
            <Plus size={14} />
            New Automation
          </button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Active', value: activeCount, color: 'text-accent' },
            { label: 'Total Runs', value: totalRuns, color: 'text-primary' },
            { label: 'Time Saved', value: '~4.2h', color: 'text-yellow-400' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-4 text-center"
            >
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-muted mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Workflow Builder */}
        <AnimatePresence>
          {showBuilder && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass rounded-2xl p-6 mb-6 border border-primary/30"
            >
              <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
                <Zap size={14} className="text-primary" />
                Build Custom Automation
              </h3>

              <div className="flex items-start gap-3">
                {WORKFLOW_STEPS.map((step, i) => (
                  <React.Fragment key={step.id}>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted mb-2">{step.label}</p>
                      <select
                        className="input-field text-xs"
                        value={builderStep[step.id] || ''}
                        onChange={(e) => setBuilderStep((p) => ({ ...p, [step.id]: e.target.value }))}
                      >
                        <option value="">Select...</option>
                        {step.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    {i < WORKFLOW_STEPS.length - 1 && (
                      <div className="flex items-center mt-6">
                        <ChevronRight size={16} className="text-muted" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="flex items-center gap-3 mt-4">
                <input placeholder="Automation name..." className="input-field flex-1 text-xs" />
                <button
                  onClick={() => {
                    toast.success('Automation created')
                    setShowBuilder(false)
                    setBuilderStep({})
                  }}
                  className="btn-primary text-xs"
                >
                  Create
                </button>
                <button onClick={() => setShowBuilder(false)} className="btn-ghost text-xs">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Automations List */}
        <div className="space-y-3">
          {automations.map((auto, i) => {
            const Icon = auto.icon
            return (
              <motion.div
                key={auto.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  'glass rounded-2xl p-5 border transition-all',
                  auto.active ? 'border-accent/20' : 'border-border/30 opacity-70'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', auto.bg)}>
                    <Icon size={18} className={auto.color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-text">{auto.name}</h3>
                      {auto.active && (
                        <span className="flex items-center gap-1 text-xs text-accent">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mb-3">{auto.description}</p>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted">Trigger:</span>
                        <span className="text-text bg-surface px-2 py-0.5 rounded-lg">{auto.trigger}</span>
                      </div>
                      <ChevronRight size={12} className="text-muted" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted">Action:</span>
                        <span className="text-text bg-surface px-2 py-0.5 rounded-lg">{auto.action}</span>
                      </div>
                      <span className="text-muted ml-auto">{auto.runs} runs</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleAutomation(auto.id)}
                      className={cn(
                        'p-2 rounded-xl transition-all',
                        auto.active
                          ? 'text-yellow-400 hover:bg-yellow-400/10'
                          : 'text-accent hover:bg-accent/10'
                      )}
                    >
                      {auto.active ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button
                      onClick={() => deleteAutomation(auto.id)}
                      className="p-2 rounded-xl text-muted hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
