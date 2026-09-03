import React from 'react'
import { useApp } from '../App'

export default function Housekeeping() {
  const { currentProp } = useApp()
  return (
    <div className="card">
      <div className="card-header"><h3>Housekeeping</h3></div>
      <div className="card-body">
        <div style={{textAlign:'center',padding:'40px',color:'var(--text3)'}}>
          <div style={{fontSize:40,marginBottom:12}}>🚧</div>
          <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>Housekeeping Module</div>
          <div style={{fontSize:12}}>Coming soon — full version being built</div>
        </div>
      </div>
    </div>
  )
}
