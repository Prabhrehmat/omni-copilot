import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import RightPanel from './RightPanel'
import useAppStore from '../../store/useAppStore'

export default function Layout() {
  const { sidebarCollapsed, rightPanelOpen, activeTab } = useAppStore()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg">
      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-accent/8 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-purple-500/8 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      <Sidebar />

      <main className="flex-1 flex overflow-hidden relative">
        <div className={`flex-1 overflow-hidden transition-all duration-300`}>
          <Outlet />
        </div>
        {rightPanelOpen && activeTab === 'chat' && <RightPanel />}
      </main>
    </div>
  )
}
