import React, { useState, useEffect, createContext, useContext } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Toaster, toast } from 'react-hot-toast'

const supabase = createClient(
  'https://juenzwoyiqjmvyfdelnf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1ZW56d295aXFqbXZ5ZmRlbG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MzI4MjgsImV4cCI6MjEwNDAwODgyOH0.ibggo9onkzcv6bzJ_vLc0uu2mx4mUn8HvIgy-pKlubw'
)

const fmt = n => Number(n||0).toLocaleString('en-PK')
const today = () => new Date().toISOString().split('T')[0]
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-PK',{day:'2-digit',month:'short',year:'numeric'}) : '-'

export const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

export default function App() {
  const [session, setSession] = useState(null)
  const [props, setProps] = useState([])
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [services, setServices] = useState([])
  const [page, setPage] = useState('dashboard')
  const [loading, setLoading] = useState(false)

  const loadData = async (propId) => {
    if (!propId) return
    const [r, b, s] = await Promise.all([
      supabase.from('rooms').select('*').eq('property_id', propId).order('name'),
      supabase.from('bookings').select('*').eq('property_id', propId).order('created_at', {ascending: false}),
      supabase.from('services').select('*').eq('property_id', propId).order('created_at', {ascending: false}),
    ])
    if (r.data) setRooms(r.data)
    if (b.data) setBookings(b.data)
    if (s.data) setServices(s.data)
  }

  const handleLogin = async (user, allProps) => {
    setSession(user)
    setProps(allProps)
    if (user.property_id) await loadData(user.property_id)
    setPage('dashboard')
  }

  const handleLogout = () => {
    setSession(null)
    setRooms([]); setBookings([]); setServices([])
    toast.success('Logged out')
  }

  const refresh = () => session?.property_id && loadData(session.property_id)
  const currentProp = props.find(p => p.id === session?.property_id)

  const ctx = { session, props, rooms, bookings, services, currentProp, setPage, refresh, handleLogout, supabase, fmt, today, fmtDate }

  if (!session) return (
    <>
      <Toaster position="top-right"/>
      <Login supabase={supabase} onLogin={handleLogin}/>
    </>
  )

  const activeBookings = bookings.filter(b => b.status === 'active')
  const occRate = rooms.length > 0 ? Math.round(activeBookings.length / rooms.length * 100) : 0
  const todayRev = bookings.filter(b => b.co_date === today() && b.status === 'checkedout').reduce((s,b) => s+(b.grand||0), 0)

  const NAV = [
    {id:'dashboard', icon:'🏨', label:'Dashboard', sec:'Main'},
    {id:'checkin', icon:'✅', label:'Check In', sec:'Main'},
    {id:'checkout', icon:'🚪', label:'Check Out', sec:'Main'},
    {id:'history', icon:'📋', label:'History', sec:'Main'},
    {id:'roomsetup', icon:'⚙️', label:'Room Setup', sec:'Settings'},
  ]

  return (
    <AppCtx.Provider value={ctx}>
      <Toaster position="top-right"/>
      <div style={{display:'flex', minHeight:'100vh', fontFamily:'Inter,sans-serif'}}>
        {/* Sidebar */}
        <aside style={{width:220, background:'#1a1208', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, zIndex:100}}>
          <div style={{padding:'20px 16px 12px', borderBottom:'1px solid rgba(201,146,42,0.2)'}}>
            <div style={{fontSize:15, fontWeight:800, color:'#e6b84a'}}>{currentProp?.name || 'LMY PMS'}</div>
            <div style={{fontSize:10, color:'#9a8060', textTransform:'uppercase', marginTop:2}}>{currentProp?.city || 'Hotel Management'}</div>
          </div>
          <div style={{flex:1, overflowY:'auto', padding:'8px 0'}}>
            {['Main','Settings'].map(sec => (
              <div key={sec}>
                <div style={{fontSize:9, color:'rgba(154,128,96,0.5)', textTransform:'uppercase', letterSpacing:'1px', padding:'8px 16px 4px'}}>{sec}</div>
                {NAV.filter(n => n.sec === sec).map(n => (
                  <div key={n.id} onClick={() => setPage(n.id)} style={{display:'flex', alignItems:'center', gap:8, padding:'9px 16px', cursor:'pointer', fontSize:12, fontWeight:500, color: page===n.id ? '#e6b84a' : 'rgba(230,184,74,0.5)', background: page===n.id ? 'rgba(201,146,42,0.15)' : 'transparent', borderLeft: page===n.id ? '3px solid #c9922a' : '3px solid transparent', transition:'all 0.15s'}}>
                    <span>{n.icon}</span><span>{n.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{padding:12, borderTop:'1px solid rgba(201,146,42,0.15)'}}>
            <div onClick={handleLogout} style={{display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'rgba(201,146,42,0.1)', borderRadius:8, cursor:'pointer'}}>
              <div style={{width:30, height:30, background:'#c9922a', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12, color:'#1a1208', flexShrink:0}}>{session.name?.[0]?.toUpperCase()}</div>
              <div><div style={{fontSize:11, fontWeight:700, color:'#e6b84a'}}>{session.name}</div><div style={{fontSize:9, color:'#9a8060', textTransform:'uppercase'}}>{session.role} · Logout</div></div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div style={{marginLeft:220, flex:1, display:'flex', flexDirection:'column'}}>
          <div style={{background:'white', borderBottom:'1px solid #e0cfa0', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 8px rgba(26,18,8,0.06)'}}>
            <div style={{fontSize:16, fontWeight:800}}>{NAV.find(n=>n.id===page)?.label || 'LMY PMS'}</div>
            <div style={{display:'flex', gap:12, alignItems:'center'}}>
              <span style={{fontSize:11, color:'#9a8060'}}>{new Date().toLocaleDateString('en-PK',{weekday:'short',day:'numeric',month:'short'})}</span>
              {currentProp && <span style={{background:'#fff8e1', color:'#8b6000', padding:'2px 10px', borderRadius:20, fontSize:10, fontWeight:700}}>{currentProp.name}</span>}
            </div>
          </div>
          <div style={{padding:24, flex:1, background:'#f5f0e8'}}>
            {page === 'dashboard' && <Dashboard rooms={rooms} bookings={bookings} services={services} occRate={occRate} todayRev={todayRev} setPage={setPage} fmt={fmt} today={today} fmtDate={fmtDate}/>}
            {page === 'checkin' && <CheckIn rooms={rooms} bookings={bookings} session={session} currentProp={currentProp} supabase={supabase} refresh={refresh} fmt={fmt} today={today}/>}
            {page === 'checkout' && <CheckOut bookings={bookings} services={services} session={session} currentProp={currentProp} supabase={supabase} refresh={refresh} fmt={fmt} today={today} fmtDate={fmtDate}/>}
            {page === 'history' && <History bookings={bookings} fmt={fmt} fmtDate={fmtDate}/>}
            {page === 'roomsetup' && <RoomSetup rooms={rooms} setRooms={setRooms} currentProp={currentProp} supabase={supabase} refresh={refresh}/>}
          </div>
        </div>
      </div>
    </AppCtx.Provider>
  )
}

// ============ LOGIN ============
function Login({supabase, onLogin}) {
  const [properties, setProperties] = useState([])
  const [selProp, setSelProp] = useState(null)
  const [pin, setPin] = useState('')
  const [step, setStep] = useState('property')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('properties').select('*').eq('is_active', true).order('name')
      .then(({data}) => data && setProperties(data))
  }, [])

  const handlePinEntry = async (digit) => {
    const newPin = pin + digit
    setPin(newPin)
    if (newPin.length === 4) {
      setLoading(true)
      try {
        // Check admin
        const {data: admin} = await supabase.from('users').select('*').eq('pin', newPin).eq('role', 'admin').eq('is_active', true).maybeSingle()
        if (admin) {
          const {data: allProps} = await supabase.from('properties').select('*').order('name')
          toast.success(`Welcome, ${admin.name}!`)
          onLogin(admin, allProps || [])
          return
        }
        // Check staff
        if (selProp) {
          const {data: user} = await supabase.from('users').select('*').eq('pin', newPin).eq('property_id', selProp.id).eq('is_active', true).maybeSingle()
          if (user) {
            const {data: allProps} = await supabase.from('properties').select('*').order('name')
            toast.success(`Welcome, ${user.name}!`)
            onLogin(user, allProps || [])
            return
          }
        }
        toast.error('Wrong PIN')
        setPin('')
      } catch(e) { toast.error('Error: ' + e.message); setPin('') }
      finally { setLoading(false) }
    }
  }

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg,#0f0d08,#1a1208,#2c2010)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif'}}>
      <div style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(201,146,42,0.2)', borderRadius:20, padding:40, width:'100%', maxWidth:400, boxShadow:'0 20px 60px rgba(0,0,0,0.4)'}}>
        <div style={{textAlign:'center', marginBottom:32}}>
          <div style={{fontSize:40, marginBottom:8}}>🏨</div>
          <div style={{fontSize:26, fontWeight:900, color:'#e6b84a', letterSpacing:1}}>LMY PMS</div>
          <div style={{fontSize:10, color:'rgba(154,128,96,0.7)', textTransform:'uppercase', letterSpacing:3, marginTop:4}}>Hotel Management System</div>
        </div>

        {step === 'property' && (
          <div>
            <div style={{color:'rgba(230,184,74,0.7)', fontSize:12, fontWeight:600, textAlign:'center', marginBottom:14}}>Select Your Property</div>
            {properties.map(p => (
              <div key={p.id} onClick={() => {setSelProp(p); setStep('pin')}} style={{padding:'12px 16px', borderRadius:10, border:'1px solid rgba(201,146,42,0.2)', background:'rgba(255,255,255,0.04)', marginBottom:8, cursor:'pointer', display:'flex', alignItems:'center', gap:10}} onMouseEnter={e=>e.currentTarget.style.background='rgba(201,146,42,0.12)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}>
                <span style={{fontSize:20}}>🏨</span>
                <div><div style={{color:'#e6b84a', fontWeight:700, fontSize:13}}>{p.name}</div><div style={{color:'rgba(154,128,96,0.7)', fontSize:10, marginTop:1}}>{p.city}</div></div>
              </div>
            ))}
            <div onClick={() => setStep('pin')} style={{textAlign:'center', marginTop:12, color:'rgba(154,128,96,0.5)', fontSize:11, cursor:'pointer'}}>Admin login (no property)</div>
          </div>
        )}

        {step === 'pin' && (
          <div>
            <div onClick={() => {setStep('property'); setPin('')}} style={{color:'rgba(154,128,96,0.6)', fontSize:11, textAlign:'center', marginBottom:16, cursor:'pointer'}}>← {selProp ? selProp.name : 'Admin Login'}</div>
            <div style={{color:'rgba(230,184,74,0.7)', fontSize:12, fontWeight:600, textAlign:'center', marginBottom:16}}>Enter Your 4-Digit PIN</div>
            <div style={{display:'flex', justifyContent:'center', gap:10, marginBottom:20}}>
              {[0,1,2,3].map(i => <div key={i} style={{width:14, height:14, borderRadius:'50%', border:'2px solid rgba(201,146,42,0.4)', background: i < pin.length ? '#c9922a' : 'transparent', transition:'all 0.2s'}}/>)}
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, maxWidth:240, margin:'0 auto 20px'}}>
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} onClick={() => !loading && handlePinEntry(String(n))} style={{padding:14, borderRadius:8, border:'1px solid rgba(201,146,42,0.2)', background:'rgba(255,255,255,0.05)', color:'#e6b84a', fontSize:18, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif'}}>{n}</button>
              ))}
              <button onClick={() => setPin(p => p.slice(0,-1))} style={{padding:14, borderRadius:8, border:'1px solid rgba(201,146,42,0.2)', background:'rgba(255,255,255,0.05)', color:'#e6b84a', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif'}}>⌫</button>
              <button onClick={() => !loading && handlePinEntry('0')} style={{padding:14, borderRadius:8, border:'1px solid rgba(201,146,42,0.2)', background:'rgba(255,255,255,0.05)', color:'#e6b84a', fontSize:18, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif'}}>0</button>
              <button style={{padding:14, borderRadius:8, border:'none', background:'#c9922a', color:'#1a1208', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'Inter,sans-serif'}}>{loading ? '...' : '✓'}</button>
            </div>
          </div>
        )}
        <div style={{textAlign:'center', marginTop:16, color:'rgba(154,128,96,0.3)', fontSize:10}}>LMY Hospitality © 2025</div>
      </div>
    </div>
  )
}

// ============ DASHBOARD ============
function Dashboard({rooms, bookings, services, occRate, todayRev, setPage, fmt, today, fmtDate}) {
  const active = bookings.filter(b => b.status === 'active')
  const todayCI = bookings.filter(b => b.checkin_date === today() && b.status === 'active').length
  const todayCO = bookings.filter(b => b.co_date === today() && b.status === 'checkedout').length
  const departures = bookings.filter(b => b.expected_co === today() && b.status === 'active')

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20}}>
        {[
          {label:'Today Revenue', val:'PKR '+fmt(todayRev), icon:'💰', color:'#c9922a'},
          {label:'Occupancy', val:occRate+'%', icon:'🏨', color:'#1a3a6e'},
          {label:'Check-ins Today', val:todayCI, icon:'✅', color:'#2c5f2e'},
          {label:'Departures', val:departures.length, icon:'🚪', color:'#8b2500'},
        ].map((k,i) => (
          <div key={i} style={{background:'white', borderRadius:12, padding:16, border:'1px solid #e0cfa0', boxShadow:'0 2px 8px rgba(26,18,8,0.06)', position:'relative', overflow:'hidden'}}>
            <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:k.color}}/>
            <div style={{fontSize:22, marginBottom:6}}>{k.icon}</div>
            <div style={{fontSize:10, fontWeight:700, color:'#9a8060', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4}}>{k.label}</div>
            <div style={{fontSize:22, fontWeight:900, color:k.color}}>{k.val}</div>
          </div>
        ))}
      </div>

      <div style={{background:'white', borderRadius:12, border:'1px solid #e0cfa0', boxShadow:'0 2px 8px rgba(26,18,8,0.06)', overflow:'hidden', marginBottom:16}}>
        <div style={{padding:'14px 18px', background:'linear-gradient(135deg,#1a1208,#2c2010)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h3 style={{fontSize:13, fontWeight:700, color:'#e6b84a', margin:0}}>🏨 Live Room Grid</h3>
          <button onClick={() => setPage('checkin')} style={{background:'#c9922a', color:'#1a1208', border:'none', borderRadius:6, padding:'6px 14px', fontSize:11, fontWeight:700, cursor:'pointer'}}>+ Check In</button>
        </div>
        <div style={{padding:16}}>
          {rooms.length === 0 ? <div style={{textAlign:'center', padding:40, color:'#9a8060'}}>No rooms — go to Room Setup first</div> : (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:10}}>
              {rooms.map(room => {
                const bk = active.find(b => b.room_id === room.id)
                const status = bk ? 'occupied' : room.status
                const colors = {available:{bg:'#e8f5e9', border:'#a5d6a7', text:'#2c5f2e'}, occupied:{bg:'#ffebee', border:'#ef9a9a', text:'#8b2500'}, maintenance:{bg:'#fff8e1', border:'#ffe082', text:'#8b6000'}}
                const c = colors[status] || colors.available
                return (
                  <div key={room.id} onClick={() => setPage(bk ? 'checkout' : 'checkin')} style={{background:c.bg, border:`2px solid ${c.border}`, borderRadius:8, padding:12, cursor:'pointer', textAlign:'center', transition:'all 0.15s'}}>
                    <div style={{fontSize:16, fontWeight:900, color:c.text}}>{room.name}</div>
                    <div style={{fontSize:9, color:'#5c4a2a', fontWeight:700, textTransform:'uppercase', marginTop:2}}>{room.type}</div>
                    {bk && <div style={{fontSize:10, marginTop:3, fontWeight:700, color:'#1a1208'}}>{bk.customer_name?.split(' ')[0]}</div>}
                    <div style={{fontSize:9, fontWeight:700, color:c.text, marginTop:2, textTransform:'uppercase'}}>{status}</div>
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

// ============ CHECK IN ============
function CheckIn({rooms, bookings, session, currentProp, supabase, refresh, fmt, today}) {
  const avail = rooms.filter(r => r.status === 'available' && !bookings.find(b => b.room_id === r.id && b.status === 'active'))
  const [f, setF] = useState({room_id:'', customer_name:'', mobile_no:'', cnic:'', checkin_date:today(), checkout_date:'', days:1, rate:0, advance:0, discount:0, payment_mode:'Cash', notes:''})
  const [saving, setSaving] = useState(false)
  const selRoom = rooms.find(r => r.id === f.room_id)
  const roomBill = (f.rate||0) * (f.days||1)
  const grand = roomBill - (f.discount||0)
  const payable = grand - (f.advance||0)

  const save = async () => {
    if (!f.room_id) { toast.error('Select a room'); return }
    if (!f.customer_name.trim()) { toast.error('Guest name required'); return }
    setSaving(true)
    try {
      const formNo = 'LMY-' + Date.now().toString().slice(-6)
      await supabase.from('bookings').insert({property_id:currentProp.id, room_id:f.room_id, room_name:selRoom?.name, form_no:formNo, customer_name:f.customer_name, mobile_no:f.mobile_no, cnic:f.cnic, checkin_date:f.checkin_date, checkout_date:f.checkout_date||null, expected_co:f.checkout_date||null, days:f.days, rate:f.rate, advance:f.advance, discount:f.discount, room_bill:roomBill, grand:grand, payable:payable, payment_mode:f.payment_mode, notes:f.notes, status:'active', checked_in_by:session.name})
      await supabase.from('rooms').update({status:'occupied'}).eq('id', f.room_id)
      toast.success(f.customer_name + ' checked in to ' + selRoom?.name)
      setF({room_id:'', customer_name:'', mobile_no:'', cnic:'', checkin_date:today(), checkout_date:'', days:1, rate:0, advance:0, discount:0, payment_mode:'Cash', notes:''})
      await refresh()
    } catch(e) { toast.error('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr 300px', gap:16}}>
      <div style={{background:'white', borderRadius:12, border:'1px solid #e0cfa0', overflow:'hidden'}}>
        <div style={{padding:'14px 18px', background:'linear-gradient(135deg,#1a1208,#2c2010)'}}><h3 style={{color:'#e6b84a', margin:0, fontSize:13, fontWeight:700}}>✅ New Check In</h3></div>
        <div style={{padding:18}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12}}>
            <div style={{gridColumn:'1/-1'}}><label style={{fontSize:10, fontWeight:700, color:'#5c4a2a', textTransform:'uppercase', display:'block', marginBottom:5}}>Room *</label><select style={{width:'100%', padding:'9px 12px', border:'1.5px solid #e0cfa0', borderRadius:8, fontSize:13, outline:'none'}} value={f.room_id} onChange={e=>{const rm=rooms.find(r=>r.id===e.target.value); setF(p=>({...p,room_id:e.target.value,rate:rm?.rate||0}))}}><option value="">-- Select Available Room --</option>{avail.map(r=><option key={r.id} value={r.id}>{r.name} — {r.type} — PKR {fmt(r.rate)}/night</option>)}</select></div>
            {[['Guest Name *','customer_name','text'],['Mobile','mobile_no','text'],['CNIC','cnic','text'],['Check-in Date','checkin_date','date'],['Check-out Date','checkout_date','date'],['Nights','days','number']].map(([lbl,key,type])=>(
              <div key={key}><label style={{fontSize:10, fontWeight:700, color:'#5c4a2a', textTransform:'uppercase', display:'block', marginBottom:5}}>{lbl}</label><input type={type} style={{width:'100%', padding:'9px 12px', border:'1.5px solid #e0cfa0', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box'}} value={f[key]} onChange={e=>setF(p=>({...p,[key]:type==='number'?+e.target.value:e.target.value}))}/></div>
            ))}
            {[['Rate/Night (PKR)','rate','number'],['Advance (PKR)','advance','number'],['Discount (PKR)','discount','number']].map(([lbl,key,type])=>(
              <div key={key}><label style={{fontSize:10, fontWeight:700, color:'#5c4a2a', textTransform:'uppercase', display:'block', marginBottom:5}}>{lbl}</label><input type={type} style={{width:'100%', padding:'9px 12px', border:'1.5px solid #e0cfa0', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box'}} value={f[key]} onChange={e=>setF(p=>({...p,[key]:+e.target.value}))}/></div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <div style={{background:'white', borderRadius:12, border:'1px solid #e0cfa0', overflow:'hidden', marginBottom:12}}>
          <div style={{padding:'14px 18px', background:'linear-gradient(135deg,#1a1208,#2c2010)'}}><h3 style={{color:'#e6b84a', margin:0, fontSize:13, fontWeight:700}}>💰 Bill</h3></div>
          <div style={{padding:16}}>
            {[['Room', selRoom?.name||'-'],['Rate/Night','PKR '+fmt(f.rate)],['Nights',f.days],['Room Bill','PKR '+fmt(roomBill)],['Discount','- PKR '+fmt(f.discount)],['GRAND TOTAL','PKR '+fmt(grand)],['Advance','- PKR '+fmt(f.advance)],['BALANCE DUE','PKR '+fmt(payable)]].map(([l,v],i)=>(
              <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #f5f0e8', fontSize: i>=6?13:12}}>
                <span style={{color:'#5c4a2a'}}>{l}</span>
                <span style={{fontWeight: i>=6?900:600, color: i===7?'#8b2500':'#1a1208'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={save} disabled={saving} style={{width:'100%', padding:'12px', background:'#c9922a', color:'#1a1208', border:'none', borderRadius:8, fontSize:14, fontWeight:800, cursor:'pointer'}}>{saving?'Processing...':'✅ Complete Check In'}</button>
      </div>
    </div>
  )
}

// ============ CHECK OUT ============
function CheckOut({bookings, services, session, currentProp, supabase, refresh, fmt, today, fmtDate}) {
  const active = bookings.filter(b => b.status === 'active')
  const [selId, setSelId] = useState('')
  const [loading, setLoading] = useState(false)
  const bk = active.find(b => b.id === selId)
  const svcTotal = services.filter(s => s.booking_id === selId).reduce((s,sv)=>s+(sv.total||0),0)
  const totalBill = (bk?.room_bill||0) + svcTotal
  const balance = totalBill - (bk?.advance||0)

  const checkout = async () => {
    if (!bk) { toast.error('Select a guest'); return }
    setLoading(true)
    try {
      await supabase.from('bookings').update({status:'checkedout', co_date:today(), svc_total:svcTotal, grand:totalBill, payable:balance, checked_out_by:session.name}).eq('id', bk.id)
      await supabase.from('rooms').update({status:'available'}).eq('id', bk.room_id)
      toast.success(bk.customer_name + ' checked out!')
      setSelId('')
      await refresh()
    } catch(e) { toast.error('Error: ' + e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
      <div style={{background:'white', borderRadius:12, border:'1px solid #e0cfa0', overflow:'hidden'}}>
        <div style={{padding:'14px 18px', background:'linear-gradient(135deg,#1a1208,#2c2010)'}}><h3 style={{color:'#e6b84a', margin:0, fontSize:13, fontWeight:700}}>🚪 Active Guests</h3></div>
        {active.length === 0 ? <div style={{textAlign:'center', padding:40, color:'#9a8060'}}>No active guests</div> : active.map(b=>(
          <div key={b.id} onClick={()=>setSelId(b.id)} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid #e0cfa0', cursor:'pointer', background:selId===b.id?'#f5f0e8':'white', borderLeft:selId===b.id?'3px solid #c9922a':'3px solid transparent'}}>
            <div><div style={{fontWeight:700, fontSize:13}}>{b.customer_name}</div><div style={{fontSize:11, color:'#9a8060'}}>{b.room_name} · {fmtDate(b.checkin_date)}</div></div>
            <div style={{textAlign:'right'}}><div style={{fontWeight:800, color:'#8b2500', fontSize:13}}>PKR {fmt(b.payable)}</div><div style={{fontSize:10, color:'#9a8060'}}>balance</div></div>
          </div>
        ))}
      </div>
      <div>
        {bk ? (
          <div style={{background:'white', borderRadius:12, border:'1px solid #e0cfa0', overflow:'hidden'}}>
            <div style={{padding:'14px 18px', background:'linear-gradient(135deg,#1a1208,#2c2010)'}}><h3 style={{color:'#e6b84a', margin:0, fontSize:13, fontWeight:700}}>💰 Final Bill — {bk.customer_name}</h3></div>
            <div style={{padding:16}}>
              {[['Room',bk.room_name],['Check-in',fmtDate(bk.checkin_date)],['Nights',bk.days],['Room Bill','PKR '+fmt(bk.room_bill)],['Services','PKR '+fmt(svcTotal)],['TOTAL BILL','PKR '+fmt(totalBill)],['Advance','- PKR '+fmt(bk.advance)],['BALANCE DUE','PKR '+fmt(balance)]].map(([l,v],i)=>(
                <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f5f0e8', fontSize:i>=5?13:12}}>
                  <span style={{color:'#5c4a2a'}}>{l}</span>
                  <span style={{fontWeight:i>=5?900:600, color:i===7?'#8b2500':'#1a1208'}}>{v}</span>
                </div>
              ))}
              <button onClick={checkout} disabled={loading} style={{width:'100%', marginTop:16, padding:'11px', background:'#8b2500', color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:800, cursor:'pointer'}}>{loading?'Processing...':'🚪 Complete Check Out'}</button>
            </div>
          </div>
        ) : <div style={{background:'white', borderRadius:12, border:'1px solid #e0cfa0', padding:40, textAlign:'center', color:'#9a8060'}}>Select a guest to check out</div>}
      </div>
    </div>
  )
}

// ============ HISTORY ============
function History({bookings, fmt, fmtDate}) {
  const done = bookings.filter(b => b.status === 'checkedout').slice(0,50)
  return (
    <div style={{background:'white', borderRadius:12, border:'1px solid #e0cfa0', overflow:'hidden'}}>
      <div style={{padding:'14px 18px', background:'linear-gradient(135deg,#1a1208,#2c2010)'}}><h3 style={{color:'#e6b84a', margin:0, fontSize:13, fontWeight:700}}>📋 Checkout History</h3></div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead><tr>{['Form#','Guest','Room','Check-in','Check-out','Amount'].map(h=><th key={h} style={{background:'#1a1208', color:'#e6b84a', padding:'10px 12px', fontSize:10, fontWeight:700, textTransform:'uppercase', textAlign:'left', whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
          <tbody>
            {done.length === 0 && <tr><td colSpan={6} style={{textAlign:'center', padding:40, color:'#9a8060'}}>No checkout history</td></tr>}
            {done.map(b=><tr key={b.id} style={{borderBottom:'1px solid #e0cfa0'}}>
              <td style={{padding:'10px 12px', fontSize:12}}>{b.form_no}</td>
              <td style={{padding:'10px 12px', fontSize:12, fontWeight:700}}>{b.customer_name}</td>
              <td style={{padding:'10px 12px', fontSize:12}}>{b.room_name}</td>
              <td style={{padding:'10px 12px', fontSize:12}}>{fmtDate(b.checkin_date)}</td>
              <td style={{padding:'10px 12px', fontSize:12}}>{fmtDate(b.co_date)}</td>
              <td style={{padding:'10px 12px', fontSize:12, fontWeight:800, color:'#c9922a'}}>PKR {fmt(b.grand)}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============ ROOM SETUP ============
function RoomSetup({rooms, setRooms, currentProp, supabase, refresh}) {
  const [f, setF] = useState({name:'', type:'Standard', floor:'', rate:0, capacity:2})
  const [saving, setSaving] = useState(false)
  const TYPES = ['Standard','Deluxe','Suite','Executive','Family']

  const save = async () => {
    if (!f.name.trim()) { toast.error('Room name required'); return }
    if (!currentProp) { toast.error('No property selected'); return }
    setSaving(true)
    try {
      await supabase.from('rooms').insert({property_id:currentProp.id, name:f.name, type:f.type, floor:f.floor, rate:f.rate, capacity:f.capacity, status:'available'})
      toast.success('Room ' + f.name + ' added!')
      setF({name:'', type:'Standard', floor:'', rate:0, capacity:2})
      await refresh()
    } catch(e) { toast.error('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!window.confirm('Delete this room?')) return
    await supabase.from('rooms').delete().eq('id', id)
    await refresh()
  }

  return (
    <div>
      <div style={{background:'white', borderRadius:12, border:'1px solid #e0cfa0', overflow:'hidden', marginBottom:16}}>
        <div style={{padding:'14px 18px', background:'linear-gradient(135deg,#1a1208,#2c2010)'}}><h3 style={{color:'#e6b84a', margin:0, fontSize:13, fontWeight:700}}>⚙️ Add New Room</h3></div>
        <div style={{padding:18}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:14}}>
            {[['Room Name *','name','text'],['Floor','floor','text']].map(([lbl,key,type])=>(
              <div key={key}><label style={{fontSize:10, fontWeight:700, color:'#5c4a2a', textTransform:'uppercase', display:'block', marginBottom:5}}>{lbl}</label><input type={type} style={{width:'100%', padding:'9px 12px', border:'1.5px solid #e0cfa0', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box'}} value={f[key]} onChange={e=>setF(p=>({...p,[key]:e.target.value}))}/></div>
            ))}
            <div><label style={{fontSize:10, fontWeight:700, color:'#5c4a2a', textTransform:'uppercase', display:'block', marginBottom:5}}>Type</label><select style={{width:'100%', padding:'9px 12px', border:'1.5px solid #e0cfa0', borderRadius:8, fontSize:13, outline:'none'}} value={f.type} onChange={e=>setF(p=>({...p,type:e.target.value}))}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
            <div><label style={{fontSize:10, fontWeight:700, color:'#5c4a2a', textTransform:'uppercase', display:'block', marginBottom:5}}>Rate (PKR)</label><input type="number" style={{width:'100%', padding:'9px 12px', border:'1.5px solid #e0cfa0', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box'}} value={f.rate} onChange={e=>setF(p=>({...p,rate:+e.target.value}))}/></div>
            <div><label style={{fontSize:10, fontWeight:700, color:'#5c4a2a', textTransform:'uppercase', display:'block', marginBottom:5}}>Capacity</label><input type="number" style={{width:'100%', padding:'9px 12px', border:'1.5px solid #e0cfa0', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box'}} value={f.capacity} onChange={e=>setF(p=>({...p,capacity:+e.target.value}))}/></div>
          </div>
          <button onClick={save} disabled={saving} style={{background:'#c9922a', color:'#1a1208', border:'none', borderRadius:8, padding:'9px 20px', fontSize:12, fontWeight:800, cursor:'pointer'}}>{saving?'Saving...':'+ Add Room'}</button>
        </div>
      </div>
      <div style={{background:'white', borderRadius:12, border:'1px solid #e0cfa0', overflow:'hidden'}}>
        <div style={{padding:'14px 18px', background:'linear-gradient(135deg,#1a1208,#2c2010)'}}><h3 style={{color:'#e6b84a', margin:0, fontSize:13, fontWeight:700}}>🏠 All Rooms ({rooms.length})</h3></div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead><tr>{['Room','Type','Floor','Rate','Capacity','Status','Action'].map(h=><th key={h} style={{background:'#1a1208', color:'#e6b84a', padding:'10px 12px', fontSize:10, fontWeight:700, textTransform:'uppercase', textAlign:'left'}}>{h}</th>)}</tr></thead>
            <tbody>
              {rooms.length===0&&<tr><td colSpan={7} style={{textAlign:'center', padding:40, color:'#9a8060'}}>No rooms added yet</td></tr>}
              {rooms.map(r=><tr key={r.id} style={{borderBottom:'1px solid #e0cfa0'}}>
                <td style={{padding:'10px 12px', fontWeight:700, fontSize:13}}>{r.name}</td>
                <td style={{padding:'10px 12px', fontSize:12}}>{r.type}</td>
                <td style={{padding:'10px 12px', fontSize:12}}>{r.floor||'-'}</td>
                <td style={{padding:'10px 12px', fontSize:12, fontWeight:700, color:'#c9922a'}}>PKR {Number(r.rate||0).toLocaleString()}</td>
                <td style={{padding:'10px 12px', fontSize:12}}>{r.capacity}</td>
                <td style={{padding:'10px 12px'}}><span style={{background:r.status==='available'?'#e8f5e9':r.status==='occupied'?'#ffebee':'#fff8e1', color:r.status==='available'?'#2c5f2e':r.status==='occupied'?'#8b2500':'#8b6000', padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700}}>{r.status}</span></td>
                <td style={{padding:'10px 12px'}}><button onClick={()=>del(r.id)} style={{background:'#ffebee', color:'#8b2500', border:'none', borderRadius:6, padding:'4px 10px', fontSize:10, fontWeight:700, cursor:'pointer'}}>Delete</button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
