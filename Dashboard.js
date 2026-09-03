import React, { useState, useEffect } from 'react'
import { useApp } from '../App'
import { supabase, fmt, today, fmtDate } from '../lib/supabase'

export default function Dashboard() {
  const { rooms, bookings, services, currentProp, setPage } = useApp()

  const activeBookings = bookings.filter(b => b.status === 'active')
  const todayCI = bookings.filter(b => b.checkin_date === today() && b.status === 'active').length
  const todayCO = bookings.filter(b => b.co_date === today() && b.status === 'checkedout').length
  const todayRev = bookings.filter(b => b.co_date === today() && b.status === 'checkedout').reduce((s,b) => s + (b.grand||0), 0)
  const svcRev = services.filter(s => s.date === today()).reduce((s,sv) => s + (sv.total||0), 0)
  const occRate = rooms.length > 0 ? Math.round(activeBookings.length / rooms.length * 100) : 0

  const roomStats = {
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
  }

  const departures = bookings.filter(b => b.expected_co === today() && b.status === 'active')

  return (
    <div>
      {/* KPI Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card gold">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Today's Revenue</div>
          <div className="stat-value" style={{ fontSize: 18, color: 'var(--gold)' }}>PKR {fmt(todayRev + svcRev)}</div>
          <div className="stat-sub">Room: {fmt(todayRev)} + Svc: {fmt(svcRev)}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">🏨</div>
          <div className="stat-label">Occupancy</div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{occRate}%</div>
          <div className="stat-sub">{activeBookings.length} of {rooms.length} rooms occupied</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-label">Check-ins Today</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{todayCI}</div>
          <div className="stat-sub">New arrivals</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">🚪</div>
          <div className="stat-label">Check-outs Today</div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{todayCO}</div>
          <div className="stat-sub">{departures.length} pending departures</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Room Status */}
        <div className="card">
          <div className="card-header"><h3>🏠 Room Status</h3></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Available', val: roomStats.available, color: 'var(--green)', bg: 'var(--green-bg)' },
                { label: 'Occupied', val: roomStats.occupied, color: 'var(--red)', bg: 'var(--red-bg)' },
                { label: 'Maintenance', val: roomStats.maintenance, color: 'var(--orange)', bg: 'var(--orange-bg)' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: s.color, fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-gold" style={{ width: '100%' }} onClick={() => setPage('dashboard')}>
              View Room Grid
            </button>
          </div>
        </div>

        {/* Pending Departures */}
        <div className="card">
          <div className="card-header">
            <h3>🚪 Departures Today</h3>
            <span style={{ color: 'var(--gold-light)', fontSize: 12 }}>{departures.length} guests</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {departures.length === 0 ? (
              <div className="td-empty">No departures today</div>
            ) : (
              departures.slice(0, 5).map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{b.customer_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{b.room_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--red)', fontSize: 13 }}>PKR {fmt(b.payable)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>balance due</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Room Grid */}
      <div className="card">
        <div className="card-header">
          <h3>🏨 Live Room Grid</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-gold btn-sm" onClick={() => setPage('checkin')}>+ Check In</button>
          </div>
        </div>
        <div className="card-body">
          {rooms.length === 0 ? (
            <div className="td-empty">No rooms setup — go to Room Setup first</div>
          ) : (
            <div className="room-grid">
              {rooms.map(room => {
                const bk = activeBookings.find(b => b.room_id === room.id)
                const status = bk ? 'occupied' : room.status
                return (
                  <div
                    key={room.id}
                    className={`room-card ${status}`}
                    onClick={() => status === 'occupied' ? setPage('checkout') : setPage('checkin')}
                  >
                    <div className="room-num" style={{ color: status === 'occupied' ? 'var(--red)' : status === 'available' ? 'var(--green)' : 'var(--orange)' }}>
                      {room.name}
                    </div>
                    <div className="room-type" style={{ color: 'var(--text2)' }}>{room.type}</div>
                    {bk && <div className="room-guest" style={{ color: 'var(--text)', fontWeight: 700 }}>{bk.customer_name?.split(' ')[0]}</div>}
                    <div className="room-status" style={{ color: status === 'occupied' ? 'var(--red)' : status === 'available' ? 'var(--green)' : 'var(--orange)', textTransform: 'uppercase', fontSize: 9 }}>
                      {status}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
