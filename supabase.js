import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://juenzwoyiqjmvyfdelnf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1ZW56d295aXFqbXZ5ZmRlbG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MzI4MjgsImV4cCI6MjEwNDAwODgyOH0.ibggo9onkzcv6bzJ_vLc0uu2mx4mUn8HvIgy-pKlubw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Helper: format number
export const fmt = (n) => Number(n || 0).toLocaleString('en-PK')

// Helper: today's date
export const today = () => new Date().toISOString().split('T')[0]

// Helper: format date for display
export const fmtDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Helper: current time
export const nowTime = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
