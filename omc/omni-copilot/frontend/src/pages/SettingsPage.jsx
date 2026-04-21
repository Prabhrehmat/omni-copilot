import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Key, Bell, Palette, Shield, Cpu, Save, Eye, EyeOff } from 'lucide-react'
import { cn } from '../utils/cn'
import toast from 'react-hot-toast'

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'ai', label: 'AI Settings', icon: Cpu },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile')
  const [showKey, setShowKey] = useState({})
  const [settings, setSettings] = useState({
    name: 'Alex Johnson',
    email: 'alex@example.com',
    openaiKey: '',
    geminiKey: '',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2048,
    emailNotifs: true,
    meetingNotifs: true,
    slackNotifs: false,
    theme: 'dark',
    language: 'en',
  })

  const update = (key, val) => setSettings((p) => ({ ...p, [key]: val }))

  const handleSave = () => toast.success('Settings saved')

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold gradient-text mb-1">Settings</h1>
          <p className="text-muted text-sm">Configure OmniCopilot to your preferences</p>
        </motion.div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {SECTIONS.map((s) => {
                const Icon = s.icon
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all',
                      activeSection === s.id
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-muted hover:text-text hover:bg-surface'
                    )}
                  >
                    <Icon size={15} />
                    {s.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 glass rounded-2xl p-6">
            {activeSection === 'profile' && (
              <SettingsSection title="Profile">
                <Field label="Display Name">
                  <input className="input-field" value={settings.name} onChange={(e) => update('name', e.target.value)} />
                </Field>
                <Field label="Email">
                  <input className="input-field" value={settings.email} onChange={(e) => update('email', e.target.value)} />
                </Field>
                <Field label="Timezone">
                  <select className="input-field">
                    <option>UTC-8 (Pacific Time)</option>
                    <option>UTC-5 (Eastern Time)</option>
                    <option>UTC+0 (GMT)</option>
                    <option>UTC+5:30 (IST)</option>
                  </select>
                </Field>
              </SettingsSection>
            )}

            {activeSection === 'ai' && (
              <SettingsSection title="AI Settings">
                <Field label="AI Model">
                  <select className="input-field" value={settings.model} onChange={(e) => update('model', e.target.value)}>
                    <option value="gpt-4o">GPT-4o (Recommended)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast)</option>
                    <option value="gemini-pro">Gemini Pro</option>
                    <option value="gemini-ultra">Gemini Ultra</option>
                  </select>
                </Field>
                <Field label={`Temperature: ${settings.temperature}`} hint="Higher = more creative, Lower = more precise">
                  <input
                    type="range" min="0" max="1" step="0.1"
                    value={settings.temperature}
                    onChange={(e) => update('temperature', parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </Field>
                <Field label="Max Tokens">
                  <select className="input-field" value={settings.maxTokens} onChange={(e) => update('maxTokens', parseInt(e.target.value))}>
                    <option value={1024}>1,024</option>
                    <option value={2048}>2,048</option>
                    <option value={4096}>4,096</option>
                    <option value={8192}>8,192</option>
                  </select>
                </Field>
                <Field label="Memory">
                  <Toggle label="Remember conversation context" defaultChecked />
                </Field>
                <Field label="Auto-suggestions">
                  <Toggle label="Show smart suggestions in chat" defaultChecked />
                </Field>
              </SettingsSection>
            )}

            {activeSection === 'api' && (
              <SettingsSection title="API Keys">
                <p className="text-xs text-muted mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  🔒 API keys are encrypted and stored securely. Never share them with anyone.
                </p>
                {[
                  { key: 'openaiKey', label: 'OpenAI API Key', placeholder: 'sk-...' },
                  { key: 'geminiKey', label: 'Google Gemini API Key', placeholder: 'AIza...' },
                ].map((f) => (
                  <Field key={f.key} label={f.label}>
                    <div className="relative">
                      <input
                        type={showKey[f.key] ? 'text' : 'password'}
                        className="input-field pr-10"
                        placeholder={f.placeholder}
                        value={settings[f.key]}
                        onChange={(e) => update(f.key, e.target.value)}
                      />
                      <button
                        onClick={() => setShowKey((p) => ({ ...p, [f.key]: !p[f.key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                      >
                        {showKey[f.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </Field>
                ))}
              </SettingsSection>
            )}

            {activeSection === 'notifications' && (
              <SettingsSection title="Notifications">
                {[
                  { key: 'emailNotifs', label: 'Email summaries', desc: 'Get notified when new emails are summarized' },
                  { key: 'meetingNotifs', label: 'Meeting reminders', desc: '15 minutes before each meeting' },
                  { key: 'slackNotifs', label: 'Slack digests', desc: 'Daily summary of important Slack messages' },
                ].map((n) => (
                  <Field key={n.key} label={n.label} hint={n.desc}>
                    <Toggle
                      label=""
                      checked={settings[n.key]}
                      onChange={(v) => update(n.key, v)}
                    />
                  </Field>
                ))}
              </SettingsSection>
            )}

            {activeSection === 'appearance' && (
              <SettingsSection title="Appearance">
                <Field label="Theme">
                  <div className="flex gap-3">
                    {['dark', 'darker', 'midnight'].map((t) => (
                      <button
                        key={t}
                        onClick={() => update('theme', t)}
                        className={cn(
                          'flex-1 py-2 rounded-xl text-xs font-medium border transition-all capitalize',
                          settings.theme === t
                            ? 'border-primary/50 bg-primary/20 text-primary'
                            : 'border-border/50 text-muted hover:text-text'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Language">
                  <select className="input-field" value={settings.language} onChange={(e) => update('language', e.target.value)}>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                  </select>
                </Field>
              </SettingsSection>
            )}

            {activeSection === 'security' && (
              <SettingsSection title="Security">
                <Field label="Two-Factor Authentication">
                  <Toggle label="Enable 2FA" />
                </Field>
                <Field label="Session Timeout">
                  <select className="input-field">
                    <option>1 hour</option>
                    <option>8 hours</option>
                    <option>24 hours</option>
                    <option>Never</option>
                  </select>
                </Field>
                <div className="pt-2">
                  <button className="text-xs text-red-400 hover:text-red-300 transition-colors">
                    Revoke all active sessions
                  </button>
                </div>
              </SettingsSection>
            )}

            <div className="flex justify-end mt-6 pt-4 border-t border-border/30">
              <button onClick={handleSave} className="btn-primary">
                <Save size={14} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsSection({ title, children }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-text mb-5">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text mb-1.5">{label}</label>
      {hint && <p className="text-xs text-muted mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

function Toggle({ label, defaultChecked, checked, onChange }) {
  const [on, setOn] = useState(defaultChecked ?? checked ?? false)
  const toggle = () => { setOn(!on); onChange?.(!on) }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        className={cn(
          'relative w-10 h-5 rounded-full transition-all duration-200',
          on ? 'bg-primary' : 'bg-surface border border-border'
        )}
      >
        <motion.div
          animate={{ x: on ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
        />
      </button>
      {label && <span className="text-sm text-muted">{label}</span>}
    </div>
  )
}
