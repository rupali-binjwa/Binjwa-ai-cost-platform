import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Layers, Building2, UserCircle, KeyRound, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', textAlign: 'center' }}>
      
      <div style={{ width: 68, height: 68, borderRadius: 22, background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '1.5rem', boxShadow: '0 12px 30px rgba(99, 102, 241, 0.4)' }}>
        <Zap size={36} />
      </div>

      <h1 className="page-title" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>Binjwa AI Cost & Gateway Platform</h1>
      <p className="page-subtitle" style={{ maxWidth: '680px', margin: '0 auto 2.5rem auto', fontSize: '1.2rem', lineHeight: '1.6' }}>
        Enterprise-grade AI Gateway SDK & Smart Token Router. Integrate with Calling Agents, Chatbots, and LLM workflows to automatically track, allocate, and cut token costs by up to 65%.
      </p>

      <div style={{ marginBottom: '3rem' }}>
        <button 
          onClick={() => navigate('/login')} 
          className="btn" 
          style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.5)' }}
        >
          <KeyRound size={20} /> Access Enterprise Login Portal <ArrowRight size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div 
          onClick={() => navigate('/login?role=super_admin')} 
          className="card" 
          style={{ width: '280px', textAlign: 'center', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>
            <Layers size={42} />
          </div>
          <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Super Admin Portal</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Platform control, bulk token procurement, and organization onboarding.</p>
          <div style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>Login as Super Admin ➔</div>
        </div>

        <div 
          onClick={() => navigate('/login?role=client_admin')} 
          className="card" 
          style={{ width: '280px', textAlign: 'center', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--accent)' }}>
            <Building2 size={42} />
          </div>
          <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Client Admin (Gateway)</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Smart router auto-analysis, API/SDK keys, and agent cost optimization.</p>
          <div style={{ marginTop: '1rem', color: 'var(--accent)', fontWeight: 600, fontSize: '0.85rem' }}>Login as Client Admin ➔</div>
        </div>

        <div 
          onClick={() => navigate('/login?role=employee')} 
          className="card" 
          style={{ width: '280px', textAlign: 'center', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--success)' }}>
            <UserCircle size={42} />
          </div>
          <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Employee & Agent Portal</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Test prompt gateway, inspect calling agent logs, and monitor allowance.</p>
          <div style={{ marginTop: '1rem', color: 'var(--success)', fontWeight: 600, fontSize: '0.85rem' }}>Login as Employee ➔</div>
        </div>
      </div>

    </div>
  );
}
