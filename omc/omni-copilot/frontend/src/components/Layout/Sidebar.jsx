import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Database, Calendar, Zap, BarChart3,
  Settings, ChevronLeft, ChevronRight, Sparkles, Plus, Trash2, Mail
} from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import { cn } from '../../utils/cn'

const navItems = [
  { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
  { id: 'sources', label: 'Data Sources', icon: Database, path: '/sources' },
  { id: 'email', label: 'Email', icon: Mail, path: '/email' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' },
  { id: 'automations', label: 'Automations', icon: Zap, path: '/automations' },
  { id: 'dashboard', label: 'Insights', icon: BarChart3, path: '/dashboard' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    sidebarCollapsed, setSidebarCollapsed, setActiveTab,
    conversations, activeConversationId, createConversation,
    setActiveConversation, deleteConversation
  } = useAppStore()

  const handleNav = (item) => {
    navigate(item.path)
    setActiveTab(item.id)
  }

  const handleNewChat = () => {
    const id = createConversation()
    navigate('/chat')
    setActiveTab('chat')
  }

  const activeId = navItems.find((n) => location.pathname.startsWith(n.path))?.id

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col h-full glass-strong border-r border-border/50 z-10 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border/30">
        <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 glow-primary">
          <Sparkles size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-bold text-lg gradient-text whitespace-nowrap"
            >
              OmniCopilot
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNewChat}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium',
            'bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-all duration-200',
            sidebarCollapsed && 'justify-center'
          )}
        >
          <Plus size={16} />
          {!sidebarCollapsed && <span>New Chat</span>}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeId === item.id
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNav(item)}
              className={cn(
                'nav-item w-full',
                isActive && 'active',
                sidebarCollapsed && 'justify-center px-2'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && !sidebarCollapsed && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Recent Conversations */}
      {!sidebarCollapsed && conversations.length > 0 && (
        <div className="flex-1 overflow-y-auto px-3 mt-4 min-h-0">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider px-2 mb-2">Recent</p>
          <div className="space-y-1">
            {conversations.slice(0, 10).map((conv) => (
              <motion.div
                key={conv.id}
                whileHover={{ x: 2 }}
                className={cn(
                  'group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all duration-150',
                  activeConversationId === conv.id
                    ? 'bg-primary/15 text-text'
                    : 'text-muted hover:text-text hover:bg-surface/50'
                )}
                onClick={() => { setActiveConversation(conv.id); navigate('/chat') }}
              >
                <MessageSquare size={13} className="flex-shrink-0" />
                <span className="text-xs truncate flex-1">{conv.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all"
                >
                  <Trash2 size={11} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-border/30 mt-auto">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl text-muted hover:text-text hover:bg-surface transition-all duration-200"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  )
}
