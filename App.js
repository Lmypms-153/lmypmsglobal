import React, { useState, useEffect, createContext, useContext } from 'react'
import { supabase, today, fmtDate } from './lib/supabase'
import { Toaster, toast } from 'react-hot-toast'
import './index.css'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CheckIn from './pages/CheckIn'
import CheckOut from './pages/CheckOut'
import RoomService from './pages/RoomService'
import History from './pages/History'
import Housekeeping from './pages/Housekeeping'
import Staff from './pages/Staff'
import Inventory from './pages/Inventory'
import Maintenance from './pages/Maintenance'
import Accounts from './pages/Accounts'
import Reports from './pages/Reports'
import RoomSetup from './pages/RoomSetup'
import NightAudit from './pages/NightAudit'
import GuestFolio from './pages/GuestFolio'
import ArrivalsToday from './pages/ArrivalsToday'
import AdminPanel from './pages/AdminPanel'

// Context
export const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

const NAV = [
  { id: 'dashboard',    icon: '🏨', label: 'Dashboard',       section: 'Main' },
  { id: 'arrivals',     icon: '📋', label: 'Arrivals Today',  section: 'Main' },
  { id: 'checkin',      icon: '✅', label: 'Check In',        section: 'Main' },
  { id: 'checkout',     icon: '🚪', label: 'Check Out',       section: 'Main' },
  { id: 'folio',        icon: '📄', label: 'Guest Folio',     section: 'Main' },
  { id: 'service',      icon: '🍽️', label: 'Room Service',    section: 'Main' },
  { id: 'history',      icon: '🗂️', label: 'History',         section: 'Main' },
  { id: 'housekeeping', icon: '🧹', label: 'Housekeeping',    section: 'Operations' },
  { id: 'nightaudit',   icon: '🌙', label: 'Night Audit',     section: 'Operations' },
  { id: 'staff',        icon: '👤', label: 'Staff & HR',      section: 'Operations' },
  { id: 'inventory',    icon: '📦', label: 'Inventory',       section: 'Operations' },
  { id: 'maintenance',  icon: '🔧', label: 'Maintenance',     section: 'Operations' },
  { id: 'accounts',     icon: '💰', label: 'Accounts',        section: 'Financials' },
  { id: 'reports',      icon: '📊', label: 'Reports',         section: 'Financials' },
  { id: 'roomsetup',    icon: '⚙️', label: 'Room Setup',      section: 'Settings' },
]

const ADMIN_NAV = [
  { id: 'admin', icon: '🛡️', label: 'Admin Panel', section: 'Admin' },
]

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('dashboard')
  const [properties, setProperties] = useState([])
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [services, setServices] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setLoading(false)
  }, [])

  const loadPropertyData = async (propId) => {
    if (!propId) return
    const [r, b, s] = await Promise.all([
      supabase.from('rooms').select('*').eq('property_id', propId).order('name'),
      supabase.from('bookings').select('*').eq('property_id', propId).order('created_at', { ascending: false }),
      supabase.from('services').select('*').eq('property_id', propId).order('created_at', { ascending: false }),
    ])
    if (r.data) setRooms(r.data)
    if (b.data) setBookings(b.data)
    if (s.data) setServices(s.data)
  }

  const handleLogin = async (user, props) => {
    setSession(user)
    setProperties(props)
    if (user.property_id) {
      await loadPropertyData(user.property_id)
    }
    setPage(user.role === 'admin' ? 'admin' : 'dashboard')
  }

  const handleLogout = () => {
    setSession(null)
    setPage('dashboard')
    setRooms([])
    setBookings([])
    setServices([])
    toast.success('Logged out successfully')
  }

  const refresh = async () => {
    if (session?.property_id) {
      await loadPropertyData(session.property_id)
    }
  }

  const currentProp = properties.find(p => p.id === session?.property_id)

  const ctx = {
    session, properties, rooms, bookings, services,
    currentProp, setPage, refresh, handleLogout,
    setRooms, setBookings, setServices
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--dark2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--gold-light)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏨</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>LMY PMS Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <>
        <Toaster position="top-right" />
        <Login onLogin={handleLogin} />
      </>
    )
  }

  const navItems = session.role === 'admin'
    ? [...NAV, ...ADMIN_NAV]
    : session.role === 'receptionist'
      ? NAV.filter(n => ['dashboard','arrivals','checkin','checkout','service','history','folio'].includes(n.id))
      : NAV

  const sections = [...new Set(navItems.map(n => n.section))]

  const PAGES = {
    dashboard:    <Dashboard />,
    arrivals:     <ArrivalsToday />,
    checkin:      <CheckIn />,
    checkout:     <CheckOut />,
    folio:        <GuestFolio />,
    service:      <RoomService />,
    history:      <History />,
    housekeeping: <Housekeeping />,
    nightaudit:   <NightAudit />,
    staff:        <Staff />,
    inventory:    <Inventory />,
    maintenance:  <Maintenance />,
    accounts:     <Accounts />,
    reports:      <Reports />,
    roomsetup:    <RoomSetup />,
    admin:        <AdminPanel />,
  }

  return (
    <AppContext.Provider value={ctx}>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: 12, fontWeight: 600 } }} />
      <div className="app-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-logo">
            <div className="hotel-name">
              {currentProp?.name || 'LMY PMS'}
            </div>
            <div className="prop-label">
              {session.role === 'admin' ? 'Super Admin' : currentProp?.city || 'Property'}
            </div>
          </div>

          {sections.map(sec => (
            <div key={sec} className="nav-section">
              <div className="nav-section-title">{sec}</div>
              {navItems.filter(n => n.section === sec).map(n => (
                <div
                  key={n.id}
                  className={`nav-item ${page === n.id ? 'active' : ''}`}
                  onClick={() => { setPage(n.id); setSidebarOpen(false) }}
                >
                  <span className="nav-icon">{n.icon}</span>
                  <span>{n.label}</span>
                </div>
              ))}
            </div>
          ))}

          <div className="sidebar-footer">
            <div className="user-badge" onClick={handleLogout} title="Click to logout">
              <div className="u-avatar">{session.name?.[0]?.toUpperCase() || 'U'}</div>
              <div className="u-info">
                <div className="u-name">{session.name}</div>
                <div className="u-role">{session.role} · Logout</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="main-content">
          <div className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="btn btn-gray btn-sm"
                style={{ display: 'none' }}
                onClick={() => setSidebarOpen(p => !p)}
              >☰</button>
              <div className="topbar-title">
                {navItems.find(n => n.id === page)?.label || 'LMY PMS'}
              </div>
            </div>
            <div className="topbar-right">
              <div className="topbar-date">
                {new Date().toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              {currentProp && (
                <span className="badge badge-gold">{currentProp.name}</span>
              )}
            </div>
          </div>

          <div className="page-content">
            {PAGES[page] || <Dashboard />}
          </div>
        </div>
      </div>
    </AppContext.Provider>
  )
}
