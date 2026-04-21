import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAppStore = create(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),

      // Chat
      conversations: [],
      activeConversationId: null,
      isTyping: false,

      createConversation: () => {
        const id = Date.now().toString()
        const conv = { id, title: 'New Chat', messages: [], createdAt: new Date().toISOString() }
        set((s) => ({
          conversations: [conv, ...s.conversations],
          activeConversationId: id,
        }))
        return id
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      addMessage: (convId, message) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: [...c.messages, { ...message, id: Date.now().toString(), timestamp: new Date().toISOString() }],
                  title: c.messages.length === 0 ? message.content.slice(0, 40) + '...' : c.title,
                }
              : c
          ),
        }))
      },

      setTyping: (val) => set({ isTyping: val }),

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get()
        return conversations.find((c) => c.id === activeConversationId) || null
      },

      deleteConversation: (id) => {
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
        }))
      },

      // Integrations
      integrations: {
        googleDrive: false,
        gmail: false,
        oneDrive: false,
        outlook: false,
        slack: false,
        teams: false,
        discord: false,
        notion: false,
        googleCalendar: false,
        outlookCalendar: false,
        googleMeet: false,
        zoom: false,
        googleForms: false,
      },

      setIntegration: (key, value) =>
        set((s) => ({ integrations: { ...s.integrations, [key]: value } })),

      // UI
      sidebarCollapsed: false,
      rightPanelOpen: true,
      activeTab: 'chat',

      setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),
      setRightPanelOpen: (val) => set({ rightPanelOpen: val }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Notifications
      notifications: [],
      addNotification: (n) =>
        set((s) => ({ notifications: [{ ...n, id: Date.now().toString() }, ...s.notifications.slice(0, 9)] })),
    }),
    {
      name: 'omni-copilot-store',
      partialize: (s) => ({
        user: s.user,
        conversations: s.conversations,
        integrations: s.integrations,
        activeConversationId: s.activeConversationId,
      }),
    }
  )
)

export default useAppStore
