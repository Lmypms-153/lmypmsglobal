import React, { useState } from 'react'
import { useApp } from '../App'
import { supabase, fmt, today } from '../lib/supabase'
import { toast } from 'react-hot-toast'

const SOURCES = ['Walk-in','Booking.com','Airbnb','Phone','WhatsApp','Corporate','Agent','Repeat Guest']
const PAY_MODES = ['Cash','Card','Bank Transfer','JazzCash','EasyPaisa','Cheque']

export default function CheckIn() {
  const { rooms, bookings, session, currentProp, refresh } = useApp()
  const avail = rooms.filter(r => r.status === 'available' && !bookings.find(b => b.room_id === r.id && b.status === 'active'))

  const blank = {
    room_id: '', customer_name: '', mobile_no: '', cnic: '', cnic2: '',
    address: '', company_name: '', source: 'Walk-in',
    checkin_date: today(), checkout_date: '', days: 1,
    adults: 1, children: 0, rate: 0, advance: 0, discount: 0,
    payment_mode: 'Cash', invoice_type: 'simple', notes: ''
  }
  const [f, setF] = useState(blank)
  const [saving, setSaving] = useState(false)

  const selRoom = rooms.find(r => r.id === f.room_id)

  const calc = () => {
    const roomBill = (f.rate || 0) * (f.days || 1)
    const subTotal = roomBill - (f.discount || 0)
    const gst = f.invoice_type === 'tax' ? Math.round(subTotal * 0.16) : 0
    const bed = f.invoice_type === 'tax' ? Math.round(subTotal * 0.08) : 0
    const grand = subTotal + gst + bed
    const payable = grand - (f.advance || 0)
    return { roomBill, subTotal, gst, bed, grand, payable }
  }

  const { roomBill, subTotal, gst, bed, grand, payable } = calc()

  const updateDay = (checkin, checkout) => {
    if (checkin && checkout) {
      const d = Math.max(1, Math.ceil((new Date(checkout) - new Date(checkin)) / 86400000))
      setF(p => ({ ...p, days: d }))
    }
  }

  const handleSave = async () => {
    if (!f.room_id) { toast.error('Select a room'); return }
    if (!f.customer_name.trim()) { toast.error('Guest name required'); return }
    if (!f.checkin_date) { toast.error('Check-in date required'); return }
    setSaving(true)
    try {
      const formNo = `LMY-${Date.now().toString().slice(-6)}`
      const { error } = await supabase.from('bookings').insert({
        property_id: currentProp.id,
        room_id: f.room_id,
        room_name: selRoom?.name,
        form_no: formNo,
        customer_name: f.customer_name,
        mobile_no: f.mobile_no,
        cnic: f.cnic,
        cnic2: f.cnic2,
        address: f.address,
        company_name: f.company_name,
        source: f.source,
        checkin_date: f.checkin_date,
        checkout_date: f.checkout_date || null,
        expected_co: f.checkout_date || null,
        days: f.days,
        adults: f.adults,
        children: f.children,
        rate: f.rate,
        advance: f.advance,
        discount: f.discount,
        room_bill: roomBill,
        grand: grand,
        payable: payable,
        gst_amount: gst,
        bed_amount: bed,
        payment_mode: f.payment_mode,
        invoice_type: f.invoice_type,
        notes: f.notes,
        status: 'active',
        checked_in_by: session.name,
      })
      if (error) throw error

      // Update room status
      await supabase.from('rooms').update({ status: 'occupied' }).eq('id', f.room_id)

      // Log
      await supabase.from('activity_log').insert({
        property_id: currentProp.id,
        user_name: session.name,
        action: 'Check-in',
        details: `${f.customer_name} checked in to ${selRoom?.name}`
      })

      toast.success(`${f.customer_name} checked in to ${selRoom?.name}!`)
      setF(blank)
      await refresh()
    } catch (e) {
      toast.error('Check-in failed: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Form */}
        <div className="card">
          <div className="card-header"><h3>✅ New Check In</h3></div>
          <div className="card-body">
            {/* Room Selection */}
            <div className="form-group">
              <label>Select Room *</label>
              <select className="form-control" value={f.room_id} onChange={e => {
                const rm = rooms.find(r => r.id === e.target.value)
                setF(p => ({ ...p, room_id: e.target.value, rate: rm?.rate || 0 }))
              }}>
                <option value="">-- Select Available Room --</option>
                {avail.map(r => <option key={r.id} value={r.id}>{r.name} — {r.type} — PKR {fmt(r.rate)}/night</option>)}
              </select>
            </div>

            <div className="g3">
              <div className="form-group">
                <label>Guest Name *</label>
                <input className="form-control" value={f.customer_name} onChange={e => setF(p => ({ ...p, customer_name: e.target.value }))} placeholder="Full name"/>
              </div>
              <div className="form-group">
                <label>Mobile No.</label>
                <input className="form-control" value={f.mobile_no} onChange={e => setF(p => ({ ...p, mobile_no: e.target.value }))} placeholder="03XX-XXXXXXX"/>
              </div>
              <div className="form-group">
                <label>CNIC No.</label>
                <input className="form-control" value={f.cnic} onChange={e => setF(p => ({ ...p, cnic: e.target.value }))} placeholder="XXXXX-XXXXXXX-X"/>
              </div>
            </div>

            <div className="g3">
              <div className="form-group">
                <label>CNIC 2 (Companion)</label>
                <input className="form-control" value={f.cnic2} onChange={e => setF(p => ({ ...p, cnic2: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label>Company / Organization</label>
                <input className="form-control" value={f.company_name} onChange={e => setF(p => ({ ...p, company_name: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label>Source</label>
                <select className="form-control" value={f.source} onChange={e => setF(p => ({ ...p, source: e.target.value }))}>
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="g4">
              <div className="form-group">
                <label>Check-in Date *</label>
                <input type="date" className="form-control" value={f.checkin_date} onChange={e => { setF(p => ({ ...p, checkin_date: e.target.value })); updateDay(e.target.value, f.checkout_date) }}/>
              </div>
              <div className="form-group">
                <label>Check-out Date</label>
                <input type="date" className="form-control" value={f.checkout_date} onChange={e => { setF(p => ({ ...p, checkout_date: e.target.value })); updateDay(f.checkin_date, e.target.value) }}/>
              </div>
              <div className="form-group">
                <label>Adults</label>
                <input type="number" className="form-control" value={f.adults} min={1} onChange={e => setF(p => ({ ...p, adults: +e.target.value }))}/>
              </div>
              <div className="form-group">
                <label>Children</label>
                <input type="number" className="form-control" value={f.children} min={0} onChange={e => setF(p => ({ ...p, children: +e.target.value }))}/>
              </div>
            </div>

            <div className="g4">
              <div className="form-group">
                <label>Rate / Night (PKR)</label>
                <input type="number" className="form-control" value={f.rate} onChange={e => setF(p => ({ ...p, rate: +e.target.value }))}/>
              </div>
              <div className="form-group">
                <label>Nights</label>
                <input type="number" className="form-control" value={f.days} min={1} onChange={e => setF(p => ({ ...p, days: +e.target.value }))}/>
              </div>
              <div className="form-group">
                <label>Advance (PKR)</label>
                <input type="number" className="form-control" value={f.advance} min={0} onChange={e => setF(p => ({ ...p, advance: +e.target.value }))}/>
              </div>
              <div className="form-group">
                <label>Discount (PKR)</label>
                <input type="number" className="form-control" value={f.discount} min={0} onChange={e => setF(p => ({ ...p, discount: +e.target.value }))}/>
              </div>
            </div>

            <div className="g3">
              <div className="form-group">
                <label>Payment Mode</label>
                <select className="form-control" value={f.payment_mode} onChange={e => setF(p => ({ ...p, payment_mode: e.target.value }))}>
                  {PAY_MODES.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Invoice Type</label>
                <select className="form-control" value={f.invoice_type} onChange={e => setF(p => ({ ...p, invoice_type: e.target.value }))}>
                  <option value="simple">Simple Invoice</option>
                  <option value="tax">Tax Invoice (GST+Bed)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input className="form-control" value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} placeholder="Any special requests..."/>
              </div>
            </div>
          </div>
        </div>

        {/* Bill Summary */}
        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-header"><h3>💰 Bill Summary</h3></div>
            <div className="card-body">
              {[
                { label: 'Room', val: selRoom?.name || 'Not selected' },
                { label: 'Rate/Night', val: `PKR ${fmt(f.rate)}` },
                { label: 'Nights', val: f.days },
                { label: 'Room Bill', val: `PKR ${fmt(roomBill)}` },
                { label: 'Discount', val: `- PKR ${fmt(f.discount)}` },
                { label: 'Sub Total', val: `PKR ${fmt(subTotal)}` },
                ...(gst ? [{ label: 'GST 16%', val: `PKR ${fmt(gst)}` }] : []),
                ...(bed ? [{ label: 'Bed Tax 8%', val: `PKR ${fmt(bed)}` }] : []),
                { label: 'GRAND TOTAL', val: `PKR ${fmt(grand)}`, bold: true },
                { label: 'Advance Paid', val: `- PKR ${fmt(f.advance)}` },
                { label: 'BALANCE DUE', val: `PKR ${fmt(payable)}`, bold: true, color: 'var(--red)' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: row.bold ? 13 : 12 }}>
                  <span style={{ color: 'var(--text2)' }}>{row.label}</span>
                  <span style={{ fontWeight: row.bold ? 900 : 600, color: row.color || 'var(--text)' }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="btn btn-gold btn-lg" style={{ width: '100%' }} onClick={handleSave} disabled={saving}>
            {saving ? 'Processing...' : '✅ Complete Check In'}
          </button>
        </div>
      </div>
    </div>
  )
}
