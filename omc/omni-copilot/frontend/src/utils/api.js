import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('omni_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('omni_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Chat
export const sendMessage = (data) => api.post('/chat/message', data)
export const uploadFile = (formData) =>
  api.post('/chat/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

// Integrations
export const connectIntegration = (provider) => api.post(`/integrations/${provider}/connect`)
export const disconnectIntegration = (provider) => api.delete(`/integrations/${provider}`)
export const getIntegrationStatus = () => api.get('/integrations/status')

// Email
export const getEmails = (params) => api.get('/email/inbox', { params })
export const getEmail = (id) => api.get(`/email/${id}`)
export const sendEmail = (data) => api.post('/email/send', data)
export const composeEmail = (data) => api.post('/email/compose', data)
export const composeAndSend = (data) => api.post('/email/compose-and-send', data)
export const summarizeEmail = (id) => api.post(`/email/${id}/summarize`)
export const generateReply = (id) => api.post(`/email/${id}/reply`)

// Calendar
export const getEvents = (params) => api.get('/calendar/events', { params })
export const createEvent = (data) => api.post('/calendar/events', data)
export const scheduleMeeting = (data) => api.post('/calendar/schedule-meeting', data)
export const suggestMeetingTime = (data) => api.post('/calendar/suggest-time', data)

// Documents
export const uploadDocument = (formData) =>
  api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const getDocuments = () => api.get('/documents')
export const summarizeDocument = (id) => api.post(`/documents/${id}/summarize`)
export const askDocument = (id, question) => api.post(`/documents/${id}/ask`, { question })

// Notion
export const getNotionPages = () => api.get('/notion/pages')
export const summarizeNotionPage = (id) => api.post(`/notion/pages/${id}/summarize`)

// Slack
export const getSlackChannels = () => api.get('/slack/channels')
export const getSlackMessages = (channelId) => api.get(`/slack/channels/${channelId}/messages`)
export const summarizeSlackChannel = (channelId) => api.post(`/slack/channels/${channelId}/summarize`)

// Discord
export const getDiscordServers = () => api.get('/discord/servers')
export const getDiscordChannels = (serverId) => api.get(`/discord/servers/${serverId}/channels`)
export const summarizeDiscordChannel = (channelId) => api.post(`/discord/channels/${channelId}/summarize`)

// Meetings
export const getMeetings = () => api.get('/meetings')
export const summarizeMeeting = (id) => api.post(`/meetings/${id}/summarize`)

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats')
export const getInsights = () => api.get('/dashboard/insights')

// Search
export const universalSearch = (query) => api.post('/search', { query })

export default api
