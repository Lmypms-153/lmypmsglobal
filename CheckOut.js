import React, { useState } from 'react'
import { useApp } from '../App'
import { supabase, fmt, today, fmtDate } from '../lib/supabase'
import { toast } from 'react-hot-toast'

export default function CheckOut() {
  const { bookings, services, rooms, session, currentProp, refresh } = useApp()
  const active = bookings.filter(b => b.status === 'active')
  const [selId, setSelId] = useState('')
  const [loading, setLoading] = useState(false)

  const bk = active.find(b => b.id === selId)
  const bkSvcs = services.filter(s => s.booking_id === selId)
  const svcTotal = bkSvcs.reduce((s, sv) => s + (sv.total || 0), 0)

  const totalBill = (bk?.room_bill || 0) + svcTotal + (bk?.gst_amount || 0) + (bk?.bed_amount || 0)
  const balanceDue = totalBill - (bk?.advance || 0)

  const handleCheckout = async () => {
    if (!bk) { toast.error('Select a booking'); return }
    setLoading(true)
    try {
      await supabase.from('bookings').update({
        status: 'checkedout',
        co_date: today(),
        svc_total: svcTotal,
        grand: totalBill,
        payable: balanceDue,
        checked_out_by: session.name,
      }).eq('id', bk.id)

      await supabase.from('rooms').update({ status: 'available' }).eq('id', bk.room_id)

      await supabase.from('activity_log').insert({
        property_id: currentProp.id,
        user_name: session.name,
        action: 'Check-out',
        details: `${bk.customer_name} checked out from ${bk.room_name}. Bill: PKR ${fmt(totalBill)}`
      })

      toast.success(`${bk.customer_name} checked out successfully!`)
      setSelId('')
      await refresh()
    } catch (e) {
      toast.error('Checkout failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-header"><h3>🚪 Select Guest to Check Out</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            {active.length === 0
              ? <div className="td-empty">No active guests</div>
              : active.map(b => (
                <div
                  key={b.id}
                  onClick={() => setSelId(b.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: selId === b.id ? 'var(--cream)' : 'white',
                    borderLeft: selId === b.id ? '3px solid var(--gold)' : '3px solid transparent',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{b.customer_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{b.room_name} · Since {fmtDate(b.checkin_date)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--red)', fontSize: 13 }}>PKR {fmt(b.payable)}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>balance</div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        <div>
          {bk ? (
            <div className="card">
              <div className="card-header"><h3>💰 Final Bill — {bk.customer_name}</h3></div>
              <div className="card-body">
                {[
                  { l: 'Room', v: bk.room_name },
                  { l: 'Check-in', v: fmtDate(bk.checkin_date) },
                  { l: 'Nights', v: bk.days },
                  { l: 'Room Bill', v: `PKR ${fmt(bk.room_bill)}` },
                  { l: 'Services', v: `PKR ${fmt(svcTotal)}` },
                  ...(bk.gst_amount ? [{ l: 'GST', v: `PKR ${fmt(bk.gst_amount)}` }] : []),
                  ...(bk.bed_amount ? [{ l: 'Bed Tax', v: `PKR ${fmt(bk.bed_amount)}` }] : []),
                  { l: 'TOTAL BILL', v: `PKR ${fmt(totalBill)}`, bold: true },
                  { l: 'Advance Paid', v: `- PKR ${fmt(bk.advance)}` },
                  { l: 'BALANCE DUE', v: `PKR ${fmt(balanceDue)}`, bold: true, color: 'var(--red)' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: row.bold ? 13 : 12 }}>
                    <span style={{ color: 'var(--text2)' }}>{row.l}</span>
                    <span style={{ fontWeight: row.bold ? 900 : 600, color: row.color || 'var(--text)' }}>{row.v}</span>
                  </div>
                ))}
                <div style={{ marginTop: 16 }}>
                  <button className="btn btn-red btn-lg" style={{ width: '100%' }} onClick={handleCheckout} disabled={loading}>
                    {loading ? 'Processing...' : '🚪 Complete Check Out'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card"><div className="td-empty">Select a guest to check out</div></div>
          )}
        </div>
      </div>
    </div>
  )
}
