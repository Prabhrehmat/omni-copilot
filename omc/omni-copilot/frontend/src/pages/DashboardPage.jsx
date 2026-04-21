import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { TrendingUp, TrendingDown, Mail, CheckSquare, Calendar, Zap, MessageSquare, FileText, Clock, Target } from 'lucide-react'
import { cn } from '../utils/cn'

const productivityData = [
  { day: 'Mon', score: 72, tasks: 8, emails: 23 },
  { day: 'Tue', score: 85, tasks: 12, emails: 18 },
  { day: 'Wed', score: 78, tasks: 9, emails: 31 },
  { day: 'Thu', score: 91, tasks: 15, emails: 14 },
  { day: 'Fri', score: 87, tasks: 11, emails: 27 },
  { day: 'Sat', score: 65, tasks: 5, emails: 8 },
  { day: 'Sun', score: 70, tasks: 6, emails: 12 },
]

const sourceData = [
  { name: 'Gmail', value: 35, color: '#EF4444' },
  { name: 'Slack', value: 28, color: '#F59E0B' },
  { name: 'Notion', value: 18, color: '#6366F1' },
  { name: 'Calendar', value: 12, color: '#22C55E' },
  { name: 'Drive', value: 7, color: '#3B82F6' },
]

const STATS = [
  { label: 'Tasks Completed', value: 47, change: +12, icon: CheckSquare, color: 'text-green-400', bg: 'bg-green-400/10' },
  { label: 'Emails Processed', value: 133, change: +8, icon: Mail, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { label: 'Meetings Attended', value: 18, change: -2, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { label: 'Productivity Score', value: '87%', change: +5, icon: Target, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'AI Actions Taken', value: 24, change: +18, icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { label: 'Docs Summarized', value: 31, change: +6, icon: FileText, color: 'text-orange-400', bg: 'bg-orange-400/10' },
]

const recentInsights = [
  { icon: '📧', text: 'You have 6 emails awaiting response for >48 hours', priority: 'high', time: '2m ago' },
  { icon: '📅', text: 'Sprint planning tomorrow — 8 attendees, 2 hours blocked', priority: 'medium', time: '15m ago' },
  { icon: '💬', text: 'Slack #engineering has 3 unresolved threads needing your input', priority: 'medium', time: '1h ago' },
  { icon: '📝', text: 'Q4 roadmap doc hasn\'t been updated in 5 days', priority: 'low', time: '3h ago' },
  { icon: '✅', text: 'You completed 15% more tasks than last week', priority: 'positive', time: '6h ago' },
]

const PRIORITY_STYLES = {
  high: 'border-red-500/30 bg-red-500/5',
  medium: 'border-yellow-500/30 bg-yellow-500/5',
  low: 'border-border/50',
  positive: 'border-green-500/30 bg-green-500/5',
}

function AnimatedCounter({ value, duration = 1500 }) {
  const [display, setDisplay] = useState(0)
  const isPercent = typeof value === 'string' && value.endsWith('%')
  const num = isPercent ? parseInt(value) : value

  useEffect(() => {
    let start = 0
    const step = num / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= num) { setDisplay(num); clearInterval(timer) }
      else setDisplay(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [num, duration])

  return <span>{display}{isPercent ? '%' : ''}</span>
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs">
      <p className="text-text font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold gradient-text mb-1">Insights Dashboard</h1>
          <p className="text-muted text-sm">Your productivity analytics across all connected platforms</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {STATS.map((stat, i) => {
            const Icon = stat.icon
            const isPositive = stat.change > 0
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-4 hover:border-primary/30 transition-all"
              >
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-3', stat.bg)}>
                  <Icon size={16} className={stat.color} />
                </div>
                <p className="text-xl font-bold text-text">
                  <AnimatedCounter value={stat.value} />
                </p>
                <p className="text-xs text-muted mt-0.5 leading-tight">{stat.label}</p>
                <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', isPositive ? 'text-green-400' : 'text-red-400')}>
                  {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {isPositive ? '+' : ''}{stat.change}% this week
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Productivity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 glass rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-text">Weekly Productivity</h3>
              <div className="flex items-center gap-3 text-xs text-muted">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Score</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent inline-block" />Tasks</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={productivityData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="tasksGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="score" name="Score" stroke="#6366F1" fill="url(#scoreGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="tasks" name="Tasks" stroke="#22C55E" fill="url(#tasksGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Source Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-text mb-5">Data Sources</h3>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                  {sourceData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-3">
              {sourceData.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-muted">{s.name}</span>
                  </div>
                  <span className="text-text font-medium">{s.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Email Volume Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-text mb-5">Email Volume</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={productivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="emails" name="Emails" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* AI Insights Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-text mb-4">AI Insights</h3>
            <div className="space-y-2">
              {recentInsights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className={cn('flex items-start gap-3 p-3 rounded-xl border transition-all hover:border-primary/30 cursor-pointer', PRIORITY_STYLES[insight.priority])}
                >
                  <span className="text-base flex-shrink-0">{insight.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text leading-relaxed">{insight.text}</p>
                    <p className="text-xs text-muted/60 mt-1">{insight.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
