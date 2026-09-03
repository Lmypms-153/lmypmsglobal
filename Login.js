import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

export default function Login({ onLogin }) {
  const [properties, setProperties] = useState([])
  const [selectedProp, setSelectedProp] = useState(null)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('property') // property | pin

  useEffect(() => {
    loadProperties()
  }, [])

  const loadProperties = async () => {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (data) setProperties(data)
  }

  const selectProperty = (prop) => {
    setSelectedProp(prop)
    setStep('pin')
    setPin('')
  }

  const handlePin = (digit) => {
    if (pin.length < 4) setPin(p => p + digit)
  }

  const handleDelete = () => setPin(p => p.slice(0, -1))

  const handleLogin = async () => {
    if (pin.length !== 4) { toast.error('Enter 4-digit PIN'); return }
    setLoading(true)
    try {
      // Check super admin first (no property needed)
      const { data: adminUser } = await supabase
        .from('users')
        .select('*')
        .eq('pin', pin)
        .eq('role', 'admin')
        .eq('is_active', true)
        .maybeSingle()

      if (adminUser) {
        const { data: allProps } = await supabase.from('properties').select('*').order('name')
        toast.success(`Welcome, ${adminUser.name}!`)
        onLogin(adminUser, allProps || [])
        return
      }

      // Check property staff
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('pin', pin)
        .eq('property_id', selectedProp.id)
        .eq('is_active', true)
        .maybeSingle()

      if (!user) {
        toast.error('Wrong PIN — try again')
        setPin('')
        return
      }

      // Log activity
      await supabase.from('activity_log').insert({
        property_id: selectedProp.id,
        user_name: user.name,
        action: 'Login',
        details: `${user.name} logged in as ${user.role}`
      })

      toast.success(`Welcome, ${user.name}!`)
      const { data: allProps } = await supabase.from('properties').select('*').order('name')
      onLogin(user, allProps || [])
    } catch (e) {
      toast.error('Login failed — check connection')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (pin.length === 4) handleLogin()
  }, [pin])

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏨</div>
          <div className="brand">LMY PMS</div>
          <div className="tagline">Hotel Management System</div>
        </div>

        {step === 'property' && (
          <div>
            <div style={{ color: 'rgba(230,184,74,0.7)', fontSize: 12, fontWeight: 600, textAlign: 'center', marginBottom: 14 }}>
              Select Your Property
            </div>
            {properties.map(p => (
              <div
                key={p.id}
                onClick={() => selectProperty(p)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid rgba(201,146,42,0.2)',
                  background: 'rgba(255,255,255,0.04)',
                  marginBottom: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,146,42,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              >
                <span style={{ fontSize: 20 }}>🏨</span>
                <div>
                  <div style={{ color: 'var(--gold-light)', fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                  <div style={{ color: 'rgba(154,128,96,0.8)', fontSize: 10, marginTop: 1 }}>{p.city}</div>
                </div>
              </div>
            ))}
            <div
              onClick={() => { setSelectedProp(null); setStep('pin') }}
              style={{ textAlign: 'center', marginTop: 12, color: 'rgba(154,128,96,0.6)', fontSize: 11, cursor: 'pointer' }}
            >
              Admin login (no property)
            </div>
          </div>
        )}

        {step === 'pin' && (
          <div>
            <div
              style={{ color: 'rgba(154,128,96,0.7)', fontSize: 11, textAlign: 'center', marginBottom: 16, cursor: 'pointer' }}
              onClick={() => { setStep('property'); setPin('') }}
            >
              ← {selectedProp ? selectedProp.name : 'Admin Login'}
            </div>
            <div style={{ color: 'rgba(230,184,74,0.7)', fontSize: 12, fontWeight: 600, textAlign: 'center', marginBottom: 16 }}>
              Enter Your PIN
            </div>

            <div className="pin-display">
              {[0,1,2,3].map(i => (
                <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
              ))}
            </div>

            <div className="pin-pad">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} className="pin-btn" onClick={() => handlePin(String(n))}>{n}</button>
              ))}
              <button className="pin-btn del" onClick={handleDelete}>⌫</button>
              <button className="pin-btn" onClick={() => handlePin('0')}>0</button>
              <button className="pin-btn enter" onClick={handleLogin} disabled={loading}>
                {loading ? '...' : '✓'}
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, color: 'rgba(154,128,96,0.4)', fontSize: 10 }}>
          LMY Hospitality © 2025
        </div>
      </div>
    </div>
  )
}
